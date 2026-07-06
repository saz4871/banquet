// NOTE: This file is imported by HTML <script type="module"> on the client.
// Keep it browser-safe (no Node-only APIs).

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDmjfsZcQ_cqH_SAXBfg6-BIACbs_jtUw",
  authDomain: "banquet-744d0.firebaseapp.com",
  databaseURL:
    "https://banquet-744d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "banquet-744d0",
  storageBucket: "banquet-744d0.firebasestorage.app",
  messagingSenderId: "648773878860",
  appId: "1:648773878860:web:5480be78312097c3caa0e9",
  measurementId: "G-QH80XEQH90",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;

