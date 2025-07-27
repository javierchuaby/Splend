import { getApp } from '@react-native-firebase/app';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const signInUser = async (email: string, password: string): Promise<FirebaseAuthTypes.User> => {
  const app = getApp();
  const auth = getAuth(app);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  const auth = getAuth();
  await signOut(auth);
};

export const listenToAuthChanges = (cb: (user: FirebaseAuthTypes.User | null) => void) => {
  const auth = getAuth();
  return onAuthStateChanged(auth, cb);
};

export const getCurrentUserData = async () => {
  const user = getAuth().currentUser;
  if (!user) return null;
  
  const userDoc = await firestore().collection('users').doc(user.uid).get();
  if (!userDoc.exists()) return null;
  
  const userData = userDoc.data();
  return {
    id: user.uid,
    username: userData?.username,
    displayName: userData?.displayName,
    billIds: userData?.billIds || [],
    totalSpent: userData?.totalSpent || 0,
    totalPaid: userData?.totalPaid || 0,
  };
};

export const listenToCurrentUser = (callback: (user: any) => void) => {
  const auth = getAuth();
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await getCurrentUserData();
      callback(userData);
    } else {
      callback(null);
    }
  });
};