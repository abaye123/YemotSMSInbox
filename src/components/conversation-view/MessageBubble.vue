<template>
    <div class="flex flex-col gap-1">
        <!-- Message Row -->
        <div :class="[
            'flex group',
            message.type === 'outgoing' ? 'justify-end' : 'justify-start'
        ]">
            <!-- Copy Button for Outgoing Message -->
            <div v-if="message.type === 'outgoing'" class="group-hover:flex items-center ml-2 hidden">
                <CopyMessageButton :text="message.content" />
            </div>

            <!-- Message Bubble -->
            <div :class="[
                'max-w-[70%] rounded-lg px-4 py-2 shadow-sm',
                message.type === 'outgoing'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-gray-900 border border-gray-100'
            ]">
                <!-- Message Content -->
                <p 
                    class="whitespace-pre-line text-[16px]" 
                    v-html="formatMessageContent(message.content, message.type)">
                </p>

                <!-- Verification Code Button (if exists) -->
                <div 
                    v-if="message.type === 'incoming' && verificationCode" 
                    class="mt-2">
                    <button 
                        @click="copyVerificationCode(verificationCode, message.id)"
                        class="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full hover:bg-indigo-700 transition-colors"
                        v-tippy="'העתק קוד אימות'">
                        <Files class="h-3 w-3" />
                        <span v-if="copiedCodeId === message.id">הועתק!</span>
                        <span v-else>{{ verificationCode }}</span>
                    </button>
                </div>
            </div>

            <!-- Copy Button for Incoming Messages -->
            <div v-if="message.type === 'incoming'" class="group-hover:flex items-center mr-2 hidden">
                <CopyMessageButton :text="message.content" />
            </div>
        </div>

        <!-- Time and Status Row (Outside bubble) -->
        <div :class="[
            'flex items-center gap-1 px-1',
            message.type === 'outgoing' ? 'justify-end' : 'justify-start'
        ]">
            <!-- Time -->
            <p class="text-xs text-gray-500">
                {{ formattedTime }}
            </p>

            <!-- Status for Outgoing Messages -->
            <span 
                v-if="message.type === 'outgoing'" 
                class="text-gray-500">
                <div 
                    v-if="message.status === 'DELIVRD'" 
                    class="flex" 
                    v-tippy="'נמסר'">
                    <CheckIcon class="h-3 w-3" />
                    <CheckIcon class="h-3 w-3 -mr-2" />
                </div>
                <CheckIcon 
                    v-else 
                    class="h-3 w-3" 
                    v-tippy="'נשלח'" />
            </span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { format, isToday, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Files } from 'lucide-vue-next';
import { CheckIcon } from '@heroicons/vue/24/solid';
import CopyMessageButton from './CopyMessageButton.vue';

const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    copiedCodeId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['copy-verification-code']);

// Format message time
const formattedTime = computed(() => {
    const date = new Date(props.message.timestamp);
    const time = format(date, 'HH:mm');

    if (isToday(date)) {
        return `היום, ${time}`;
    }

    const daysDifference = differenceInDays(new Date(), date);

    if (daysDifference <= 6) {
        const daysInHebrew = ['ימים', 'יום', 'יומיים', 'שלושה ימים', 'ארבעה ימים', 'חמישה ימים', 'שישה ימים', 'שבעה ימים'];
        return `לפני ${daysInHebrew[daysDifference + 1]}, ${time}`;
    }

    return format(date, "d בMMMM yyyy', 'HH:mm", { locale: he });
});

// Extract verification code
const verificationCode = computed(() => {
    if (!props.message.content || typeof props.message.content !== 'string') {
        return null;
    }

    const numbers = props.message.content.match(/\b\d{4,8}\b/g);

    if (!numbers) return null;

    for (const number of numbers) {
        const numberIndex = props.message.content.indexOf(number);
        const beforeChar = props.message.content.charAt(numberIndex - 1);

        if (beforeChar === '-' || beforeChar === ' ') {
            const beforeText = props.message.content.substring(Math.max(0, numberIndex - 5), numberIndex);
            if (/\d+[-\s]$/.test(beforeText)) {
                continue;
            }
        }

        if (number.length >= 7 && (
            number.startsWith('05') ||
            number.startsWith('02') ||
            number.startsWith('03') ||
            number.startsWith('04') ||
            number.startsWith('08') ||
            number.startsWith('09') ||
            number.startsWith('077') ||
            number.startsWith('072') ||
            number.startsWith('073')
        )) {
            continue;
        }

        if (number.length >= 5 && number.length <= 8) {
            return number;
        }

        if (number.length === 4) {
            if (/(?:קוד|הקוד|code|pin|otp|verification|אימות)/i.test(props.message.content)) {
                return number;
            }
        }
    }

    return null;
});

// Format message content with links
const formatMessageContent = (content, type) => {
    if (type === 'incoming') {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(
            urlRegex,
            (url) => `<a href="${url}" target="_blank" class="text-indigo-600 hover:text-indigo-500 underline">${url}</a>`
        );
    } else if (type === 'outgoing') {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(
            urlRegex,
            (url) => `<a href="${url}" target="_blank" class="underline">${url}</a>`
        );
    }
    return content;
};

// Copy verification code
const copyVerificationCode = (code, messageId) => {
    emit('copy-verification-code', code, messageId);
};
</script>