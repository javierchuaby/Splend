import { getApp } from '@react-native-firebase/app';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/SignUpScreenStyles';

export default function SignUp() {
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
        alert('This username is already taken.');
        setLoading(false);
        return;
      }

      // Step 2. Create account on Firebase Auth database
      const app = getApp();
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
          createdAt: firestore.FieldValue.serverTimestamp(), // kaypoh only
        });
      }
      
      // router.back(); // Dunno if I want this yet. It's smoother to just let the user in straightaway
    } catch (e: any) {
      const err = e as FirebaseError;
      // Common Firebase auth errors
      if (err.code === 'auth/email-already-in-use') {
        alert('The email address is already in use by another account.');
      } else if (err.code === 'auth/invalid-email') {
        alert('The email address is invalid.');
      } else if (err.code === 'auth/weak-password') {
        alert('Please choose a stronger password.');
      } else {
        alert('Registration failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f0f23" barStyle="light-content" />

      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Create Account</Text>
        <Text style={styles.subtitle}>Join Splend and start planning!</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder="Display Name"
            placeholderTextColor="#8e8e93"
          />
          <View style={styles.usernameInputWrapper}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={[styles.input, styles.usernameInput]}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))} // force username lowercase + no spaces
              autoCapitalize="none"
              placeholder="Username"
              placeholderTextColor="#8e8e93"
              autoCorrect={false}
            />
          </View>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email Address"
            placeholderTextColor="#8e8e93"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#8e8e93"
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4c6ef5"
            style={styles.loader}
          />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.createAccountButton]}
              onPress={handleSignUp}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => router.back()}
            >
              <Text style={styles.goBackText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}