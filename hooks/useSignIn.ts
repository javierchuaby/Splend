import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signIn = async () => {
    setLoading(true);
    try {
      const app = getApp();
      const authInstance = getAuth(app);
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (e: any) {
      const err = e as FirebaseError;
      Alert.alert('Sign In Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    signIn,
  };
}