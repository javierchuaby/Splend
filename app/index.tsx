import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { Link, useRouter } from 'expo-router'; // IMPORTANT: Import Link AND useRouter
import { FirebaseError } from 'firebase/app';
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // IMPORTANT: Initialize router

  // The signUp function is no longer directly here.
  // It's handled by the dedicated sign-up.tsx page
  // and the Link component will navigate there.

  const signIn = async () => {
    setLoading(true);
    try {
      const app = getApp();
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      const err = e as FirebaseError;
      alert('Sign in failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f0f23" barStyle="light-content" />

      {/* Title container */}
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Splend</Text>
        <Text style={styles.subtitle}>Have a plan? Splend it!</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#8e8e93"
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
          <ActivityIndicator size="large" color="#4c6ef5" style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.signInButton]} onPress={signIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            {/* IMPORTANT: Link to the sign-up page */}
            <Link href="/sign-up" asChild>
              <TouchableOpacity style={styles.signUpTextButton}>
                <Text style={styles.signUpText}>Create New Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },

  pageTitleContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },

  pageTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#4c6ef5',
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 18,
    color: '#a0a0ab',
    marginTop: 8,
    fontWeight: '400',
  },

  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  inputContainer: {
    marginBottom: 32,
  },

  input: {
    height: 56,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonContainer: {
    gap: 12,
  },

  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },

  signInButton: {
    backgroundColor: '#4c6ef5',
  },

  // These styles are for the "Create New Account" text button
  signUpTextButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: '#a0a0ab',
    fontWeight: '500',
  },

  // Removed the old signUpButton styles as it's now a text button
  // signUpButton: {
  //   backgroundColor: 'transparent',
  //   borderWidth: 2,
  //   borderColor: '#4c6ef5',
  // },

  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },

  loader: {
    marginVertical: 32,
  },
});