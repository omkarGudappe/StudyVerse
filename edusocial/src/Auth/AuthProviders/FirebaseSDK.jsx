import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {   getDatabase } from "firebase/database";
import { 
  getAuth, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCU924uQ3oey-VI_2ea8R1aIgWgQmu6jyM",
  authDomain: "studyverse-1831.firebaseapp.com",
  projectId: "studyverse-1831",
  databaseURL: "https://studyverse-1831-default-rtdb.firebaseio.com/",
  storageBucket: "studyverse-1831.firebasestorage.app",
  messagingSenderId: "927779468178",
  appId: "1:927779468178:web:d6e04f1fa871df7152074b",
  measurementId: "G-ENL5DHRNRQ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
const analytics = getAnalytics(app);

export{
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  database,
}
