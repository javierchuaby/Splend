import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../styles/TripInfoScreenStyles';

interface ManageTripModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSplitBills: () => void;
  onConcludeTrip: () => void;
  onDeleteTrip: () => void;
  isTripConcluded: boolean;
}

export const ManageTripModal: React.FC<ManageTripModalProps> = ({
  isVisible,
  onClose,
  onSplitBills,
  onConcludeTrip,
  onDeleteTrip,
  isTripConcluded,
}) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.manageTripContainer}>
          <View style={styles.manageTripHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.manageTripCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.manageTripTitle}>Manage Trip</Text>
            <View style={styles.placeholder} />
          </View>

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
                <Text style={styles.successActionButtonText}>
                  Conclude Trip
                </Text>
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
      </View>
    </Modal>
  );
};