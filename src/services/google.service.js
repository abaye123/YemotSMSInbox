/**
 * Google Contacts Integration Service
 * Handles authentication, token management, and contacts retrieval
 */

import { getAuthToken } from "../utils/auth";

// Constants for Google authentication
const CLIENT_ID = '293453062070-ne2pf11bn93mjr9mka97i484rb150vlt.apps.googleusercontent.com';
// עדכון הסקופים לכלול גישה לאימייל
const SCOPES = 'https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email';
const DISCOVERY_DOC = 'https://people.googleapis.com/$discovery/rest?version=v1';

/**
 * Get Google contacts if authenticated
 * @returns {Promise<Object>} Authentication status, contacts, and user data
 */
export async function getGoogleContacts() {
  try {
    console.log('Getting Google contacts...');
    
    // Check if GAPI is available
    if (!window.gapi) {
      console.log('GAPI not loaded, loading now...');
      await loadGoogleApi();
    }

    // Check for stored token
    const userData = await getGoogleTokenData();
    console.log('User token data retrieved:', userData ? 'Found' : 'Not found');

    if (userData && userData.token &&
      userData.tokenExpiry && new Date(userData.tokenExpiry).getTime() > Date.now()) {
      console.log('Valid token found, expiry:', new Date(userData.tokenExpiry).toLocaleString());
      
      // We have a valid token, use it
      gapi.client.setToken({ access_token: userData.token });

      // Fetch contacts
      console.log('Fetching contacts with token...');
      const contacts = await fetchGoogleContacts(userData.token);
      console.log(`Retrieved ${contacts.length} contacts`);

      return {
        isAuthenticated: true,
        contacts: contacts,
        userData: {
          email: userData.userEmail,
          tokenExpiry: new Date(userData.tokenExpiry).toLocaleString()
        }
      };
    } else {
      if (userData) {
        console.log('Token expired or invalid, expiry:', 
                   userData.tokenExpiry ? new Date(userData.tokenExpiry).toLocaleString() : 'none');
      } else {
        console.log('No token data found');
      }
      
      // Need to authenticate - check if GSI is loaded
      if (!window.google || !window.google.accounts) {
        console.log('Google Identity Services not loaded, loading now...');
        await loadGoogleIdentityServices();
      }

      // Return authentication status
      return {
        isAuthenticated: false,
        contacts: [],
        userData: null
      };
    }
  } catch (error) {
    console.error('Error in getGoogleContacts:', error);
    return {
      isAuthenticated: false,
      contacts: [],
      userData: null,
      error: error.message
    };
  }
}

/**
 * Load Google API script
 * @returns {Promise<void>}
 */
