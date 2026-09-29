/**
 * CODEVISION — FIREBASE CONFIGURATION
 * Allows seamless switching between Cloud Firebase and Local Realtime Sync.
 */

const FIREBASE_STORAGE_KEY = 'codevision_firebase_config';

// Default / fallback Firebase config structure
const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/**
 * Get active Firebase configuration (checks localStorage first)
 */
function getFirebaseConfig() {
  try {
    const custom = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read custom Firebase config from localStorage", e);
  }
  return defaultFirebaseConfig;
}

/**
 * Save Firebase configuration to localStorage
 */
function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Failed to save Firebase config", e);
    return false;
  }
}

/**
 * Check if valid Firebase configuration is present
 */
function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId && config.apiKey.length > 5);
}

window.CodevisionFirebase = {
  getConfig: getFirebaseConfig,
  saveConfig: saveFirebaseConfig,
  isConfigured: isFirebaseConfigured
};
