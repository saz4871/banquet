// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDmjfsZcQ_cqH_SAXBfg6-BIACbs_jtUw",
  authDomain: "banquet-744d0.firebaseapp.com",
  databaseURL: "https://banquet-744d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "banquet-744d0",
  storageBucket: "banquet-744d0.firebasestorage.app",
  messagingSenderId: "648773878860",
  appId: "1:648773878860:web:5480be78312097c3caa0e9",
  measurementId: "G-QH80XEQH90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics, firebaseConfig };

