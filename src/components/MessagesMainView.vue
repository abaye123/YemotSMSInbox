<template>
  <div class="flex h-full bg-gray-50 relative">
    <MessageView :conversation="selectedConversation" @refresh-messages="refreshMessages" :username="username"
      :selected-id="selectedConversationId" @back="selectedConversation = null, selectedConversationId = null"
      @logout="handleLogoutRequest" @create-conversation="handleCreateConversation" />

    <ConversationList :conversations="conversations" :selected-id="selectedConversationId"
      @select="handleConversationSelect" @refresh-messages="refreshMessages" @filter="filterConversations"
      @mark-all-as-read="markAllAsRead" />

    <LogoutDialog :visible="logoutDialogVisible" :username="username" @confirm="handleLogoutConfirm"
      @cancel="handleLogoutCancel" />
  </div>
</template>

<script setup>
import { ref, watchEffect, nextTick } from 'vue';
import ConversationList from './conversation-list/ConversationList.vue';
import MessageView from './conversation-view/MessageView.vue';
import LogoutDialog from './LogoutDialog.vue';
import { getSavedCredentials } from '../services/encryption.service';
import {
  getGoogleContacts,
  checkGoogleAuthStatus
} from '../services/google.service';
import { getAuthToken, getIncomingSms, getSmsOutLog } from '../utils/auth.js';

const props = defineProps({
  username: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['logout']);

const conversations = ref([]);
const selectedConversationId = ref(null);
const selectedConversation = ref(null);
const setRead = ref(null);
const logoutDialogVisible = ref(false);

const googleAuthStatus = ref({
  isAuthenticated: false,
  userEmail: '',
  contactCount: 0
});

const handleCreateConversation = (phoneNumber) => {
  const existingConversation = conversations.value.find(c => c.contact === phoneNumber);

  if (existingConversation) {
    handleConversationSelect(existingConversation.id);
  } else {
    createNewConversation(phoneNumber);
  }
};

const createNewConversation = (phoneNumber) => {
  const uniqueId = crypto.randomUUID();

  const newConversation = {
    id: String(uniqueId),
    contact: phoneNumber,
    name: phoneNumber,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + phoneNumber,
    lastMessage: null,
    messages: [],
    unreadCount: 0,
  };

  conversations.value.unshift(newConversation);
  handleConversationSelect(uniqueId);
};

const handleConversationSelect = (id) => {
  setRead.value = null;

  selectedConversationId.value = String(id);
  selectedConversation.value = conversations.value.find(c => String(c.id) === String(id)) || null;

  watchEffect(() => {
    nextTick(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }, {
    flush: 'post'
  });

  setRead.value = setTimeout(async () => {
    const readedArray = [];
    const incomingMessages = selectedConversation.value.messages?.filter(message => message.type === 'incoming');

    incomingMessages.forEach((message) => {
      if (!message.read) {
        readedArray.push({
          phone: message.sender,
          message: message.message,
          server_date: new Date(message.timestamp).getTime()
        });
      }
    });

    if (readedArray.length > 0) {
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          console.error('No authentication token available');
          return;
        }

        const readedMessagesFetch = await fetch(
          `https://www.call2all.co.il/ym/api/GetTextFile?token=${authToken}&what=ivr2:YemotSMSInboxReadedMessages.ini`
        );

        const readedMessagesRes = await readedMessagesFetch.json();
        let readedMessages = [];

        if (readedMessagesRes.message === "file does not exist") {
          await fetch(
            `https://www.call2all.co.il/ym/api/UploadTextFile?token=${authToken}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify(readedArray)}`
          );
        } else {
          const readedMessagesData = readedMessagesRes.contents;
          const readedMessagesObj = JSON.parse(readedMessagesData);

          readedMessages = readedMessagesObj;
          readedMessages = readedMessages.concat(readedArray);

          await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: authToken,
              what: 'ivr2:YemotSMSInboxReadedMessages.ini',
              contents: JSON.stringify(readedMessages)
            })
          });

          conversations.value = conversations.value.map(conversation => {
            if (conversation.id === id) {
              conversation.unreadCount = 0;
            }
            return conversation;
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }, 1000);
};

async function checkNewMessages() {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      console.error('No authentication token available for checking new messages');
      return;
    }

    const data = await getIncomingSms(1);
    const message = data.rows[0];

    const lastMessage = localStorage.getItem('lastMessage');
    if (lastMessage === JSON.stringify(message)) {
      return;
    }

    new Notification(
      message.source.startsWith('972') ? '0' + message.source.substring(3) : message.source,
      { body: message.message }
    );

    localStorage.setItem('lastMessage', JSON.stringify(message));
    await refreshMessages();
  } catch (error) {
    console.error('Error checking for new messages:', error);
  }
}

