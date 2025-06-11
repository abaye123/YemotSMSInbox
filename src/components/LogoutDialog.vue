<template>
  <transition name="fade">
    <div 
      v-if="visible"
      @click="handleCancel"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">

      <div 
        class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all" 
        @click.stop>
        
        <!-- Header -->
        <div class="p-6 text-center border-b border-gray-100">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PowerIcon class="h-6 w-6 text-red-600" />
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            התנתקות מהמערכת
          </h3>
          
          <p class="text-gray-600">
            האם אתה בטוח שברצונך להתנתק מהמערכת?
          </p>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="p-4">
            <div class="flex items-center justify-center">
              <span class="text-lg text-gray-600">כעת אתה מחובר כמשתמש:
                <span class="text-lg font-medium text-indigo-600">{{ username }}</span>
              </span>
            </div>
          </div>

          <!--div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="mr-3">
                <p class="text-sm text-amber-800">
                  לאחר ההתנתקות תצטרך להזין שוב את פרטי ההתחברות
                </p>
              </div>
            </div>
          </div-->
        </div>

        <!-- Actions -->
        <div class="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
          <button 
            @click="handleCancel"
            class="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium">
            ביטול
          </button>
          
          <button 
            @click="handleConfirm"
            class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium">
            כן, התנתק
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { PowerIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .transform,
.fade-leave-active .transform {
  transition: transform 0.3s ease;
}

.fade-enter-from .transform {
  transform: scale(0.95) translateY(-10px);
}

.fade-leave-to .transform {
  transform: scale(0.95) translateY(-10px);
}
</style>