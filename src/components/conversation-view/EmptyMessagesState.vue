<template>
    <div class="flex-1 flex flex-col items-center justify-center text-gray-500 py-16 px-8">
        <div class="text-center max-w-sm">
            <div class="w-16 h-16 bg-gray-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquareText class="w-8 h-8" />
            </div>

            <h3 class="text-lg font-medium text-gray-700 mb-2">עדיין אין הודעות</h3>

            <p class="text-gray-500 text-center mb-6 leading-relaxed">
                זוהי התחלת השיחה שלך עם {{ conversation.name }}<br>
                שלח הודעה ראשונה כדי להתחיל לשוחח!
            </p>

            <div class="text-sm text-gray-400">
                השתמש בשדה ההודעה למטה כדי לכתוב הודעה חדשה
            </div>
        </div>
    </div>
</template>

<script setup>
import { MessageSquareText } from 'lucide-vue-next';

const props = defineProps({
    conversation: {
        type: Object,
        required: true
    }
});
</script>