/**
 * Enhanced Encryption Service
 * Handles secure encryption and decryption of login credentials
 * Uses device-specific keys and stronger encryption algorithms
 */

/**
 * Generate a device-specific fingerprint for encryption key derivation
 * @returns {Promise<string>} - Unique device fingerprint
 */
async function generateDeviceFingerprint() {
    const components = [];

    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    components.push(navigator.language);

    if (navigator.deviceMemory) {
        components.push(navigator.deviceMemory.toString());
    }

    const fingerprint = components.join('|');

    return await hashString(fingerprint);
}

/**
 * Hash a string using SHA-256
 * @param {string} str - String to hash
 * @returns {Promise<string>} - Hex encoded hash
 */
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive encryption key from device fingerprint and additional entropy
 * @param {string} fingerprint - Device fingerprint
 * @param {string} salt - Additional salt for key derivation
 * @returns {Promise<CryptoKey>} - Derived encryption key
 */
async function deriveEncryptionKey(fingerprint, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(fingerprint + salt),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Generate a random salt
 * @returns {string} - Base64 encoded random salt
 */
function generateSalt() {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return btoa(String.fromCharCode(...salt));
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - Data to encrypt
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<Object>} - Encrypted data with IV
 */
async function encryptData(data, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(data)
    );

    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivString - Base64 encoded IV
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<string>} - Decrypted data
 */
async function decryptData(encryptedData, ivString, key) {
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivString), c => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt user credentials with device-specific key
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<string>} - Encrypted credentials as JSON string
 */
export async function encryptCredentials(username, password) {
    try {
        const deviceFingerprint = await generateDeviceFingerprint();
        const salt = generateSalt();
        const key = await deriveEncryptionKey(deviceFingerprint, salt);

        const credentials = {
            username: username,
            password: password,
            timestamp: Date.now()
        };

        const jsonString = JSON.stringify(credentials);
        const encryptedData = await encryptData(jsonString, key);

        return JSON.stringify({
            salt: salt,
            encrypted: encryptedData.encrypted,
            iv: encryptedData.iv
        });
    } catch (error) {
        console.error('Error encrypting credentials:', error);
        throw error;
    }
}

/**
 * Decrypt user credentials using device-specific key
 * @param {string} encryptedCredentials - Encrypted credentials JSON string
 * @returns {Promise<Object|null>} - Decrypted credentials object or null on error
 */
export async function decryptCredentials(encryptedCredentials) {
    if (!encryptedCredentials) {
        return null;
    }

    try {
        const encryptedData = JSON.parse(encryptedCredentials);

        const deviceFingerprint = await generateDeviceFingerprint();
        const key = await deriveEncryptionKey(deviceFingerprint, encryptedData.salt);

        const decryptedString = await decryptData(
            encryptedData.encrypted,
            encryptedData.iv,
            key
        );

        const credentials = JSON.parse(decryptedString);

        // Validate credentials structure
        if (!credentials.username || !credentials.password) {
            console.error('Invalid credentials structure');
            return null;
        }

        // Check if credentials are too old (30 days)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        if (credentials.timestamp && (Date.now() - credentials.timestamp) > thirtyDaysInMs) {
            console.warn('Credentials are older than 30 days, consider re-authentication');
            // Don't return null, just warn - let the user decide
        }

        return {
            username: credentials.username,
            password: credentials.password,
            timestamp: credentials.timestamp
        };

    } catch (error) {
        console.error('Error decrypting credentials:', error);
        // If decryption fails, it might be due to device change or corrupted data
        clearCredentials();
        return null;
    }
}

/**
 * Check if valid credentials exist in storage
 * @returns {Promise<boolean>} - True if valid credentials exist
 */
export async function hasValidCredentials() {
    try {
        const encryptedCredentials = localStorage.getItem('credentials');
        if (!encryptedCredentials) {
            return false;
        }

        const credentials = await decryptCredentials(encryptedCredentials);
        return credentials !== null;
    } catch (error) {
        console.error('Error checking valid credentials:', error);
        return false;
    }
}

/**
 * Get saved credentials from storage
 * @returns {Promise<Object|null>} - Credentials object or null
 */
export async function getSavedCredentials() {
    try {
        const encryptedCredentials = localStorage.getItem('credentials');
        if (!encryptedCredentials) {
            return null;
        }

        return await decryptCredentials(encryptedCredentials);
    } catch (error) {
        console.error('Error getting saved credentials:', error);
        return null;
    }
}

/**
 * Save encrypted credentials to storage
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<boolean>} - True if save was successful
 */
export async function saveCredentials(username, password) {
    try {
        const encryptedCredentials = await encryptCredentials(username, password);
        localStorage.setItem('credentials', encryptedCredentials);
        console.log('Credentials saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving credentials:', error);
        return false;
    }
}

/**
 * Clear all stored credentials
 */
export function clearCredentials() {
    localStorage.removeItem('credentials');
    localStorage.removeItem('app_username'); // נקה גם את השם המשתמש הישן
    console.log('Credentials cleared from localStorage');
}

/**
 * Update stored password while keeping existing username
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} - True if update was successful
 */
export async function updatePassword(newPassword) {
    try {
        const credentials = await getSavedCredentials();
        if (!credentials) {
            console.error('No existing credentials to update');
            return false;
        }

        return await saveCredentials(credentials.username, newPassword);
    } catch (error) {
        console.error('Error updating password:', error);
        return false;
    }
}

/**
 * Validate credentials against the server
 * @returns {Promise<boolean>} - True if credentials are valid
 */
export async function validateCredentials() {
    try {
        const credentials = await getSavedCredentials();
        if (!credentials) {
            return false;
        }

        const response = await fetch(
            `https://www.call2all.co.il/ym/api/GetSession?token=${credentials.username}:${credentials.password}`
        );
        const data = await response.json();

        return data.responseStatus === 'OK';
    } catch (error) {
        console.error('Error validating credentials:', error);
        return false;
    }
}

/**
 * Get device fingerprint (for debugging purposes)
 * @returns {Promise<string>} - Device fingerprint
 */
export async function getDeviceFingerprint() {
    return await generateDeviceFingerprint();
}