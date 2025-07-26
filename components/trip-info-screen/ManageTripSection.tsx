import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles'; // Adjust path if necessary

interface ManageTripSectionProps {
  onSplitBills: () => void;
  onConcludeTrip: () => void;
  onDeleteTrip: () => void;
  isTripConcluded: boolean;
}

export const ManageTripSection: React.FC<ManageTripSectionProps> = ({
  onSplitBills,
  onConcludeTrip,
  onDeleteTrip,
  isTripConcluded,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Manage Trip</Text>
      <View style={styles.manageTripButtons}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={onSplitBills}
        >
          <Text style={styles.primaryActionButtonText}>Split Bills</Text>
        </TouchableOpacity>

        {!isTripConcluded && (
          <TouchableOpacity
            style={styles.successActionButton}
            onPress={onConcludeTrip}
          >
            <Text style={styles.successActionButtonText}>Conclude Trip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.destructiveActionButton}
          onPress={onDeleteTrip}
        >
          <Text style={styles.destructiveActionButtonText}>Delete Trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};