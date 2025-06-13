import { getApp } from '@react-native-firebase/app';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // Import Firestore
import { Stack, useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
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
      // 1. Check if username already exists in Firestore
      const usernameQuery = await firestore()
        .collection('users')
        .where('username', '==', username.toLowerCase()) // Store usernames as lowercase for consistency
        .get();

      if (!usernameQuery.empty) {
        alert('Registration failed: This username is already taken. Please choose another.');
        setLoading(false);
        return; // Stop the sign-up process
      }

      // 2. Create Firebase Authentication account
      const app = getApp();
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // 3. Update Firebase Auth profile with display name
        await updateProfile(user, {
          displayName: displayName,
        });

        // 4. Store additional user data (including username) in Firestore
        await firestore().collection('users').doc(user.uid).set({
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          username: username.toLowerCase(), // Store lowercase username
          createdAt: firestore.FieldValue.serverTimestamp(), // Timestamp for creation
          // Add any other user-specific data you need
        });
      }
      
      // router.back();
    } catch (e: any) {
      const err = e as FirebaseError;
      // Firebase auth errors have a 'code' field for specific error types
      if (err.code === 'auth/email-already-in-use') {
        alert('Registration failed: The email address is already in use by another account.');
      } else if (err.code === 'auth/invalid-email') {
        alert('Registration failed: The email address is invalid.');
      } else if (err.code === 'auth/weak-password') {
        alert('Registration failed: The password is too weak. Please choose a stronger one.');
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
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))} // Ensure username is lowercase and no spaces
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
    fontSize: 38,
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

  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    marginBottom: 16,
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
  atSymbol: {
    fontSize: 16,
    color: '#8e8e93',
    paddingLeft: 20,
  },
  usernameInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    paddingLeft: 5,
    marginBottom: 0,
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

  createAccountButton: {
    backgroundColor: '#4c6ef5',
  },

  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },

  loader: {
    marginVertical: 32,
  },
  goBackButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  goBackText: {
    fontSize: 16,
    color: '#a0a0ab',
    fontWeight: '500',
  },
});