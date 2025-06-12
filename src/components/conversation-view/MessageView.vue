<template>
  <div :class="[
    !selectedId ? 'pr-0 md:pr-96' : 'pr-0 md:pr-96',
    'flex-1 flex flex-col h-full z-20 relative'
  ]">
    <div v-if="conversation" class="flex-1 flex flex-col">
      <MessageHeader :conversation="conversation" @back="emit('back')" @refresh="emit('refreshMessages')"
        @logout="emit('logout')" />

      <div ref="messagesContainer" class="flex-1 overflow-y-auto bg-white">

        <EmptyMessagesState v-if="!conversation.messages || conversation.messages.length === 0" :conversation="conversation"/>

        <div v-else class="p-4 space-y-4">
          <MessageBubble v-for="msg in conversation.messages" :key="msg.id" :message="msg"
            :copied-code-id="copiedCodeId" @copy-verification-code="handleCopyVerificationCode" />
        </div>
      </div>

      <MessageInput :phone-number="conversation.contact" @message-sent="handleMessageSent"
        @send-error="handleSendError" />

      <transition name="fade">
        <button v-if="showScrollButton" @click="scrollToBottom"
          class="fixed bottom-24 right-1/2 transform translate-x-1/2 z-20 bg-indigo-600 text-white border-gray-300 text-sm px-4 py-2 border rounded-full shadow-md hover:bg-indigo-500 transition-all">
          חזור למטה
        </button>
      </transition>
    </div>

    <NewConversationView v-else-if="showNewConversation" @back="handleBackFromNewConversation" @logout="emit('logout')"
      @start-conversation="handleStartConversation" />

    <EmptyState v-else :username="username" @logout="emit('logout')" @new-conversation="handleNewConversation" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import MessageHeader from './MessageHeader.vue';
import MessageBubble from './MessageBubble.vue';
import MessageInput from './MessageInput.vue';
import EmptyState from './EmptyState.vue';
import NewConversationView from './NewConversationView.vue';
import EmptyMessagesState from './EmptyMessagesState.vue';


const props = defineProps({
  conversation: {
    type: Object,
    default: null
  },
  username: {
    type: String,
    default: ''
  },
  selectedId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['refreshMessages', 'back', 'logout', 'create-conversation']);

const messagesContainer = ref(null);
const showScrollButton = ref(false);
const copiedCodeId = ref(null);
const showNewConversation = ref(false);

watch(() => props.conversation, () => {
  if (props.conversation) {
    showNewConversation.value = false;
  }
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

onMounted(() => {
  if (messagesContainer.value && showNewConversation.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll);
  }
});

function handleScroll() {
  if (!messagesContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  showScrollButton.value = scrollHeight - scrollTop - clientHeight > 200;
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

const handleCopyVerificationCode = (code, messageId) => {
  navigator.clipboard.writeText(code).then(() => {
    copiedCodeId.value = messageId;
    setTimeout(() => {
      copiedCodeId.value = null;
    }, 2000);
    console.log('Verification code copied:', code);
  }).catch(err => {
    console.error('Error copying verification code:', err);
  });
};

const handleMessageSent = (sentMessage) => {
  emit('refreshMessages');
  nextTick(() => {
    scrollToBottom();
  });
  console.log('Message sent:', sentMessage);
};

const handleSendError = (errorMessage) => {
  alert(errorMessage);
};

const handleNewConversation = () => {
  showNewConversation.value = true;
};

const handleBackFromNewConversation = () => {
  showNewConversation.value = false;
};

const handleStartConversation = (phoneNumber) => {
  showNewConversation.value = false;
  emit('create-conversation', phoneNumber);
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>