import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/ProfileScreenStyles';

interface ProfileSettingsButtonsProps {
  onPressChangeDisplayName: () => void;
  onPressChangeUsername: () => void;
  onPressChangePassword: () => void;
}

export function ProfileSettingsButtons({
  onPressChangeDisplayName,
  onPressChangeUsername,
  onPressChangePassword,
}: ProfileSettingsButtonsProps) {
  return (
    <View style={styles.settingsContainer}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onPressChangeDisplayName}
      >
        <Text style={styles.settingsButtonText}>Change Display Name</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onPressChangeUsername}
      >
        <Text style={styles.settingsButtonText}>Change Username</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onPressChangePassword}
      >
        <Text style={styles.settingsButtonText}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
}