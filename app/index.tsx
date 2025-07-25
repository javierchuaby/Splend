import { Link } from 'expo-router';
import { StatusBar, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInForm } from '../components/sign-in-screen/SignInForm';
import { PageTitle } from '../components/sign-in-screen/SignInPageTitle';
import { useSignIn } from '../hooks/useSignIn';
import { styles } from '../styles/SignInStyles';

export default function Index() {
  const { email, setEmail, password, setPassword, loading, signIn } =
    useSignIn();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f0f23" barStyle="light-content" />

      <PageTitle />

      <SignInForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        onSignIn={signIn}
      >
        <Link href="/sign-up" asChild>
          <TouchableOpacity style={styles.signUpTextButton}>
            <Text style={styles.signUpText}>Create New Account</Text>
          </TouchableOpacity>
        </Link>
      </SignInForm>
    </SafeAreaView>
  );
}