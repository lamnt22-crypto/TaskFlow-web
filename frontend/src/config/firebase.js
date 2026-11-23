import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDUDGPqX5m7iiksHvcR8GHeq-1cYFEdyh8",
  authDomain: "taskflow-e906a.firebaseapp.com",
  projectId: "taskflow-e906a",
  storageBucket: "taskflow-e906a.firebasestorage.app",
  messagingSenderId: "430953522538",
  appId: "1:430953522538:web:60d6b85728cff39057b113",
  measurementId: "G-BXNZKJQP97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export default app;
