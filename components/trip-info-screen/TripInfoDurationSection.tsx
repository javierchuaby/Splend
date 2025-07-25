import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

interface TripInfoDurationSectionProps {
  startDate: Date;
  endDate: Date;
  onStartDatePress: () => void;
  onEndDatePress: () => void;
  formatDate: (date: Date) => string;
  calculateDuration: (startDate: Date, endDate: Date) => string;
}

export const TripInfoDurationSection: React.FC<TripInfoDurationSectionProps> = ({
  startDate,
  endDate,
  onStartDatePress,
  onEndDatePress,
  formatDate,
  calculateDuration,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Duration</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateButton} onPress={onStartDatePress}>
          <Text style={styles.dateButtonText}>Start: {formatDate(startDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={onEndDatePress}>
          <Text style={styles.dateButtonText}>End: {formatDate(endDate)}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.durationSubtextContainer}>
        <Text style={styles.durationSubtext}>
          {calculateDuration(startDate, endDate)}
        </Text>
      </View>
    </View>
  );
};