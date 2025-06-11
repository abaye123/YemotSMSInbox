<template>
  <transition name="fade">
    <div 
      v-if="visible" 
      @click="handleBackdropClick"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4"
      style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">

      <div 
        class="bg-white p-6 rounded-xl shadow-xl w-full max-w-md" 
        @click.stop 
        style="transform-origin: center">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-xl font-bold text-gray-800">שלח הודעה חדשה</h3>
          <button 
            @click="hasFormData && !loading ? showConfirmDialog = true : handleCancel()" 
            class="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSend" class="space-y-4">
          <!-- Phone Number Input -->
          <label 
            for="phone"
            class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors bg-white">
            <input 
              v-model="phoneNumber" 
              type="text" 
              id="phone" 
              placeholder="מספר הטלפון של הנמען"
              :autofocus="shouldFocus"
              required
              class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm text-gray-900"
              dir="rtl" />
            <span
              class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              מספר טלפון
            </span>
          </label>

          <!-- Message Input -->
          <label 
            for="message"
            class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors bg-white">
            <textarea 
              v-model="messageText" 
              id="message" 
              placeholder="הודעה"
              required
              class="peer h-32 w-full border-none bg-transparent p-0 pt-2 placeholder-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm text-gray-900 resize-none"
              dir="rtl"></textarea>
            <span
              class="absolute start-3 top-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
              הודעה
            </span>
          </label>

          <!-- Send Button -->
          <button 
            type="submit"
            :disabled="loading || !phoneNumber || !messageText" 
            :class="[
              loading || !phoneNumber || !messageText ? 'bg-opacity-70 cursor-not-allowed' : 'hover:bg-indigo-500',
              'mt-2 transition-all w-full px-4 py-3 text-white bg-indigo-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium'
            ]">
            <span v-if="!loading">שלח הודעה</span>
            <span v-else class="flex justify-center items-center">
              <svg class="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              שולח הודעה...
            </span>
          </button>
        </form>
      </div>
    </div>
  </transition>

  <!-- Confirmation Dialog -->
  <transition name="fade">
    <div 
      v-if="showConfirmDialog"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-[60] p-4"
      style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
      
      <div 
        class="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all" 
        @click.stop>
        
        <!-- Header -->
        <div class="p-6 text-center border-b border-gray-100">
          <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 class="text-lg font-bold text-gray-900 mb-2">
            שמירת השינויים
          </h3>
          
          <p class="text-gray-600 text-sm">
            יש לך נתונים שלא נשמרו. האם אתה בטוח שברצונך לסגור את החלון?
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
          <button 
            @click="cancelDiscard"
            class="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium">
            המשך עריכה
          </button>
          
          <button 
            @click="confirmDiscard"
            class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium">
            סגור בלי לשמור
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { getAuthToken } from '../utils/auth.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  shouldFocus: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['success', 'cancel', 'error']);

const phoneNumber = ref('');
const messageText = ref('');
const loading = ref(false);
const error = ref('');
const showConfirmDialog = ref(false);

// Reset form when dialog becomes visible
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetForm();
    nextTick(() => {
      if (props.shouldFocus) {
        document.getElementById('phone')?.focus();
      }
    });
  }
});

// Check if form has data
const hasFormData = computed(() => {
  return phoneNumber.value.trim() || messageText.value.trim();
});

const resetForm = () => {
  phoneNumber.value = '';
  messageText.value = '';
  loading.value = false;
  error.value = '';
  showConfirmDialog.value = false;
};

const handleBackdropClick = () => {
  if (hasFormData.value && !loading.value) {
    showConfirmDialog.value = true;
  } else {
    handleCancel();
  }
};

const handleCancel = () => {
  resetForm();
  emit('cancel');
};

const confirmDiscard = () => {
  showConfirmDialog.value = false;
  handleCancel();
};

const cancelDiscard = () => {
  showConfirmDialog.value = false;
};

const handleSend = async () => {
  loading.value = true;
  error.value = '';

  if (!phoneNumber.value || !messageText.value) {
    error.value = 'כל השדות הינם שדות חובה!';
    loading.value = false;
    return;
  }

  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      error.value = 'שגיאה: לא נמצא טוקן אימות';
      loading.value = false;
      return;
    }

    const response = await fetch(
      `https://www.call2all.co.il/ym/api/SendSms?token=${authToken}&phones=${phoneNumber.value}&message=${messageText.value}`
    );

    const data = await response.json();

    if (data.responseStatus === 'OK') {
      resetForm();
      emit('success', {
        phone: phoneNumber.value,
        message: messageText.value
      });
    } else {
      error.value = 'שגיאה בשליחת ההודעה: ' + data.message;
      loading.value = false;
    }
  } catch (err) {
    error.value = 'שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.';
    console.error('Send message error:', err);
    loading.value = false;
  }
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