import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB4gt3kN-1QSXcUFaaOUYJjbG5La-5iA64",
  authDomain: "media-tracker-94a70.firebaseapp.com",
  projectId: "media-tracker-94a70",
  storageBucket: "media-tracker-94a70.firebasestorage.app",
  messagingSenderId: "753329770698",
  appId: "1:753329770698:web:2fb091751e1de2696ce433"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);


