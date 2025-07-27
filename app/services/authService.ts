import { getApp } from '@react-native-firebase/app';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@react-native-firebase/auth';

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