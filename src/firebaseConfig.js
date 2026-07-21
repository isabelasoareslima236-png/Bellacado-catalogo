import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDzdf0sEORedLTEdrZlOS4WhepP737pCSs",
  authDomain: "bellacado-2c035.firebaseapp.com",
  projectId: "bellacado-2c035",
  storageBucket: "bellacado-2c035.firebasestorage.app",
  messagingSenderId: "273710950409",
  appId: "1:273710950409:web:95abb5def544befa79f0d8",
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
