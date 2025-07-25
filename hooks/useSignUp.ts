import { getApp } from '@react-native-firebase/app';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useSignUp() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // Step 1. Check if username already exists
      const usernameQuery = await firestore()
        .collection('users')
        .where('username', '==', username.toLowerCase())
        .get();

      if (!usernameQuery.empty) {
        Alert.alert('Sign Up Failed', 'This username is already taken.');
        setLoading(false);
        return;
      }

      // Step 2. Create account on Firebase Auth database
      const app = getApp();
      const authInstance = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        email,
        password,
      );
      const user = userCredential.user;

      if (user) {
        // 3. Update Firebase Auth with display name
        await updateProfile(user, {
          displayName: displayName,
        });

        // 4. Store additional user data in Firestore collection "users"
        await firestore().collection('users').doc(user.uid).set({
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          username: username.toLowerCase(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e: any) {
      const err = e as FirebaseError;
      let errorMessage = 'Registration failed: ' + err.message;

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'The email address is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Please choose a stronger password.';
      }
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    displayName,
    setDisplayName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    handleSignUp,
  };
}