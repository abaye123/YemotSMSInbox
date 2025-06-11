<script setup>
import { ref, onMounted } from 'vue';
import MainView from './components/MessagesMainView.vue';
import LoginDialog from './components/LoginDialog.vue';
import PrivacyPolicy from './components/PrivacyPolicy.vue';
import { 
  hasValidCredentials, 
  getSavedCredentials, 
  clearCredentials,
  validateCredentials 
} from './services/encryption.service';

const loginDialogVisible = ref(false);
const username = ref('');
const isLoading = ref(true);

const openPrivacyPolicy = () => {
  window.openPrivacyPolicy();
};

const handleLoginSuccess = (loggedInUsername) => {
  username.value = loggedInUsername;
  loginDialogVisible.value = false;
  console.log('התחברות הצליחה עבור:', loggedInUsername);
};

const handleLoginError = (error) => {
  console.error('שגיאה בהתחברות:', error);
};

const logout = () => {
  clearCredentials();
  // נקה גם את הlocalStorage הישן
  localStorage.removeItem('username');
  localStorage.removeItem('password');
  
  username.value = '';
  loginDialogVisible.value = true;
  document.title = 'סמייל פרו - תצוגת שיחות';
  console.log('המשתמש התנתק מהמערכת');
};

const init = async () => {
  isLoading.value = true;
  
  try {
    // בדוק אם יש פרטי התחברות שמורים
    const hasCredentials = await hasValidCredentials();
    
    if (hasCredentials) {
      const credentials = await getSavedCredentials();
      if (credentials) {
        const isValid = await validateCredentials();
        
        if (isValid) {
          username.value = credentials.username;
          document.title = 'מערכת סמסים - ' + credentials.username;
        } else {
          clearCredentials();
          loginDialogVisible.value = true;
        }
      } else {
        loginDialogVisible.value = true;
      }
    } else {
      console.log('לא נמצאו פרטי התחברות שמורים');
      loginDialogVisible.value = true;
    }
  } catch (error) {
    console.error('שגיאה באתחול:', error);
    clearCredentials();
    loginDialogVisible.value = true;
  } finally {
    isLoading.value = false;
  }
};

// Request notification permissions
const requestNotificationPermissions = () => {
  if ('Notification' in window && Notification.requestPermission) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('הרשאות התראות אושרו');
      } else {
        console.warn('הרשאות התראות נדחו');
      }
    });
  } else {
    console.warn('התראות לא נתמכות בדפדפן זה');
  }
};

onMounted(() => {
  init();
  requestNotificationPermissions();
});
</script>

<template>
  <div class="h-full">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="fixed inset-0 bg-white flex justify-center items-center z-50">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <p class="text-gray-600">טוען מערכת...</p>
      </div>
    </div>

    <!-- Main Application View -->
    <MainView 
      v-if="!isLoading && !loginDialogVisible && username" 
      :username="username" 
      @logout="logout" />

    <!-- Login Dialog -->
    <LoginDialog 
      :visible="loginDialogVisible && !isLoading"
      :should-focus="true"
      @login-success="handleLoginSuccess"
      @login-error="handleLoginError" />

    <!-- Privacy Policy -->
    <PrivacyPolicy />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Heebo', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  direction: rtl;
  font-size: 16px;
}

#app {
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>