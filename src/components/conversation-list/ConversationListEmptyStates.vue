<template>
    <!-- Search Empty State -->
    <div v-if="type === 'search'" class="flex flex-col items-center justify-center h-64 text-gray-500">
        <MagnifyingGlassIcon class="w-10 h-10 text-gray-300 mb-2" />
        <p>לא נמצאו תוצאות ל-"{{ searchQuery }}"</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="type === 'loading'" class="flex-1 flex flex-col items-center justify-center text-gray-500 h-64">
        <svg class="animate-spin h-8 w-8 text-indigo-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
            </circle>
            <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
        </svg>
        טוען את השיחות...
    </div>
</template>

<script setup>
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (value) => ['search', 'loading'].includes(value)
    },
    searchQuery: {
        type: String,
        default: ''
    }
});
</script>