import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../styles/ProfileScreenStyles';

interface CurrentUserDisplay {
  displayName: string;
  username: string;
}

interface ProfileGreetingProps {
  currentUser: CurrentUserDisplay | null;
  greeting: string;
}

export function ProfileGreeting({
  currentUser,
  greeting,
}: ProfileGreetingProps) {
  return (
    <View style={styles.greetingContainer}>
      <Text style={styles.greetingText}>
        {greeting},{' '}
      </Text>
      <Text style={styles.displayNameText}>
        {currentUser?.displayName || 'User'}
      </Text>
      <Text style={styles.greetingText}>
        @{currentUser?.username || 'username'}
      </Text>
    </View>
  );
}