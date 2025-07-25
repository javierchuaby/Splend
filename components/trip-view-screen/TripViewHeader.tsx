import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/TripViewScreenStyles';

interface TripViewHeaderProps {
  tripName: string;
  onBackPress: () => void;
  onInfoPress: () => void;
}

export function TripViewHeader({
  tripName,
  onBackPress,
  onInfoPress,
}: TripViewHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBackPress}>
        <Text style={styles.backButton}>←</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onInfoPress} style={styles.headerTitleContainer}>
        <Text style={styles.tripTitle}>{tripName}</Text>
        <Text style={styles.tripSubtitle}>Tap to view details</Text>
      </TouchableOpacity>
      <View style={styles.placeholder} />
    </View>
  );
}