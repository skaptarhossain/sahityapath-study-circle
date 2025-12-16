import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCW_TKwXChV1wLsYpjP7l-5M54qJh0R2Do",
  authDomain: "group-study-3b0ee.firebaseapp.com",
  projectId: "group-study-3b0ee",
  storageBucket: "group-study-3b0ee.firebasestorage.app",
  messagingSenderId: "1094652870498",
  appId: "1:1094652870498:web:cdd87c7a7e498d38c85057"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSubjects() {
  const snapshot = await getDocs(collection(db, 'library-subjects'));
  console.log('\n=== All Subjects in Firebase ===\n');
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Name: ${data.name} | isActive: ${data.isActive}`);
  });
  process.exit(0);
}

checkSubjects();
