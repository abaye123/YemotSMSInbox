<template>
  <div :class="[
    selectedId ? 'hidden md:block md:w-96' : 'w-full md:w-96',
    'border-l border-gray-200 h-full overflow-y-auto fixed top-0 right-0 bg-white z-30 transition-all'
  ]">
    <!-- Header -->
    <ConversationListHeader
      :google-status="googleStatus"
      :has-unread-messages="hasUnreadMessages"
      :unread-count="totalUnreadCount"
      :filter="filter"
      @google-login="handleGoogleLogin"
      @google-logout="handleGoogleLogout"
      @new-message="openNewMessageDialog"
      @toggle-filter="toggleFilter"
      @mark-all-as-read="markAllAsRead" />

    <!-- Google Status Info -->
    <GoogleStatusBar :google-status="googleStatus" />

    <!-- Search Bar -->
    <SearchBar v-model:search-query="searchQuery" />

    <!-- Conversation List -->
    <div v-if="filteredConversations.length">
      <ConversationItem
        v-for="conversation in filteredConversations" 
        :key="conversation.id"
        :conversation="conversation"
        :selected-id="selectedId"
        @select="emit('select', $event)" />
    </div>

    <!-- Empty States -->
    <ConversationListEmptyStates
      v-else-if="searchQuery && !filteredConversations.length"
      type="search"
      :search-query="searchQuery" />

    <ConversationListEmptyStates
      v-else-if="!conversations.length"
      type="loading" />

    <!-- New Message Dialog -->
    <NewMessageDialog 
      :visible="newMessageDialogVisible" 
      :should-focus="true" 
      @success="handleNewMessageSuccess"
      @cancel="handleNewMessageCancel" 
      @error="handleNewMessageError" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Import child components
import ConversationListHeader from './ConversationListHeader.vue';
import GoogleStatusBar from './GoogleStatusBar.vue';
import SearchBar from './SearchBar.vue';
import ConversationItem from './ConversationItem.vue';
import ConversationListEmptyStates from './ConversationListEmptyStates.vue';
import NewMessageDialog from '../NewMessageDialog.vue';

// Import Google services
import {
  checkGoogleAuthStatus,
  initiateGoogleLogin,
  logoutFromGoogle
} from '../../services/google.service';

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: String,
    default: null
  }
});

const emit = defineEmits([
  'select', 
  'refreshMessages', 
  'filter', 
  'markAllAsRead'
]);

// Reactive data
const newMessageDialogVisible = ref(false);
const filter = ref(false);
const searchQuery = ref('');

const googleStatus = ref({
  isAuthenticated: false,
  userEmail: '',
  contactCount: 0
});

// Computed properties
const filteredConversations = computed(() => {
  if (!searchQuery.value) return props.conversations;

  const query = searchQuery.value.toLowerCase();
  return props.conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(query) ||
    conversation.lastMessage?.content?.toLowerCase().includes(query)
  );
});

const hasUnreadMessages = computed(() => {
  return props.conversations.some(conversation => conversation.unreadCount > 0);
});

const totalUnreadCount = computed(() => {
  return props.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
});

// Methods
const openNewMessageDialog = () => {
  newMessageDialogVisible.value = true;
};

const toggleFilter = () => {
  filter.value = !filter.value;
  emit('filter', filter.value);
};

const markAllAsRead = () => {
  if (confirm('האם אתה בטוח שברצונך לסמן את כל ההודעות כנקראו?')) {
    emit('markAllAsRead');
  }
};

// Google Auth Methods
const handleGoogleStatusUpdate = async () => {
  console.log('Received googleAuthStatusUpdated event in ConversationList');
  await checkGoogleStatus();
};

const checkGoogleStatus = async () => {
  try {
    const status = await checkGoogleAuthStatus();
    googleStatus.value = status;
    console.log('Google Auth Status updated in ConversationList:', status);
  } catch (error) {
    console.error('Error checking Google auth status in ConversationList:', error);
  }
};

const handleGoogleLogin = async () => {
  console.log('Initiating Google login...');
  try {
    await initiateGoogleLogin();

    let attempts = 0;
    const maxAttempts = 20;

    const checkLoginStatus = async () => {
      attempts++;
      const status = await checkGoogleAuthStatus();
      console.log(`Login status check attempt ${attempts}:`, status);

      if (status.isAuthenticated) {
        googleStatus.value = status;
        emit('refreshMessages');
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(checkLoginStatus, 500);
      }
    };

    setTimeout(checkLoginStatus, 1000);
  } catch (error) {
    console.error('Error during Google login:', error);
    alert('שגיאה בתהליך ההתחברות לגוגל. אנא נסה שוב.');
  }
};

const handleGoogleLogout = async () => {
  const confirmLogout = confirm('האם אתה בטוח שברצונך להפסיק את הסנכרון עם גוגל?');
  if (!confirmLogout) return;
  
  console.log('Logging out from Google...');
  await logoutFromGoogle();
  await checkGoogleStatus();
  emit('refreshMessages');
};

// New Message Dialog Methods
const handleNewMessageSuccess = (messageData) => {
  newMessageDialogVisible.value = false;
  emit('refreshMessages');
  console.log('הודעה חדשה נשלחה בהצלחה:', messageData);
};

const handleNewMessageCancel = () => {
  newMessageDialogVisible.value = false;
};

const handleNewMessageError = (error) => {
  console.error('שגיאה בשליחת הודעה חדשה:', error);
};

// Lifecycle hooks
onMounted(() => {
  checkGoogleStatus();
  window.addEventListener('googleAuthStatusUpdated', handleGoogleStatusUpdate);
  window.addEventListener('googleAuthStatusChanged', handleGoogleStatusUpdate);
});

onUnmounted(() => {
  window.removeEventListener('googleAuthStatusUpdated', handleGoogleStatusUpdate);
  window.removeEventListener('googleAuthStatusChanged', handleGoogleStatusUpdate);
});
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