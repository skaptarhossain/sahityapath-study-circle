import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAY6SbxMjFxgzzV4_drApxuiit4lnJmfw",
  authDomain: "group-study-3b0ee.firebaseapp.com",
  projectId: "group-study-3b0ee",
  storageBucket: "group-study-3b0ee.firebasestorage.app",
  messagingSenderId: "209242981722",
  appId: "1:209242981722:web:817829ea089db024851f63"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  console.log('Checking Firestore data...\n');
  
  // Check teachers
  const teachersSnapshot = await getDocs(collection(db, 'teachers'));
  console.log(`Teachers collection: ${teachersSnapshot.size} documents`);
  teachersSnapshot.forEach(doc => {
    console.log(`  - ${doc.id}: ${doc.data().displayName || 'No name'}`);
  });
  
  // Check courses
  const coursesSnapshot = await getDocs(collection(db, 'courses'));
  console.log(`\nCourses collection: ${coursesSnapshot.size} documents`);
  coursesSnapshot.forEach(doc => {
    console.log(`  - ${doc.id}: ${doc.data().title || 'No title'}`);
  });
  
  process.exit(0);
}

checkData().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
