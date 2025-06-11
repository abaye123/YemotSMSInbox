<template>
    <transition name="fade">
        <div v-if="privacyPolicyVisible"
            class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4"
            @click="closePrivacyPolicy">

            <div class="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col" @click.stop>
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative flex-shrink-0 rounded-t-2xl">
                    <button @click="closePrivacyPolicy"
                        class="absolute top-4 left-4 text-gray-300 hover:text-white p-1">
                        <X />
                    </button>
                    <div class="text-center">
                        <h1 class="text-2xl font-semibold mb-1">מדיניות פרטיות</h1>
                        <p class="text-gray-300 text-sm">{{ appName }} - תצוגת שיחות</p>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="flex-1 flex items-center justify-center p-8">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        <p class="text-gray-600">טוען מדיניות פרטיות...</p>
                    </div>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="flex-1 flex items-center justify-center p-8">
                    <div class="text-center">
                        <p class="text-red-600 mb-2">שגיאה בטעינת מדיניות הפרטיות</p>
                        <button @click="loadPrivacyPolicy" 
                                class="text-indigo-600 hover:text-indigo-800 underline">
                            נסה שוב
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div v-else class="flex-1 overflow-y-auto p-6">
                    <div class="markdown-content" v-html="markdownContent"></div>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 border-t flex justify-between items-center flex-shrink-0 rounded-b-2xl">
                    <span class="text-sm text-gray-500">{{ fullAppTitle }}</span>
                    <button @click="closePrivacyPolicy"
                        class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                        סגור
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import { X } from 'lucide-vue-next';

const privacyPolicyVisible = ref(false);
const markdownContent = ref('');
const loading = ref(false);
const error = ref(false);

const appName = import.meta.env.VITE_APP_NAME;
const version = import.meta.env.VITE_VERSION || '0.0.0';
const fullAppTitle = `${appName} v${version}`;

const parseMarkdown = (markdown) => {
    return marked(markdown, {
        breaks: true,
        gfm: true
    });
};

const wrapListItems = (html) => {
    return html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, 
        '<ul class="space-y-2 mb-6 pr-4">$1</ul>');
};

const wrapParagraphs = (html) => {
    // עוטף תוכן שאינו כותרות או רשימות בתגי p
    const lines = html.split('\n');
    let result = '';
    let inParagraph = false;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        if (line.startsWith('<h') || line.startsWith('<ul>') || line.startsWith('</ul>')) {
            if (inParagraph) {
                result += '</p>\n';
                inParagraph = false;
            }
            result += line + '\n';
        } else if (line.startsWith('<li>')) {
            result += line + '\n';
        } else {
            if (!inParagraph) {
                result += '<p class="text-gray-700 leading-relaxed mb-4">';
                inParagraph = true;
            }
            result += line + ' ';
        }
    }
    
    if (inParagraph) {
        result += '</p>\n';
    }
    
    return result;
};

const loadPrivacyPolicy = async () => {
    loading.value = true;
    error.value = false;
    
    try {
        // טען את קובץ המרקדאון דינמית
        const markdownModule = await import('/privacy-policy.md?raw');
        const markdown = markdownModule.default;
        
        // המר את המרקדאון ל-HTML
        let html = parseMarkdown(markdown);
        html = wrapParagraphs(html);
        html = wrapListItems(html);
        
        markdownContent.value = html;
    } catch (err) {
        console.error('Error loading privacy policy:', err);
        error.value = true;
        // fallback content
        markdownContent.value = `
            <h1 class="text-2xl font-bold text-gray-900 mb-6">מדיניות פרטיות</h1>
            <p class="text-gray-700 leading-relaxed mb-4">
                שגיאה בטעינת מדיניות הפרטיות. אנא נסה שוב מאוחר יותר או פנה אלינו בדוא"ל cs@abaye.co
            </p>
        `;
    } finally {
        loading.value = false;
    }
};

const checkPrivacyPolicyPath = () => {
    const currentPath = window.location.pathname;
    return currentPath.endsWith('/privacy-policy') || currentPath.includes('/privacy-policy');
};

const updatePrivacyPolicyVisibility = async () => {
    const shouldShow = checkPrivacyPolicyPath();
    privacyPolicyVisible.value = shouldShow;
    
    if (shouldShow && !markdownContent.value) {
        await loadPrivacyPolicy();
    }
};

const closePrivacyPolicy = () => {
    privacyPolicyVisible.value = false;
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/\/privacy-policy$/, '');
    window.history.pushState({}, document.title, newPath || '/');
};

const handlePopState = () => {
    updatePrivacyPolicyVisibility();
};

const openPrivacyPolicy = async () => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.endsWith('/') ?
        currentPath + 'privacy-policy' :
        currentPath + '/privacy-policy';

    window.history.pushState({}, 'מדיניות פרטיות', newPath);
    await updatePrivacyPolicyVisibility();
};

onMounted(() => {
    updatePrivacyPolicyVisibility();
    window.addEventListener('popstate', handlePopState);
    window.openPrivacyPolicy = openPrivacyPolicy;
});

onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState);
    delete window.openPrivacyPolicy;
});
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