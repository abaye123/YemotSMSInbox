<template>
    <div
        class="px-5 py-4 sticky top-0 z-20 bg-white backdrop-blur-sm bg-opacity-95 border-b border-gray-100 flex items-center justify-between">
        <div class="flex gap-4">
            <MessagesSquare class="w-8 h-8 text-gray-800" />
            <h1 class="text-2xl font-bold text-gray-800">
                שיחות
            </h1>
        </div>
        <div class="flex items-center gap-3">
            <!--GoogleAuthButton :google-status="googleStatus" @google-login="emit('google-login')"
                @google-logout="emit('google-logout')" /-->

            <button class="p-2 rounded-full text-gray-900 hover:bg-gray-100 transition" v-tippy="'שלח הודעה חדשה'"
                @click="emit('new-message')">
                <Pencil class="h-5 w-5" />
            </button>

            <ActionsMenu v-if="hasUnreadMessages" :unread-count="unreadCount" :filter="filter"
                @toggle-filter="emit('toggle-filter')" @mark-all-as-read="emit('mark-all-as-read')" />
        </div>
    </div>
</template>

<script setup>
import { Pencil, MessagesSquare, MessageSquarePlus } from 'lucide-vue-next';
import GoogleAuthButton from './GoogleAuthButton.vue';
import ActionsMenu from './ActionsMenu.vue';

const props = defineProps({
    googleStatus: {
        type: Object,
        required: true
    },
    hasUnreadMessages: {
        type: Boolean,
        default: false
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    filter: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits([
    'google-login',
    'google-logout',
    'new-message',
    'toggle-filter',
    'mark-all-as-read'
]);
</script>