async function getMessages() {
  try {
    console.log('Getting messages and refreshing data...');

    const authToken = await getAuthToken();
    if (!authToken) {
      console.error('No authentication token available for getting messages');
      return;
    }

    const incomingData = await getIncomingSms();
    const outgoingData = await getSmsOutLog();

    let contacts = {};

    const googleContactsResult = await getGoogleContacts();

    if (googleContactsResult.isAuthenticated && googleContactsResult.contacts) {
      googleContactsResult.contacts.forEach(contact => {
        if (contact.phone && contact.name) {
          contacts[contact.phone] = contact.name;
        }
      });

      googleAuthStatus.value = {
        isAuthenticated: true,
        userEmail: googleContactsResult.userData?.email || '',
        contactCount: googleContactsResult.contacts.length
      };
    } else {
      googleAuthStatus.value = {
        isAuthenticated: false,
        userEmail: '',
        contactCount: 0
      };
    }

    const readedMessagesFetch = await fetch(
      `https://www.call2all.co.il/ym/api/GetTextFile?token=${authToken}&what=ivr2:YemotSMSInboxReadedMessages.ini`
    );

    const readedMessagesRes = await readedMessagesFetch.json();
    let readedMessages = [];

    if (readedMessagesRes.message === "file does not exist") {
      await fetch(
        `https://www.call2all.co.il/ym/api/UploadTextFile?token=${authToken}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify([])}`
      );
    } else {
      const readedMessagesData = readedMessagesRes.contents;
      const readedMessagesObj = JSON.parse(readedMessagesData);
      readedMessages = readedMessagesObj;
    }

    const incomingMsgs = incomingData.rows || [];
    const outgoingMsgs = outgoingData.rows || [];

    const incomingMessages = incomingMsgs.map((message) => {
      const phone = message.source.startsWith('972') ? '0' + message.source.substring(3) : message.source;
      return {
        ...message,
        dest: message.destination,
        phone: phone,
        server_date: message.receive_date,
        type: 'incoming',
        status: 'DELIVRD'
      };
    });

    const outgoingMessages = outgoingMsgs.map((message) => {
      return {
        dest: message.CallerId,
        phone: message.To,
        message: message.Message,
        server_date: message.Time,
        status: message.DeliveryReport,
        type: 'outgoing'
      };
    });

    localStorage.setItem('lastMessage', JSON.stringify(incomingMsgs[0]));
    conversations.value = [];

    let messages = incomingMessages.concat(outgoingMessages);
    messages.sort((a, b) => new Date(b.server_date) - new Date(a.server_date));

    const messagesBySender = messages.reduce((acc, message) => {
      const sender = message.phone;
      if (!acc[sender]) {
        acc[sender] = [];
      }
      acc[sender].push(message);
      return acc;
    }, {});

    const usedIds = new Set();

    for (let conversation of removeDuplicates(messages, 'phone')) {
      const lastMessageData = messagesBySender[conversation.phone][0];

      let uniqueId = crypto.randomUUID();
      while (usedIds.has(uniqueId)) {
        uniqueId = crypto.randomUUID();
      }
      usedIds.add(uniqueId);

      const msgs = messagesBySender[conversation.phone].reverse().map((message) => {
        let msgUniqueId = crypto.randomUUID();
        while (usedIds.has(msgUniqueId)) {
          msgUniqueId = crypto.randomUUID();
        }
        usedIds.add(msgUniqueId);

        return {
          id: msgUniqueId,
          sender: message.phone,
          content: message.message,
          timestamp: new Date(message.server_date),
          read: readedMessages.some(readedMessage =>
            readedMessage.phone === message.phone &&
            readedMessage.message === message.message &&
            readedMessage.server_date === new Date(message.server_date).getTime()
          ),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + message.phone,
          type: message.type,
          status: message.status,
        };
      });

      let lastMsgUniqueId = crypto.randomUUID();
      while (usedIds.has(lastMsgUniqueId)) {
        lastMsgUniqueId = crypto.randomUUID();
      }
      usedIds.add(lastMsgUniqueId);

      conversations.value.push({
        id: String(uniqueId),
        contact: conversation.phone,
        name: contacts[conversation.phone] || conversation.phone,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + conversation.phone,
        lastMessage: {
          id: lastMsgUniqueId,
          sender: lastMessageData.phone,
          content: lastMessageData.message,
          timestamp: new Date(lastMessageData.server_date),
          read: readedMessages.some(readedMessage =>
            readedMessages.phone === lastMessageData.phone &&
            readedMessages.message === lastMessageData.message &&
            readedMessages.server_date === new Date(lastMessageData.server_date).getTime()
          ),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + lastMessageData.phone,
          type: lastMessageData.type,
          status: lastMessageData.status,
        },
        messages: msgs,
        unreadCount: msgs.filter((message) => message.type == 'incoming' && message.read == false).length,
      });
    }

    window.dispatchEvent(new CustomEvent('googleAuthStatusUpdated'));
  } catch (err) {
    console.error('Error getting messages:', err);
  }
}

