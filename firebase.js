// Firebase helper module for MetaForge
// To enable authentication and cloud persistence, set a valid Firebase config.
// You can set it by editing this file or by defining window.FIREBASE_CONFIG before script execution.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "<YOUR_API_KEY>",
  authDomain: "<YOUR_AUTH_DOMAIN>",
  projectId: "<YOUR_PROJECT_ID>",
  storageBucket: "<YOUR_STORAGE_BUCKET>",
  messagingSenderId: "<YOUR_MESSAGING_SENDER_ID>",
  appId: "<YOUR_APP_ID>"
};

// If a local `firebase.config.js` exists, use it (this file is gitignored). This makes it easy
// to run locally with secrets without committing them, while keeping the default placeholders
// safe for GitHub.
(async () => {
  try {
    const mod = await import('./firebase.config.js');
    if (mod?.FIREBASE_CONFIG) {
      firebaseConfig = mod.FIREBASE_CONFIG;
    }
  } catch (e) {
    // No config file present or import failed; just use window.FIREBASE_CONFIG / defaults.
  }
})();

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('<'));

let app = null;
let auth = null;
let db = null;

export function initFirebase() {
  if (!firebaseEnabled) return null;
  if (app) return { app, auth, db };
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}

function ensureReady() {
  if (!firebaseEnabled) throw new Error('Firebase is not configured.');
  if (!auth || !db) initFirebase();
}

export async function signInWithEmail(email, password) {
  ensureReady();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email, password) {
  ensureReady();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  ensureReady();
  return firebaseSignOut(auth);
}

export function onAuthStateChanged(callback) {
  if (!firebaseEnabled) return () => {};
  ensureReady();
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function getUserData(uid) {
  ensureReady();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserData(uid, data) {
  ensureReady();
  const ref = doc(db, 'users', uid);
  const payload = { ...data, updatedAt: serverTimestamp() };
  return setDoc(ref, payload, { merge: true });
}
