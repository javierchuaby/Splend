import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignUpForm } from '../components/sign-in-screen/SignUpForm';
import { SignUpPageTitle } from '../components/sign-in-screen/SignUpPageTitle';
import { useSignUp } from '../hooks/useSignUp';
import { styles } from '../styles/SignUpStyles';

export default function SignUp() {
  const {
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
  } = useSignUp();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f0f23" barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <SignUpPageTitle />
      <SignUpForm
        displayName={displayName}
        setDisplayName={setDisplayName}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        onSignUp={handleSignUp}
        onGoBack={() => router.back()}
      />
    </SafeAreaView>
  );
}