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

const LOCAL_AUTH_USERS_KEY = 'metaforge_local_users';
const LOCAL_AUTH_CURRENT_USER_KEY = 'metaforge_local_current_user';
const localAuthCallbacks = new Set();

function loadLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUTH_USERS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_AUTH_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Unable to save local auth users', e);
  }
}

function setLocalCurrentUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(LOCAL_AUTH_CURRENT_USER_KEY);
    } else {
      localStorage.setItem(LOCAL_AUTH_CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('Unable to set local current user', e);
  }
  for (const cb of localAuthCallbacks) cb(user);
}

function getLocalCurrentUser() {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

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

async function localSignIn(email, password) {
  const users = loadLocalUsers();
  if (!users[email] || users[email] !== password) {
    throw new Error('Invalid email or password.');
  }
  const user = { uid: email, email, isGuest: false };
  setLocalCurrentUser(user);
  return user;
}

async function localSignUp(email, password) {
  const users = loadLocalUsers();
  if (users[email]) {
    throw new Error('An account with that email already exists.');
  }
  users[email] = password;
  saveLocalUsers(users);
  const user = { uid: email, email, isGuest: false };
  setLocalCurrentUser(user);
  return user;
}

async function localSignOut() {
  setLocalCurrentUser(null);
  return null;
}

function localOnAuthStateChanged(callback) {
  localAuthCallbacks.add(callback);
  // Immediately call with current local user.
  callback(getLocalCurrentUser());
  return () => localAuthCallbacks.delete(callback);
}

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
  if (!firebaseEnabled()) return;
  if (!auth || !db) await initFirebase();
}

export async function signInWithEmail(email, password) {
  if (firebaseEnabled()) {
    await ensureReady();
    return auth.signInWithEmailAndPassword(email, password);
  }
  return localSignIn(email, password);
}

export async function signUpWithEmail(email, password) {
  if (firebaseEnabled()) {
    await ensureReady();
    return auth.createUserWithEmailAndPassword(email, password);
  }
  return localSignUp(email, password);
}

export async function signOut() {
  if (firebaseEnabled()) {
    await ensureReady();
    return auth.signOut();
  }
  return localSignOut();
}

export async function onAuthStateChanged(callback) {
  await initFirebase();
  if (firebaseEnabled()) {
    return auth.onAuthStateChanged(callback);
  }
  return localOnAuthStateChanged(callback);
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
