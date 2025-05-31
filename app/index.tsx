import auth from '@react-native-firebase/auth';
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

  const signUp = async () => {
    setLoading(true);
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      alert('Check your emails!');
    } catch (e: any) {
      const err = e as FirebaseError;
      alert('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async () => {
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e: any) {
      const err = e as FirebaseError;
      alert('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e1e1e" barStyle="light-content" />

      {/* Title container */}
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Splend</Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'center' }}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
        />
        {loading ? (
          <ActivityIndicator size={'small'} style={{ margin:28 }} />
        ) : (
          <>
            <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={signUp}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.signInButton]} onPress={signIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    marginHorizontal: 0,
    flex: 1,
    justifyContent: 'center',
    padding: 0,
    paddingHorizontal: 5,
    backgroundColor: '#1e1e1e',
  },

  pageTitleContainer: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ED9121',
  },

  input: {
    marginVertical: 4,
    marginHorizontal: 10,
    height: 50,
    borderWidth: 1,
    borderRadius: 50,
    padding: 5,
    paddingHorizontal: 15,
    marginBottom: 3,
    fontWeight: 'bold',
    color: '#1e1e1e',
    backgroundColor: '#ED9121',
  },

  button: {
    paddingVertical: 3,
    borderRadius: 2,
    marginTop: 7,
    marginBottom: 0,
    alignItems: 'center',
  },

  signUpButton: {
    backgroundColor: '#1e1e1e',
  },

  signInButton: {
    backgroundColor: '#1e1e1e',
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});