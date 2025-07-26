import { Stack } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';

interface TripMembersScreenHeaderProps {
  onBackPress: () => void;
}

export const TripMembersScreenHeader: React.FC<
  TripMembersScreenHeaderProps
> = ({ onBackPress }) => {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress}>
          <Text style={styles.backButton}>← Trip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.placeholder} />
      </View>
    </>
  );
};