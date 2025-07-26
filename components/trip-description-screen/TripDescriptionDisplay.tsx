import React from 'react';
import { ScrollView, Text } from 'react-native';
import { TripDescriptionScreenStyles as styles } from '../../styles/TripDescriptionScreenStyles';

interface TripDescriptionDisplayProps {
  description: string;
}

export const TripDescriptionDisplay: React.FC<TripDescriptionDisplayProps> = ({
  description,
}) => {
  return (
    <ScrollView style={styles.textBoxScrollView}>
      <Text style={styles.descriptionDisplay}>
        {description || 'No description provided.'}
      </Text>
    </ScrollView>
  );
};