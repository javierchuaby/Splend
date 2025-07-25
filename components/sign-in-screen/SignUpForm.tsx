import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../../styles/SignUpStyles';

interface SignUpFormProps {
  displayName: string;
  setDisplayName: (text: string) => void;
  username: string;
  setUsername: (text: string) => void;
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  loading: boolean;
  onSignUp: () => void;
  onGoBack: () => void;
}

export function SignUpForm({
  displayName,
  setDisplayName,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSignUp,
  onGoBack,
}: SignUpFormProps) {
  return (
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
            onChangeText={(text) =>
              setUsername(text.toLowerCase().replace(/\s/g, ''))
            } // force username lowercase + no spaces
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
            onPress={onSignUp}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.goBackButton} onPress={onGoBack}>
            <Text style={styles.goBackText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}