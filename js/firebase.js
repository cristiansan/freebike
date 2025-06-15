// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzG7qc45t37BgbuRD5S-SgRpo52NpSGGA",
    authDomain: "monitor-entrenamiento-1fc15.firebaseapp.com",
    projectId: "monitor-entrenamiento-1fc15",
    storageBucket: "monitor-entrenamiento-1fc15.firebasestorage.app",
    messagingSenderId: "662506260306",
    appId: "1:662506260306:web:a970482d97005557ca5c8b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

