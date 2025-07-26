import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMembersScreenHeader } from './TripMembersScreenHeader';

export const TripMembersLoadingState: React.FC = () => {
  // Dummy function for header back button
  const dummyBackPress = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <TripMembersScreenHeader onBackPress={dummyBackPress} />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading trip data...</Text>
      </View>
    </SafeAreaView>
  );
};