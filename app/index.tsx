import { Link, useRouter } from 'expo-router'; // IMPORTANT: Import Link AND useRouter
import { FirebaseError } from 'firebase/app';
import { useState } from "react";
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
import styles from '../styles/IndexScreenStyles';
import { signInUser } from './services/authService';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signIn = async () => {
  setLoading(true);
  try {
    await signInUser(email, password);
  } catch (e: any) {
    const err = e as FirebaseError;
    alert('Sign in failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};

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