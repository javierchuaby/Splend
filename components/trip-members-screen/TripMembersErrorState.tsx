import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMembersScreenHeader } from './TripMembersScreenHeader';

export const TripMembersErrorState: React.FC = () => {
  const router = useRouter();

  // Redirect to home if there's an error
  const handleBackPress = () => {
    router.replace('/Home'); // Assuming '/Home' is a safe fallback route
  };

  return (
    <SafeAreaView style={styles.container}>
      <TripMembersScreenHeader onBackPress={handleBackPress} />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Trip not found or you don't have access.
        </Text>
      </View>
    </SafeAreaView>
  );
};