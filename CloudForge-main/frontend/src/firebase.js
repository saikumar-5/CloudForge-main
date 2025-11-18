import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8JWOLzjKmn8hD57XkBDj0WIPMm5HD_L8",
  authDomain: "cloudforge-7a3c2.firebaseapp.com",
  projectId: "cloudforge-7a3c2",
  storageBucket: "cloudforge-7a3c2.firebasestorage.app",
  messagingSenderId: "1082887552240",
  appId: "1:1082887552240:web:01695f83db2fa06b97d635",
  measurementId: "G-BNPXM6MY8D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, analytics };
