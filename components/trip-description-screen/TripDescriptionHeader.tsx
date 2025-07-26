import { Stack } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripDescriptionScreenStyles as styles } from '../../styles/TripDescriptionScreenStyles';

interface TripDescriptionHeaderProps {
  isEditing: boolean;
  onBackPress: () => void;
  onCancel: () => void;
  onSave: () => void;
  onEditPress: () => void;
  isSaveDisabled: boolean;
}

export const TripDescriptionHeader: React.FC<TripDescriptionHeaderProps> = ({
  isEditing,
  onBackPress,
  onCancel,
  onSave,
  onEditPress,
  isSaveDisabled,
}) => {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        {isEditing ? (
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onBackPress}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Description</Text>
        {isEditing ? (
          <TouchableOpacity onPress={onSave} disabled={isSaveDisabled}>
            <Text
              style={[
                styles.saveButton,
                isSaveDisabled && styles.saveButtonDisabled,
              ]}
            >
              Done
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onEditPress}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};