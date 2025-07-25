import auth from '@react-native-firebase/auth';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/ProfileScreenStyles';

export function ProfileSignOutButton() {
  return (
    <View style={styles.signOutContainer}>
      <TouchableOpacity style={styles.signOutButton} onPress={() => auth().signOut()}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}