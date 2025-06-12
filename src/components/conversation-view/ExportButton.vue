<template>
    <div class="relative export-menu-container">
        <button @click="toggleExportMenu" class="p-2 rounded-full text-indigo-600 hover:bg-gray-100 transition"
            :class="{ 'bg-gray-100': showExportMenu }" v-tippy="'ייצא שיחה'">
            <Download class="h-6 w-6" />
        </button>

        <!-- Export Dropdown Menu -->
        <transition name="dropdown">
            <div v-if="showExportMenu"
                class="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[100]">
                <button @click="handleExport('json')"
                    class="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors">
                    <FileText class="w-4 h-4" />
                    <span class="text-sm">ייצא כ-JSON</span>
                </button>

                <button @click="handleExport('html')"
                    class="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-3 transition-colors">
                    <Globe class="w-4 h-4" />
                    <span class="text-sm">ייצא כ-HTML</span>
                </button>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Download, FileText, Globe } from 'lucide-vue-next';
import { exportConversation } from '../../services/exportConversationService';

const props = defineProps({
    conversation: {
        type: Object,
        required: true
    }
});

const showExportMenu = ref(false);

const toggleExportMenu = () => {
    showExportMenu.value = !showExportMenu.value;
};

const handleExport = (format) => {
    exportConversation(props.conversation, format);
    showExportMenu.value = false;
};

// Close menu when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.export-menu-container')) {
        showExportMenu.value = false;
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