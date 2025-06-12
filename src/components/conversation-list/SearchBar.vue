<template>
    <div class="px-4 py-3 top-16 bg-white bg-opacity-95 backdrop-blur-sm sticky top-0 z-10">
        <div
            class="relative flex items-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-white focus-within:bg-white transition-all shadow-sm">
            <MagnifyingGlassIcon class="absolute right-3 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="חפש בהודעות..." :value="searchQuery" @input="updateSearchQuery"
                class="w-full py-2.5 pr-10 pl-4 text-sm rounded-lg focus:outline-none bg-transparent" dir="rtl" />
            <button v-if="searchQuery" @click="clearSearch"
                class="absolute left-3 p-1 rounded-full hover:bg-gray-200 text-gray-400">
                <XMarkIcon class="w-3 h-3" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
    searchQuery: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:searchQuery']);

const updateSearchQuery = (event) => {
    emit('update:searchQuery', event.target.value);
};

const clearSearch = () => {
    emit('update:searchQuery', '');
};
</script>