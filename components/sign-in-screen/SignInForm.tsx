import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../../styles/SignInStyles';

interface SignInFormProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  loading: boolean;
  onSignIn: () => void;
  children: React.ReactNode;
}

export function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSignIn,
  children,
}: SignInFormProps) {
  return (
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
        <ActivityIndicator
          size="large"
          color="#4c6ef5"
          style={styles.loader}
        />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.signInButton]}
            onPress={onSignIn}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          {children}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}