async function refreshMessages() {
  const phone = selectedConversation.value?.contact;
  await getMessages();

  if (phone) {
    handleConversationSelect(conversations.value.find(c => c.contact === phone)?.id || '');
  }
}

function filterConversations(filter) {
  const filtered = conversations.value.filter(conversation => conversation.unreadCount > 0);

  if (!filtered.length) return;

  if (filter) {
    conversations.value = filtered;
  } else {
    getMessages();
  }
}

function removeDuplicates(array, key) {
  return Array.from(
    new Map(array.map((item) => [item[key], item])).values()
  );
}

async function markAllAsRead() {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      console.error('No authentication token available for marking messages as read');
      return;
    }

    const allUnreadMessages = [];

    conversations.value.forEach(conversation => {
      const unreadIncomingMessages = conversation.messages.filter(
        message => message.type === 'incoming' && !message.read
      );

      unreadIncomingMessages.forEach(message => {
        console.log(message)
        allUnreadMessages.push({
          phone: message.sender,
          message: message.content,
          server_date: new Date(message.timestamp).getTime()
        });
      });
    });

    if (allUnreadMessages.length === 0) {
      console.log('No unread messages to mark as read');
      return;
    }

    const readedMessagesFetch = await fetch(
      `https://www.call2all.co.il/ym/api/GetTextFile?token=${authToken}&what=ivr2:YemotSMSInboxReadedMessages.ini`
    );

    const readedMessagesRes = await readedMessagesFetch.json();
    let readedMessages = [];

    if (readedMessagesRes.message === "file does not exist") {
      await fetch(
        `https://www.call2all.co.il/ym/api/UploadTextFile?token=${authToken}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify(allUnreadMessages)}`
      );
    } else {
      const readedMessagesData = readedMessagesRes.contents;
      readedMessages = JSON.parse(readedMessagesData);
      readedMessages = readedMessages.concat(allUnreadMessages);

      await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: authToken,
          what: 'ivr2:YemotSMSInboxReadedMessages.ini',
          contents: JSON.stringify(readedMessages)
        })
      });
    }

    conversations.value = conversations.value.map(conversation => ({
      ...conversation,
      unreadCount: 0,
      messages: conversation.messages.map(message => ({
        ...message,
        read: message.type === 'incoming' ? true : message.read
      }))
    }));

    if (selectedConversation.value) {
      selectedConversation.value = {
        ...selectedConversation.value,
        unreadCount: 0,
        messages: selectedConversation.value.messages.map(message => ({
          ...message,
          read: message.type === 'incoming' ? true : message.read
        }))
      };
    }

    console.log(`Marked ${allUnreadMessages.length} messages as read`);

  } catch (error) {
    console.error('Error marking all messages as read:', error);
    alert('שגיאה בסימון ההודעות כנקראו');
  }
}

const handleLogoutRequest = () => {
  logoutDialogVisible.value = true;
};

const handleLogoutConfirm = () => {
  logoutDialogVisible.value = false;
  emit('logout');
};

const handleLogoutCancel = () => {
  logoutDialogVisible.value = false;
};

const init = async () => {
  try {
    console.log('Checking Google auth status during initialization...');
    const status = await checkGoogleAuthStatus();
    googleAuthStatus.value = status;
    console.log('Initial Google auth status:', status);

    window.dispatchEvent(new CustomEvent('googleAuthStatusUpdated'));
  } catch (error) {
    console.error('Error checking Google auth status during init:', error);
  }

  await getMessages();
  setInterval(checkNewMessages, 5000);
};

init();

window.addEventListener('googleAuthStatusChanged', async () => {
  console.log('Google auth status changed, refreshing data...');
  await getMessages();
});
</script>