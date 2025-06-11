<template>
  <div :class="[
    !selectedId ? 'pr-0 md:pr-96' : 'pr-0 md:pr-96',
    'flex-1 flex flex-col h-full z-20 relative'
  ]">
    <div v-if="conversation" class="flex-1 flex flex-col">
      <!-- Header -->
      <MessageHeader 
        :conversation="conversation"
        @back="emit('back')"
        @refresh="emit('refreshMessages')"
        @logout="emit('logout')" />

      <!-- Messages Container -->
      <div 
        ref="messagesContainer" 
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        <MessageBubble
          v-for="msg in conversation.messages"
          :key="msg.id"
          :message="msg"
          :copied-code-id="copiedCodeId"
          @copy-verification-code="handleCopyVerificationCode" />
      </div>

      <!-- Message Input -->
      <MessageInput 
        :phone-number="conversation.contact"
        @message-sent="handleMessageSent"
        @send-error="handleSendError" />

      <!-- Scroll to bottom button -->
      <transition name="fade">
        <button 
          v-if="showScrollButton" 
          @click="scrollToBottom"
          class="fixed bottom-24 right-1/2 transform translate-x-1/2 z-20 bg-indigo-600 text-white border-gray-300 text-sm px-4 py-2 border rounded-full shadow-md hover:bg-indigo-500 transition-all"
          v-tippy="'חזור למטה'">
          חזור למטה
        </button>
      </transition>
    </div>

    <!-- Empty State -->
    <EmptyState 
      v-else
      :username="username"
      @logout="emit('logout')" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import MessageHeader from './MessageHeader.vue';
import MessageBubble from './MessageBubble.vue';
import MessageInput from './MessageInput.vue';
import EmptyState from './EmptyState.vue';

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

const emit = defineEmits(['refreshMessages', 'back', 'logout']);

const messagesContainer = ref(null);
const showScrollButton = ref(false);
const copiedCodeId = ref(null);

// Watch for conversation changes and scroll to bottom
watch(() => props.conversation, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// Setup scroll listener on mount
onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll);
  }
});

// Handle scroll to show/hide scroll button
function handleScroll() {
  if (!messagesContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // Show button when scrolled up more than 200px from bottom
  showScrollButton.value = scrollHeight - scrollTop - clientHeight > 200;
}

// Scroll to bottom of messages
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// Handle verification code copy
const handleCopyVerificationCode = (code, messageId) => {
  navigator.clipboard.writeText(code).then(() => {
    copiedCodeId.value = messageId;
    setTimeout(() => {
      copiedCodeId.value = null;
    }, 2000);
    console.log('קוד אימות הועתק:', code);
  }).catch(err => {
    console.error('שגיאה בהעתקת קוד האימות:', err);
  });
};

// Handle successful message send
const handleMessageSent = (sentMessage) => {
  emit('refreshMessages');
  nextTick(() => {
    scrollToBottom();
  });
  console.log('הודעה נשלחה:', sentMessage);
};

// Handle send error
const handleSendError = (errorMessage) => {
  alert(errorMessage);
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