<template>
    <div class="relative actions-menu-container">
        <button @click="toggleActionsMenu" class="p-2 rounded-full hover:bg-gray-100 text-gray-900 transition relative"
            :class="{ 'bg-gray-100': showActionsMenu }" v-tippy="'פעולות נוספות'">
            <Grip class="w-6 h-6" />

            <!-- Badge for unread count -->
            <div class="absolute -top-0 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span class="text-xs text-white font-medium">
                    {{ unreadCount }}
                </span>
            </div>
        </button>

        <!-- Dropdown Menu with higher z-index -->
        <transition name="dropdown">
            <div v-if="showActionsMenu"
                class="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100]">
                <button @click="handleToggleFilter"
                    class="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    :class="{ 'bg-indigo-50 text-indigo-700': filter }">
                    <FunnelIcon class="w-4 h-4" />
                    <span class="text-sm">{{ filter ? 'הסר סינון' : 'הצג רק לא נקראו' }}</span>
                </button>

                <button @click="handleMarkAllAsRead"
                    class="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 text-green-700 transition-colors">
                    <CheckCircleIcon class="w-4 h-4" />
                    <span class="text-sm">סמן הכל כנקרא</span>
                </button>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {
    FunnelIcon,
    CheckCircleIcon,
    EllipsisVerticalIcon
} from "@heroicons/vue/24/outline";
import { Grip } from 'lucide-vue-next';


const props = defineProps({
    unreadCount: {
        type: Number,
        required: true
    },
    filter: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['toggle-filter', 'mark-all-as-read']);

const showActionsMenu = ref(false);

const toggleActionsMenu = () => {
    showActionsMenu.value = !showActionsMenu.value;
};

const handleToggleFilter = () => {
    emit('toggle-filter');
    showActionsMenu.value = false;
};

const handleMarkAllAsRead = () => {
    emit('mark-all-as-read');
    showActionsMenu.value = false;
};

// Close menu when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.actions-menu-container')) {
        showActionsMenu.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.15s ease-out;
}

.dropdown-enter-from {
    opacity: 0;
    transform: translateY(-4px) scale(0.95);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px) scale(0.95);
}
</style>