export function loadGoogleApi() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('GAPI loaded successfully');

      // Initialize GAPI
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
          });
          console.log('GAPI client initialized');
          resolve();
        } catch (error) {
          console.error('Error initializing GAPI client:', error);
          reject(error);
        }
      });
    };

    script.onerror = (error) => {
      console.error('Error loading GAPI:', error);
      reject(new Error('Failed to load Google API'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Load Google Identity Services
 * @returns {Promise<void>}
 */
export function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Identity Services loaded successfully');
      resolve();
    };

    script.onerror = (error) => {
      console.error('Error loading Google Identity Services:', error);
      reject(new Error('Failed to load Google Identity Services'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initiate Google login flow
 * @returns {Promise<boolean>} Success status
 */
export async function initiateGoogleLogin() {
  try {
    // Ensure Google APIs are loaded
    if (!window.gapi) await loadGoogleApi();
    if (!window.google || !window.google.accounts) await loadGoogleIdentityServices();

    return new Promise((resolve) => {
      // Setup token client
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES, // כולל כעת גם הרשאות אימייל
        prompt: 'consent', // תמיד נבקש הסכמה מחדש למקרה של שגיאות 403
        callback: async (response) => {
          if (response.error) {
            console.error('Authentication error:', response.error);
            resolve(false);
            return;
          }

          // Successfully received token
          const token = response.access_token;
          const tokenExpiry = Date.now() + (response.expires_in * 1000);

          // נרשום מידע מלא על התהליך
          console.log('Received token:', token.substring(0, 10) + '...');
          console.log('Token expiry:', new Date(tokenExpiry).toLocaleString());

          try {
            // Set token in GAPI
            gapi.client.setToken({ access_token: token });

            // Get user email with additional logging
            console.log('Fetching user info...');
            const userInfo = await fetchUserInfo(token);
            console.log('User info received:', userInfo);

            if (!userInfo.email) {
              console.error('Failed to get user email despite successful authentication');
            }

            // Save token data
            console.log('Saving token data...');
            const success = await saveGoogleTokenData({
              token: token,
              tokenExpiry: new Date(tokenExpiry).toISOString(),
              userEmail: userInfo.email
            });
            
            if (success) {
              console.log('Token data saved successfully');
            } else {
              console.error('Failed to save token data');
            }

            resolve(success);
          } catch (err) {
            console.error('Error in token processing:', err);
            resolve(false);
          }
        }
      });

      // Request token with explicit prompt to handle 403 errors
      tokenClient.requestAccessToken();
    });
  } catch (error) {
    console.error('Error initiating Google login:', error);
    return false;
  }
}

/**
 * Fetch user info from Google
 * @param {string} token Access token
 * @returns {Promise<Object>} User info
 */
export async function fetchUserInfo(token) {
  try {
    console.log('Fetching user info with token...');
    
    // נסה קודם כל בשיטה ישירה יותר
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        console.log('User info from userinfo endpoint:', userInfo);
        if (userInfo.email) {
          return { email: userInfo.email };
        }
      } else {
        console.warn('Failed to get user info from userinfo endpoint:', 
                   await userInfoResponse.text());
      }
    } catch (userInfoError) {
      console.error('Error fetching from userinfo endpoint:', userInfoError);
    }
    
    // אם לא הצלחנו, ננסה עם People API
    const response = await gapi.client.request({
      path: 'https://people.googleapis.com/v1/people/me',
      method: 'GET',
      params: {
        personFields: 'emailAddresses,names',
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('People API response:', response);
    
    let email = '';
    if (response.result && response.result.emailAddresses && response.result.emailAddresses.length > 0) {
      email = response.result.emailAddresses[0].value;
      console.log('Found email in people API:', email);
    }

    return { email };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return { email: '' };
  }
}

/**
 * Fetch Google contacts using the token
 * @param {string} token Access token
 * @returns {Promise<Array>} Formatted contacts
 */
export async function fetchGoogleContacts(token) {
  try {
    // Make the request to Google People API with explicit token in headers
    const response = await gapi.client.request({
      path: 'https://people.googleapis.com/v1/people/me/connections',
      method: 'GET',
      params: {
        personFields: 'names,phoneNumbers',
        pageSize: 1000
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Process the results
    let formattedContacts = [];

    if (response.result && response.result.connections) {
      console.log(`Processing ${response.result.connections.length} raw contacts`);
      
      // Extract and format contacts with phone numbers
      formattedContacts = response.result.connections
        .filter(person => person.phoneNumbers && person.phoneNumbers.length > 0)
        .map(person => {
          // Format phone number - keep only digits and ensure it starts with 0 if Israeli number
          let phone = person.phoneNumbers[0].value.replace(/\D/g, '');
          if (phone.startsWith('972')) {
            phone = '0' + phone.substring(3);
          }

          return {
            name: person.names && person.names.length > 0 ? person.names[0].displayName : 'ללא שם',
            phone: phone
          };
        });
      
      console.log(`Formatted ${formattedContacts.length} contacts with phone numbers`);
    } else {
      console.log('No connections found in the response');
    }

    return formattedContacts;
  } catch (error) {
    console.error('Error fetching Google contacts:', error);

    // Check if token is invalid
    if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
      // Token expired - remove it
      console.log('Token expired (401), removing token data');
      await deleteGoogleTokenData();
    } else if (error.status === 403 || (error.result && error.result.error && error.result.error.code === 403)) {
      // Permission issue
      console.log('Permission denied (403), removing token and requesting a new one');
      await deleteGoogleTokenData();
    }

    return [];
  }
}

/**
 * Save Google token data to server
 * @param {Object} userData User data to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveGoogleTokenData(userData) {
  try {
    console.log('Saving Google token data');

    // Convert data to JSON string
    const dataAsString = JSON.stringify(userData);

    // Upload to server
    const response = await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
        what: 'ivr2:GoogleToken.txt',
        contents: dataAsString
      })
    });

    if (!response.ok) {
      throw new Error(`Error saving token data: ${response.status}`);
    }

    console.log('Google token data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving Google token data:', error);
    return false;
  }
}

/**
 * Get Google token data from server
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function getGoogleTokenData() {
  try {
    console.log('Retrieving Google token data');

    // Get data from server
    const response = await fetch(
      `https://www.call2all.co.il/ym/api/GetTextFile?token=${await getAuthToken()}&what=ivr2:GoogleToken.txt`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log('No Google token data found');
        return null;
      }
      throw new Error(`Error retrieving token data: ${response.status}`);
    }

    const responseData = await response.json();

    // Parse token data
    if (responseData && responseData.contents) {
      try {
        const userData = JSON.parse(responseData.contents);
        console.log('Google token data retrieved successfully');
        return userData;
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return null;
      }
    }

    console.log('Invalid token data received');
    return null;
  } catch (error) {
    console.error('Error retrieving Google token data:', error);
    return null;
  }
}

/**
 * Delete Google token data from server
 * @returns {Promise<boolean>} Success status
 */
export async function deleteGoogleTokenData() {
  try {
    console.log('Deleting Google token data');

    // Upload empty file to replace existing one
    await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
        what: 'ivr2:GoogleToken.txt',
        contents: ''
      })
    });

    console.log('Google token data deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting Google token data:', error);
    return false;
  }
}

/**
 * Log out from Google
 * @returns {Promise<boolean>} Success status
 */
export async function logoutFromGoogle() {
  try {
    console.log('Logging out from Google');

    // Revoke token if Google API is available
    if (window.google && google.accounts && google.accounts.oauth2) {
      const userData = await getGoogleTokenData();
      if (userData && userData.token) {
        google.accounts.oauth2.revoke(userData.token, () => {
          console.log('Token revoked successfully');
        });
      }
    }

    // Clear GAPI token
    if (window.gapi && gapi.client) {
      gapi.client.setToken(null);
    }

    // Delete token data from server
    await deleteGoogleTokenData();

    console.log('Google logout completed');
    return true;
  } catch (error) {
    console.error('Error logging out from Google:', error);
    return false;
  }
}

/**
 * Check Google authentication status
 * @returns {Promise<Object>} Authentication status
 */
export async function checkGoogleAuthStatus() {
  try {
    console.log('Checking Google authentication status');
    
    // בדוק אם יש טוקן שמור לפני שמנסים להתחבר ל-API
    const userData = await getGoogleTokenData();
    
    if (userData && userData.token && userData.tokenExpiry) {
      const isTokenValid = new Date(userData.tokenExpiry).getTime() > Date.now();
      console.log('Found token, valid:', isTokenValid, 'expiry:', new Date(userData.tokenExpiry).toLocaleString());
      
      if (isTokenValid) {
        // אם הטוקן תקף, טען את ה-API ונסה לקבל אנשי קשר
        if (!window.gapi) await loadGoogleApi();
        
        // הגדר את הטוקן ב-GAPI
        gapi.client.setToken({ access_token: userData.token });
        
        // נסה לקבל אנשי קשר כדי לוודא שהטוקן עובד
        try {
          const contacts = await fetchGoogleContacts(userData.token);
          console.log(`Retrieved ${contacts.length} contacts during status check`);
          
          return {
            isAuthenticated: true,
            userEmail: userData.userEmail || '',
            contactCount: contacts.length
          };
        } catch (fetchError) {
          console.error('Error fetching contacts during status check:', fetchError);
          // אם יש שגיאה בקבלת אנשי קשר, ייתכן שהטוקן לא תקף למרות התאריך
          if (fetchError.status === 401 || fetchError.status === 403) {
            console.log('Token validation failed despite valid expiry date, removing token');
            await deleteGoogleTokenData();
          }
        }
      } else {
        // הטוקן פג תוקף, מחק אותו
        console.log('Token expired, removing');
        await deleteGoogleTokenData();
      }
    } else {
      console.log('No valid token data found during status check');
    }
    
    // אם הגענו לכאן, המשתמש לא מחובר
    return {
      isAuthenticated: false,
      userEmail: '',
      contactCount: 0
    };
  } catch (error) {
    console.error('Error in checkGoogleAuthStatus:', error);
    return {
      isAuthenticated: false,
      userEmail: '',
      contactCount: 0
    };
  }
}
