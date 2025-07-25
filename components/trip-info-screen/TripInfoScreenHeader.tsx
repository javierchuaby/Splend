import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

interface TripInfoScreenHeaderProps {
  onManagePress: () => void;
}

export const TripInfoScreenHeader: React.FC<TripInfoScreenHeaderProps> = ({
  onManagePress,
}) => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Trip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Info</Text>
        <TouchableOpacity onPress={onManagePress}>
          <Text style={styles.manageTripButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};