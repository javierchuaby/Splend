import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

interface TripInfoScreenHeaderProps {}

export const TripInfoScreenHeader: React.FC<TripInfoScreenHeaderProps> = ({}) => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.header}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRightContainer} />
      </View>
    </>
  );
};