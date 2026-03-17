// Firebase helper module for MetaForge
// Uses the Firebase CDN (compat mode) and the global `firebase` namespace.
// To enable authentication and cloud persistence, configure your Firebase settings in
// `firebase.config.js` (gitignored) or via `window.FIREBASE_CONFIG`.

let firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "<YOUR_API_KEY>",
  authDomain: "<YOUR_AUTH_DOMAIN>",
  projectId: "<YOUR_PROJECT_ID>",
  storageBucket: "<YOUR_STORAGE_BUCKET>",
  messagingSenderId: "<YOUR_MESSAGING_SENDER_ID>",
  appId: "<YOUR_APP_ID>"
};

async function loadConfig() {
  // Attempt to load a local config file if present (gitignored).
  try {
    const mod = await import('./firebase.config.js');
    if (mod?.FIREBASE_CONFIG) {
      firebaseConfig = mod.FIREBASE_CONFIG;
    }
  } catch (e) {
    // ignore; use window.FIREBASE_CONFIG or defaults
  }
}

function isConfigured() {
  return (
    typeof firebase !== 'undefined' &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('<')
  );
}

export const firebaseEnabled = () => isConfigured();

let app = null;
let auth = null;
let db = null;

export async function initFirebase() {
  await loadConfig();
  if (!firebaseEnabled()) return null;
  if (app) return { app, auth, db };

  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

  return { app, auth, db };
}

async function ensureReady() {
  if (!firebaseEnabled()) throw new Error('Firebase is not configured.');
  if (!auth || !db) await initFirebase();
}

export async function signInWithEmail(email, password) {
  await ensureReady();
  return auth.signInWithEmailAndPassword(email, password);
}

export async function signUpWithEmail(email, password) {
  await ensureReady();
  return auth.createUserWithEmailAndPassword(email, password);
}

export async function signOut() {
  await ensureReady();
  return auth.signOut();
}

export function onAuthStateChanged(callback) {
  if (!firebaseEnabled()) return () => {};
  if (!auth || !db) initFirebase();
  return auth.onAuthStateChanged(callback);
}

export async function getUserData(uid) {
  await ensureReady();
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function saveUserData(uid, data) {
  await ensureReady();
  const ref = db.collection('users').doc(uid);
  const payload = { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  return ref.set(payload, { merge: true });
}
