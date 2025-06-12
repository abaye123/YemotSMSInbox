<template>
    <div class="flex-1 flex flex-col items-center justify-between text-gray-500 py-16">
        <div></div>

        <div class="flex flex-col items-center">
            <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
                </path>
            </svg>
            <h3 class="text-lg font-medium text-gray-700 mb-1">הודעות SMS</h3>
            <p class="text-gray-500 text-center mb-1">בחר שיחה בכדי להמשיך לשוחח</p>
            <p class="text-gray-500 text-center mb-6">או שתרצה להתחיל צ'אט חדש</p>
            
            <button 
                @click="emit('new-conversation')"
                class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium">
                <MessageSquarePlus class="h-5 w-5" />
                <span>התחל שיחה חדשה</span>
            </button>
        </div>

        <div class="text-sm text-gray-600 bg-gray-100 py-2 px-4 rounded-lg gap-2 flex">
            <p>מחובר כ-{{ username }}</p>
            <p>|</p>
            <button @click="emit('logout')" class="text-indigo-600 hover:text-indigo-800 transition">
                התנתק
            </button>
            <p>|</p>
            <button @click="openPrivacyPolicy()" class="text-indigo-600 hover:text-indigo-800 transition">
                מדיניות הפרטיות
            </button>
            <p>|</p>
            <p>גרסה v{{ version }}</p>
        </div>
    </div>
</template>

<script setup>
import { MessageSquarePlus } from 'lucide-vue-next';

const props = defineProps({
    username: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['logout', 'new-conversation']);

const version = import.meta.env.VITE_VERSION || '0.0.0';

const openPrivacyPolicy = () => {
    window.openPrivacyPolicy();
};
</script>