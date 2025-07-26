import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/TripViewScreenStyles';

interface CreateEventSectionProps {
  onCreateEventPress: () => void;
}

export function CreateEventSection({ onCreateEventPress }: CreateEventSectionProps) {
  return (
    <View style={styles.createEventSection}>
      <TouchableOpacity style={styles.createEventButton} onPress={onCreateEventPress}>
        <Text style={styles.createEventButtonText}>+ Create New Event</Text>
      </TouchableOpacity>
    </View>
  );
}