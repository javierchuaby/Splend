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
import { createUserAccount, isUsernameTaken } from './services/firestoreService';

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
    const taken = await isUsernameTaken(username);
    if (taken) {
      alert('This username is already taken.');
      return;
    }

    await createUserAccount(email, password, displayName, username);
    router.push('/');
  } catch (e: any) {
    const err = e as FirebaseError;
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