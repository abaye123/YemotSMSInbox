<template>
    <transition name="fade">
        <div v-if="visible" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4"
            style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">

            <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md" @click.stop>
                <div class="flex flex-col items-center mb-6">
                    <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <KeyIcon class="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">התחברות למערכת</h3>
                    <p class="text-gray-500 mt-1 text-center">הזן את פרטי ההתחברות שלך כדי להתחיל</p>
                </div>

                <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {{ error }}
                </div>

                <form @submit.prevent="handleLogin" class="space-y-4">
                    <label for="username"
                        class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors cursor-text">
                        <input v-model="username" type="text" id="username" placeholder="מה מספר המערכת שלך?"
                            :autofocus="shouldFocus" required
                            class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
                        <span
                            class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
                            מספר מערכת
                        </span>
                    </label>

                    <label for="password"
                        class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors cursor-text">
                        <input v-model="password" type="password" id="password" placeholder="מה הסיסמא שלך?" required
                            class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
                        <span
                            class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
                            סיסמא
                        </span>
                    </label>

                    <button type="submit" :disabled="loading" :class="[
                        loading ? 'bg-opacity-70 cursor-not-allowed' : 'hover:bg-indigo-500',
                        'mt-6 transition-all w-full px-4 py-3 text-white bg-indigo-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium'
                    ]">
                        <span v-if="!loading">כניסה למערכת</span>
                        <span v-else class="flex justify-center items-center">
                            <svg class="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                                fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                            בודק את הפרטים...
                        </span>
                    </button>

                    <div class="text-sm text-center pt-2 text-indigo-600">
                        <span class="hover:underline cursor-pointer" @click="openPrivacyPolicy">מדיניות פרטיות</span>
                    </div>
                </form>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { saveCredentials } from '../services/encryption.service';
import { KeyIcon, XMarkIcon } from '@heroicons/vue/24/outline';


const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    shouldFocus: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['login-success', 'login-error']);

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

// Initialize username from credentials if exists
const initializeUsername = async () => {
    const { getSavedCredentials } = await import('../services/encryption.service');
    const credentials = await getSavedCredentials();
    if (credentials && credentials.username) {
        username.value = credentials.username;
    }
};

// Initialize when component becomes visible
watch(() => props.visible, (newVisible) => {
    if (newVisible) {
        initializeUsername();
        error.value = '';
        nextTick(() => {
            if (!username.value && props.shouldFocus) {
                document.getElementById('username')?.focus();
            }
        });
    }
});

const openPrivacyPolicy = () => {
    window.openPrivacyPolicy();
};

const handleLogin = async () => {
    loading.value = true;
    error.value = '';

    if (!username.value || !password.value) {
        error.value = 'כל השדות הינם שדות חובה!';
        loading.value = false;
        return;
    }

    try {
        const response = await fetch(`https://www.call2all.co.il/ym/api/GetSession?token=${username.value}:${password.value}`);
        const data = await response.json();

        if (data.responseStatus === 'OK') {
            // הצפן ושמור את פרטי ההתחברות באמצעות השירות החדש
            const saveSuccess = await saveCredentials(username.value, password.value);

            if (!saveSuccess) {
                error.value = 'שגיאה בשמירת פרטי ההתחברות';
                loading.value = false;
                return;
            }

            // עדכן את כותרת הדף
            document.title = 'מערכת סמסים - ' + username.value;

            // אפס את הטופס
            password.value = '';
            loading.value = false;

            emit('login-success', username.value);
        } else {
            error.value = 'שגיאה בהתחברות: ' + data.message;
            loading.value = false;
        }
    } catch (err) {
        error.value = 'שגיאת התחברות. אנא נסה שוב מאוחר יותר.';
        console.error('Login error:', err);
        loading.value = false;
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>