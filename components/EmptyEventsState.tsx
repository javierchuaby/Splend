import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/TripViewScreenStyles';

export function EmptyEventsState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No events yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Create your first event for this trip!
      </Text>
    </View>
  );
}