import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Sua configuração oficial
const firebaseConfig = {
  apiKey: "AIzaSyArVVvUjJoT0VQkDpjlxp3Bhn1liuxnx14",
  authDomain: "sistema-inventario-003.firebaseapp.com",
  projectId: "sistema-inventario-003",
  storageBucket: "sistema-inventario-003.firebasestorage.app",
  messagingSenderId: "187498727720",
  appId: "1:187498727720:web:2e4d2adc1fd15cfb73e81d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { app, auth, db };
