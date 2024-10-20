import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyBLV16RuHfFJN0NMtmY_n1E31oNLOLNxWs",
  authDomain: "pothole-s8.firebaseapp.com",
  projectId: "pothole-s8",
  storageBucket: "pothole-s8.appspot.com",
  messagingSenderId: "628235712624",
  appId: "1:628235712624:web:b6693d5047b2e555e65cb5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

export { auth, firestore, storage };

