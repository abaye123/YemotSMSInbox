<template>
  <div 
    @click="emit('select', conversation.id)"
    :class="[
      'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
      String(conversation.id) === String(selectedId) ? 'bg-indigo-50 hover:bg-indigo-50 border-r-4 border-indigo-500' : ''
    ]">
    <div class="flex items-center space-x-3 space-x-reverse">
      <div class="relative">
        <img 
          :src="conversation.avatar" 
          :alt="conversation.name"
          class="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm" />
        <div 
          v-if="conversation.unreadCount > 0"
          class="absolute -top-1 -right-1 flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white">
          <span class="text-xs text-white font-medium">
            {{ conversation.unreadCount }}
          </span>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <p 
            class="text-sm font-medium text-gray-900 truncate"
            :class="{ 'font-bold': conversation.unreadCount > 0 }">
            {{ conversation.name }}
          </p>
          <p class="text-xs text-gray-500 flex-shrink-0">
            {{ formatTime(conversation.lastMessage?.timestamp) }}
          </p>
        </div>
        <p 
          class="text-sm text-gray-500 truncate mt-0.5"
          :class="{ 'font-medium text-gray-700': conversation.unreadCount > 0 }">
          {{ conversation.lastMessage?.content || 'אין הודעות' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, isToday, isThisYear, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  selectedId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select']);

const formatTime = (date) => {
  if (!date) return '';
  
  try {
    const now = new Date();
    const messageDate = new Date(date);

    // בדיקה שהתאריך תקין
    if (isNaN(messageDate.getTime())) {
      return '';
    }

    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    }

    const daysDifference = differenceInDays(now, messageDate);

    if (daysDifference <= 7) {
      switch (daysDifference) {
        case 0:
          return 'אתמול';
        case 1:
          return 'לפני יומיים';
        default:
          return `לפני ${daysDifference + 1} ימים`;
      }
    }

    if (isThisYear(messageDate)) {
      return format(messageDate, 'd בMMMM', { locale: he });
    }

    return format(messageDate, 'd בMMMM yyyy', { locale: he });
  } catch (error) {
    console.error('Error formatting time:', error, 'for date:', date);
    return '';
  }
};
</script>