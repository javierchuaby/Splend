import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

interface TripInfoDescriptionCardProps {
  description: string;
  onPress: () => void;
}

export const TripInfoDescriptionCard: React.FC<TripInfoDescriptionCardProps> = ({
  description,
  onPress,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Description</Text>
      <TouchableOpacity style={styles.descriptionCard} onPress={onPress}>
        <Text style={styles.descriptionText}>
          {description || 'No description provided. Tap to add one.'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
};