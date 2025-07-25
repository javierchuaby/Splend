import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';
import { TripInfoScreenHeader } from './TripInfoScreenHeader';

export const TripInfoLoadingState: React.FC = () => {
  const handleManagePress = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <TripInfoScreenHeader onManagePress={handleManagePress} />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading trip info...</Text>
      </View>
    </SafeAreaView>
  );
};