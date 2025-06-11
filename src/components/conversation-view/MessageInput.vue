<template>
    <div class="p-4 sticky bottom-0 bg-white shadow-sm">
        <div class="flex items-center gap-3">
            <div class="flex-1 relative">
                <textarea v-model="message" :placeholder="getPlaceholderText()" rows="1" :class="[
                    'w-full rounded-full py-3 focus:outline-none focus:ring-1 transition-all resize-none',
                    isNumberAllowSending
                        ? 'bg-gray-50 border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 p-6'
                        : 'bg-red-50 border border-red-300 focus:ring-red-500 focus:border-red-500 text-red-700 placeholder-red-400 p-6'
                ]" @keydown.enter.meta.prevent="handleSend" @keydown.enter.ctrl.prevent="handleSend"
                    :disabled="!isNumberAllowSending" />
            </div>

            <!-- Send Button -->
            <button @click="handleSend" :disabled="!message.trim() || sending || !isNumberAllowSending"
                class="flex items-center gap-2 px-6 py-3 rounded-full transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium min-w-[80px]"
                :class="[
                    !message.trim() || sending || !isNumberAllowSending
                        ? 'bg-indigo-300 cursor-not-allowed text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                ]" v-tippy="getButtonTooltip()">

                <!-- Normal State -->
                <template v-if="!sending">
                    <SendHorizontal class="h-4 w-4 rotate-180" />
                    <span>שלח</span>
                </template>

                <!-- Loading State -->
                <template v-else>
                    <LoaderCircle class="h-4 w-4 animate-spin" />
                    <span>שולח</span>
                </template>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getAuthToken } from '../../utils/auth.js';
import { SendHorizontal, LoaderCircle, PenOff } from 'lucide-vue-next';
import { PencilIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    phoneNumber: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['message-sent', 'send-error']);

const message = ref('');
const sending = ref(false);

// Clear message when phone number changes (conversation switch)
watch(() => props.phoneNumber, () => {
    message.value = '';
});

// Use computed instead of ref to make it reactive to props changes
const isNumberAllowSending = computed(() => {
    return props.phoneNumber.startsWith('0') || props.phoneNumber.startsWith('+');
});

// Dynamic placeholder text based on phone number validity
const getPlaceholderText = () => {
    if (!isNumberAllowSending.value) {
        return `לא ניתן לשלוח הודעות למספר ${props.phoneNumber}`;
    }
    return 'הקלד הודעה...';
};

// Function to get appropriate tooltip text
const getButtonTooltip = () => {
    if (!isNumberAllowSending.value) {
        return 'לא ניתן לשלוח למספר זה';
    }
    if (sending.value) {
        return 'שולח הודעה...';
    }
    if (!message.value.trim()) {
        return 'הקלד הודעה כדי לשלוח';
    }
    return 'שלח הודעה (Ctrl+Enter)';
};

const handleSend = async () => {
    if (!message.value.trim() || !isNumberAllowSending.value) return;

    sending.value = true;

    try {
        const authToken = await getAuthToken();
        if (!authToken) {
            console.error('No authentication token available for sending message');
            emit('send-error', 'שגיאה: לא נמצא טוקן אימות');
            sending.value = false;
            return;
        }

        const response = await fetch(
            `https://www.call2all.co.il/ym/api/SendSms?token=${authToken}&phones=${props.phoneNumber}&message=${message.value}`
        );

        const data = await response.json();

        if (data.responseStatus === 'OK') {
            const sentMessage = message.value;
            message.value = '';
            sending.value = false;
            emit('message-sent', sentMessage);
        } else {
            sending.value = false;
            emit('send-error', 'שגיאה בשליחת ההודעה: ' + data.message);
        }
    } catch (error) {
        sending.value = false;
        emit('send-error', 'שגיאה בשליחת ההודעה: ' + error.message);
    }
};

// Expose message value for parent component if needed
defineExpose({
    clearMessage: () => {
        message.value = '';
    },
    getMessage: () => message.value
});
</script>