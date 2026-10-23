const firebaseConfig = {
  apiKey: "AIzaSyADZEx1TCLoMwvXm6MYvQuuottFiyDNwRk",
  authDomain: "vvisc-iucee.firebaseapp.com",
  projectId: "vvisc-iucee",
  storageBucket: "vvisc-iucee.firebasestorage.app",
  messagingSenderId: "723854675407",
  appId: "1:723854675407:web:a1bf6c9a9749ca7c0216ba",
  measurementId: "G-6KXEHRPK2F"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Ensure global accessibility across all browsers, modules and devices
window.firebase = firebase;
window.auth = auth;
window.db = db;
if (typeof firebase.storage === "function") {
  window.storage = firebase.storage();
}

