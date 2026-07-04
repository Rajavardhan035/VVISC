// ============================================
// Firebase Configuration
// ============================================
// Replace the values below with YOUR Firebase project's config.
// Find this in: Firebase Console → Project Settings → General →
// "Your apps" → SDK setup and configuration → Config.
//
// This file is loaded by login.html and signup.html.
// ============================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1sGgAgk4dojpiT9EXlh8L1we92PBDOYY",
  authDomain: "vvise-iucee.firebaseapp.com",
  projectId: "vvise-iucee",
  storageBucket: "vvise-iucee.firebasestorage.app",
  messagingSenderId: "752190400456",
  appId: "1:752190400456:web:acc28163145904a51682fd",
  measurementId: "G-JW3REJFJL8"
};  

// Initialize Firebase (compat SDK — loaded via <script> tags in the HTML)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
