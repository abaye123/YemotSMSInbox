// קובץ: src/utils/auth.js
// פונקציות עזר לאימות ולקריאות API עם Axios

import axios from 'axios';
import { getSavedCredentials } from '../services/encryption.service';

/**
 * קבל טוקן אימות בטוח
 * @returns {string|null} - טוקן האימות או null אם לא נמצא
 */
export async function getAuthToken() {
    const credentials = await getSavedCredentials();
    if (!credentials) {
        console.error('No valid credentials found');
        return null;
    }
    return `${credentials.username}:${credentials.password}`;
}

/**
 * יצירת instance של Axios עם הגדרות בסיס
 */
const yemotAPI = axios.create({
    baseURL: 'https://www.call2all.co.il/ym/api',
    timeout: 30000, // 30 שניות timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

/**
 * Interceptor לשליחת בקשות - מוסיף אוטומטית את טוקן האימות
 */
yemotAPI.interceptors.request.use(
    async (config) => {
        try {
            const authToken = await getAuthToken();
            if (!authToken) {
                throw new Error('No authentication token available');
            }

            config.headers.authorization = authToken;

            // console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
            return config;
        } catch (error) {
            console.error('Error in request interceptor:', error);
            return Promise.reject(error);
        }
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

/**
 * Interceptor לתגובות - טיפול בשגיאות נפוצות
 */
yemotAPI.interceptors.response.use(
    (response) => {
        // בדוק אם התגובה מכילה responseStatus
        if (response.data && response.data.responseStatus) {
            if (response.data.responseStatus !== 'OK') {
                console.warn('API returned non-OK status:', response.data);
                // אפשר לטפל כאן בסטטוסים ספציפיים
                if (response.data.responseStatus === 'INVALID_TOKEN') {
                    throw new Error('Invalid authentication token');
                }
            }
        }
        return response;
    },
    async (error) => {
        console.error('API Error:', error);

        // טיפול בשגיאות אימות
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('Authentication failed - token may be invalid');
            // אפשר לקרוא כאן לפונקציה לניקוי האימות
            // clearCredentials();
        }

        // טיפול בשגיאות רשת
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
            error.message = 'שגיאת רשת - בדוק את החיבור לאינטרנט';
        }

        return Promise.reject(error);
    }
);

/**
 * פונקציות API מותאמות לשירותי ימות המשיח
 */

/**
 * קבל הודעות נכנסות
 * @param {number} limit - מספר ההודעות המקסימלי לקבלת
 * @returns {Promise<Object>} תגובת השרת
 */
export async function getIncomingSms(limit = 3000) {
    try {
        const response = await yemotAPI.post('/GetIncomingSms', {
            limit: limit
        });
        return response.data;
    } catch (error) {
        console.error('Error getting incoming SMS:', error);
        throw error;
    }
}

/**
 * קבל יומן הודעות יוצאות
 * @param {number} limit - מספר ההודעות המקסימלי לקבלת
 * @returns {Promise<Object>} תגובת השרת
 */
export async function getSmsOutLog(limit = 999999) {
    try {
        const response = await yemotAPI.post('/GetSmsOutLog', {
            limit: limit
        });
        return response.data;
    } catch (error) {
        console.error('Error getting SMS out log:', error);
        throw error;
    }
}

/**
 * שלח הודעת SMS
 * @param {string} phones - מספרי הטלפון (מופרדים בפסיק)
 * @param {string} message - תוכן ההודעה
 * @returns {Promise<Object>} תגובת השרת
 */
export async function sendSms(phones, message) {
    try {
        const response = await yemotAPI.get('/SendSms', {
            params: { phones, message }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}

/**
 * קבל קובץ טקסט מהשרת
 * @param {string} fileName - שם הקובץ (כולל נתיב)
 * @returns {Promise<Object>} תגובת השרת
 */
export async function getTextFile(fileName) {
    try {
        const response = await yemotAPI.get('/GetTextFile', {
            params: { what: fileName }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting text file:', error);
        throw error;
    }
}

/**
 * העלה קובץ טקסט לשרת
 * @param {string} fileName - שם הקובץ (כולל נתיב)
 * @param {string} contents - תוכן הקובץ
 * @returns {Promise<Object>} תגובת השרת
 */
export async function uploadTextFile(fileName, contents) {
    try {
        // עבור POST requests, נשתמש בגוף הבקשה
        const response = await yemotAPI.post('/UploadTextFile', {
            what: fileName,
            contents: contents
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading text file:', error);
        throw error;
    }
}

/**
 * בדוק חיבור וקבל פרטי סשן
 * @returns {Promise<Object>} תגובת השרת
 */
export async function getSession() {
    try {
        const response = await yemotAPI.get('/GetSession');
        return response.data;
    } catch (error) {
        console.error('Error getting session:', error);
        throw error;
    }
}

/**
 * קריאה כללית לAPI עם אימות אוטומטי
 * @param {string} endpoint - נקודת הקצה (ללא /ym/api)
 * @param {Object} options - אפשרויות הבקשה (params, data, method וכו')
 * @returns {Promise<Object>} תגובת השרת
 */
export async function yemotAPICall(endpoint, options = {}) {
    try {
        const { method = 'get', params = {}, data = null, ...restOptions } = options;

        const config = {
            method,
            url: endpoint,
            params: method.toLowerCase() === 'get' ? params : undefined,
            data: method.toLowerCase() !== 'get' ? data || params : undefined,
            ...restOptions
        };

        const response = await yemotAPI.request(config);
        return response.data;
    } catch (error) {
        console.error(`Error in API call to ${endpoint}:`, error);
        throw error;
    }
}

/**
 * בדוק אם המשתמש מחובר
 * @returns {boolean} - true אם המשתמש מחובר
 */
export async function isAuthenticated() {
    try {
        const token = await getAuthToken();
        return token !== null;
    } catch (error) {
        return false;
    }
}

/**
 * קבל שם המשתמש הנוכחי
 * @returns {string|null} - שם המשתמש או null
 */
export async function getCurrentUsername() {
    try {
        const credentials = await getSavedCredentials();
        return credentials ? credentials.username : null;
    } catch (error) {
        return null;
    }
}

// ייצוא ה-instance של Axios למקרה שנדרש שימוש ישיר
export { yemotAPI };