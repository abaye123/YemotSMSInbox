<template>
    <div class="flex-1 flex flex-col h-full bg-white">
        <!-- Header -->
        <div
            class="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
            <div class="flex items-center gap-3">
                <button class="p-2 rounded-full text-indigo-600 hover:bg-gray-100 transition" @click="emit('back')">
                    <ArrowRight class="h-6 w-6" />
                </button>

                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <MessageSquareText class="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 class="text-lg font-medium text-gray-900">שיחה חדשה</h2>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button class="p-2 rounded-full text-red-600 hover:bg-gray-100 transition" @click="emit('logout')">
                    <Power class="h-6 w-6" />
                </button>
            </div>
        </div>

        <!-- Phone number input section -->
        <div class="flex-1 flex flex-col justify-center px-8">
            <div class="max-w-md mx-auto w-full">
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquareText class="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 class="text-xl font-medium text-gray-800 mb-2">התחלת שיחה חדשה</h3>
                    <p class="text-gray-600">הזן את מספר הטלפון של הנמען</p>
                </div>

                <div class="space-y-4">
                    <label for="phoneNumber"
                        class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors bg-white">
                        <input v-model="phoneNumber" type="text" id="phoneNumber" placeholder="מספר הטלפון של הנמען"
                            autofocus
                            class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm text-gray-900"
                            dir="rtl" @keydown.enter="startConversation" />
                        <span
                            class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
                            מספר טלפון
                        </span>
                    </label>

                    <button @click="startConversation" :disabled="!phoneNumber.trim()" :class="[
                        !phoneNumber.trim()
                            ? 'bg-indigo-300 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
                        'w-full px-4 py-3 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium transition-all'
                    ]">
                        <span class="flex items-center justify-center gap-2">
                            <MessageSquareText class="h-4 w-4" />
                            התחל שיחה
                        </span>
                    </button>
                </div>

                <div class="mt-8 pt-6 border-t border-gray-100">
                    <p class="text-sm text-gray-500 text-center">
                        אפשר גם להתחיל שיחה על ידי לחיצה על
                        <span class="font-medium">"שלח הודעה חדשה"</span>
                        ברשימת השיחות
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import {
    ArrowRight,
    MessageSquare,
    Power,
    Phone,
    MessageSquareText
} from 'lucide-vue-next';

const emit = defineEmits(['back', 'logout', 'start-conversation']);

const phoneNumber = ref('');

const startConversation = () => {
    if (phoneNumber.value.trim()) {
        emit('start-conversation', phoneNumber.value.trim());
    }
};
</script>