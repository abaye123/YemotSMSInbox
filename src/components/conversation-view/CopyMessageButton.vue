<template>
    <button @click="copy" class="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" :title="copied ? 'הועתק!' : 'העתק הודעה'">
        <template v-if="copied">
            <CheckCheck class="h-5 w-5 text-green-500" />
        </template>
        <template v-else>
            <Files class="h-5 w-5" />
        </template>
    </button>
</template>

<script setup>
import { ref } from 'vue';
import { Files, CheckCheck } from 'lucide-vue-next';


const props = defineProps({
    text: {
        type: String,
        required: true,
    },
});

const copied = ref(false);

function copy() {
    navigator.clipboard.writeText(props.text).then(() => {
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 1250);
    });
}
</script>
