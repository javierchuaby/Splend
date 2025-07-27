import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { listenToAuthChanges } from './services/authService';

export default function RootLayout() {
  const [initialising, setInitialising] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();
  const router = useRouter();
  const segments = useSegments();

  const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    console.log('onAuthStateChanged', user);
    setUser(user);
    if (initialising) setInitialising(false);
  }

  useEffect(() => {
    const subscriber = listenToAuthChanges(onAuthStateChanged);
    return subscriber;
  }, []);

  useEffect(() => {
    if (initialising) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (user && !inAuthGroup) {
      router.replace('/(tabs)/Home');
    } else if (!user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, initialising]);

  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
