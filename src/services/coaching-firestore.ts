import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { TeacherProfile, Course } from '@/types';

// Collection names
const TEACHERS_COLLECTION = 'teachers';
const COURSES_COLLECTION = 'courses';

// ==================== Teacher Profile ====================

export async function saveTeacherProfile(profile: TeacherProfile): Promise<void> {
  try {
    const docRef = doc(db, TEACHERS_COLLECTION, profile.userId);
    await setDoc(docRef, {
      ...profile,
      updatedAt: serverTimestamp(),
      createdAt: profile.createdAt || serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving teacher profile:', error);
    throw error;
  }
}

export async function getTeacherProfile(userId: string): Promise<TeacherProfile | null> {
  try {
    const docRef = doc(db, TEACHERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as TeacherProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting teacher profile:', error);
    return null;
  }
}

export async function getAllTeachers(): Promise<TeacherProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, TEACHERS_COLLECTION));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as TeacherProfile;
    });
  } catch (error) {
    console.error('Error getting all teachers:', error);
    return [];
  }
}

// ==================== Courses ====================

export async function saveCourse(course: Course): Promise<string> {
  try {
    if (course.id && !course.id.startsWith('course_temp_')) {
      // Update existing course
      const docRef = doc(db, COURSES_COLLECTION, course.id);
      await updateDoc(docRef, {
        ...course,
        updatedAt: serverTimestamp()
      });
      return course.id;
    } else {
      // Create new course
      const docRef = await addDoc(collection(db, COURSES_COLLECTION), {
        ...course,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
}

export async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Course;
    }
    return null;
  } catch (error) {
    console.error('Error getting course:', error);
    return null;
  }
}

export async function getCoursesByTeacher(teacherId: string): Promise<Course[]> {
  try {
    const q = query(collection(db, COURSES_COLLECTION), where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Course;
    });
  } catch (error) {
    console.error('Error getting courses by teacher:', error);
    return [];
  }
}

export async function getAllCourses(): Promise<Course[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as Course;
    });
  } catch (error) {
    console.error('Error getting all courses:', error);
    return [];
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COURSES_COLLECTION, courseId));
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

// ==================== Sync Helper ====================

export async function syncLocalToFirestore(
  teacherProfile: TeacherProfile | null,
  myCourses: Course[]
): Promise<void> {
  try {
    // Sync teacher profile
    if (teacherProfile) {
      await saveTeacherProfile(teacherProfile);
    }
    
    // Sync courses
    for (const course of myCourses) {
      await saveCourse(course);
    }
  } catch (error) {
    console.error('Error syncing to Firestore:', error);
    throw error;
  }
}
