<template>
  <div class="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
    <!-- Left Side - Contact Info -->
    <div class="space-x-3 space-x-reverse flex items-center">
      <button 
        class="p-2 rounded-full text-indigo-600 hover:bg-gray-100 transition" 
        v-tippy="'חזור'"
        @click="emit('back')">
        <ArrowRight class="h-6 w-6" />
      </button>

      <div class="relative">
        <img 
          :src="conversation.avatar" 
          alt="" 
          class="h-10 w-10 rounded-full border border-gray-200 shadow-sm" />
        <div 
          v-if="conversation.unreadCount > 0"
          class="absolute -top-1 -right-1 flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white">
          <span class="text-xs text-white font-medium">
            {{ conversation.unreadCount }}
          </span>
        </div>
      </div>

      <div class="-my-1">
        <h2 class="text-lg font-medium text-gray-900">
          {{ conversation.name }}
        </h2>
        <h3 
          v-if="conversation.name !== conversation.contact" 
          class="text-xs text-gray-500">
          {{ conversation.contact }}
        </h3>
      </div>
    </div>

    <!-- Right Side - Action Buttons -->
    <div class="flex items-center gap-2">
      <!-- Export Button Component -->
      <ExportButton :conversation="conversation" />

      <button 
        class="p-2 rounded-full text-indigo-600 hover:bg-gray-100 transition" 
        v-tippy="'רענן הודעות'"
        @click="emit('refresh')">
        <RefreshCcw class="h-6 w-6" />
      </button>

      <button 
        class="p-2 rounded-full text-red-600 hover:bg-gray-100 transition" 
        v-tippy="'התנתק'" 
        @click="emit('logout')">
        <Power class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, Power, ArrowRight } from 'lucide-vue-next';
import ExportButton from './ExportButton.vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['back', 'refresh', 'logout']);
</script>