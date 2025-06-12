<template>
    <div v-if="googleStatus.isAuthenticated" class="bg-indigo-50 py-2 px-3 border-b border-indigo-100">
        <div class="flex justify-between text-xs">
            <a :href="`https://contacts.google.com/?authuser=${googleStatus.userEmail}`" target="_blank"
                class="font-semibold text-indigo-700 hover:text-indigo-800 transition-colors">
                {{ googleStatus.userEmail }}
            </a>
            <span class="text-gray-600">
                {{ googleStatus.contactCount }} אנשי קשר
            </span>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    googleStatus: {
        type: Object,
        required: true,
        default: () => ({
            isAuthenticated: false,
            userEmail: '',
            contactCount: 0
        })
    }
});
</script>