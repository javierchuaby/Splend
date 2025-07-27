import { getApp } from '@react-native-firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    signOut,
    updateProfile
} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const query = await firestore()
    .collection('users')
    .where('username', '==', username.toLowerCase())
    .get();
  return !query.empty;
};

export const createUserAccount = async (
  email: string,
  password: string,
  displayName: string,
  username: string
) => {
  const app = getApp();
  const auth = getAuth(app);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user) {
    await updateProfile(user, { displayName });
    await firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName,
      username: username.toLowerCase(),
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    await signOut(auth);
  }

  return user;
};