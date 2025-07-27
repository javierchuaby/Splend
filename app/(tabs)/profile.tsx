import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert, // Import Alert for confirmation dialogs
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import styles from '../../styles/ProfileScreenStyles';

export default function ProfileScreen() {
  const [currentUser, setCurrentUser] = useState<{
    displayName: string;
    username: string;
  } | null>(null);
  const [greeting, setGreeting] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'displayName' | 'username' | 'password' | null>(null);
  const [newValue, setNewValue] = useState('');

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            displayName: userData?.displayName,
            username: userData?.username,
          });
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Determine greeting based on time of day (very cool!!!)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  // Update user data in Firestore
  const updateUserData = async () => {
    if (!newValue.trim()) {
      Alert.alert('Error', 'Please enter a valid value.');
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      const userRef = firestore().collection('users').doc(user.uid);

      if (modalType === 'displayName') {
        await userRef.update({ displayName: newValue.trim() });
        // Also update display name in Firebase Auth
        await user.updateProfile({ displayName: newValue.trim() });
        setCurrentUser(prev => prev && { ...prev, displayName: newValue.trim() });
      } else if (modalType === 'username') {
        // Check for unique username
        const usernameSnapshot = await firestore()
          .collection('users')
          .where('username', '==', newValue.trim().toLowerCase()) // Store username as lowercase
          .get();

        if (!usernameSnapshot.empty) {
          Alert.alert('Error', 'Username is already taken.'); // Use Alert for consistent feedback
          return;
        }

        await userRef.update({ username: newValue.trim().toLowerCase() }); // Store username as lowercase
        setCurrentUser(prev => prev && { ...prev, username: newValue.trim().toLowerCase() });
      } else if (modalType === 'password') {
        await user.updatePassword(newValue.trim());
        Alert.alert('Success', 'Password updated successfully.');
      }

      setIsModalVisible(false);
      setNewValue('');
      Alert.alert('Success', 'Profile updated successfully.'); // General success for display name/username
    } catch (error: any) {
      console.error('Error updating user data:', error);
      // Specific error handling for password update
      if (modalType === 'password' && error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security reasons, please sign out and sign in again to change your password.'
        );
      } else {
        Alert.alert('Error', 'Failed to update user data. ' + error.message);
      }
    }
  };

  // --- DELETE ACCOUNT FUNCTION ---
  const handleDeleteAccount = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible and will permanently delete all your data. You will be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Delete user document from Firestore
              await firestore().collection('users').doc(user.uid).delete();
              console.log('Firestore user document deleted.');

              // 2. Delete the account from Firebase Auth
              // This will also automatically sign out the user
              await user.delete();
              console.log('Firebase Auth user deleted.');

              // Success message is generally not needed here as the app will redirect
              // upon sign-out. If you need specific navigation logic, it would go here.
            } catch (error: any) {
              console.error('Error deleting account:', error);
              if (error.code === 'auth/requires-recent-login') {
                // This is a common security measure for sensitive operations
                Alert.alert(
                  'Re-authentication Required',
                  'For security reasons, please sign out and sign in again to delete your account.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete account: ' + error.message);
              }
            }
          },
        },
      ]
    );
  };

  // Sign-out Button
  const SignOutButton = () => {
    return (
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => auth().signOut()}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>
          {greeting},{' '}
        </Text>
        <Text style={styles.displayNameText}>
          {currentUser?.displayName || 'User'}
        </Text>
        <Text style={styles.greetingText}>
          @{currentUser?.username || 'username'}
        </Text>
      </View>

      {/* Settings Buttons */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setModalType('displayName');
            setNewValue(currentUser?.displayName || ''); // Pre-fill with current value
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.settingsButtonText}>Change Display Name</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setModalType('username');
            setNewValue(currentUser?.username || ''); // Pre-fill with current value
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.settingsButtonText}>Change Username</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setModalType('password');
            setNewValue(''); // Password field should always be empty
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.settingsButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Big Red Buttons */}
      <View style={styles.signOutContainer}>
        <SignOutButton />
        {/* Delete Account Button */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)} 
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalType === 'displayName'
                ? 'Change Display Name'
                : modalType === 'username'
                ? 'Change Username'
                : 'Change Password'}
            </Text>
            <TouchableOpacity onPress={updateUserData}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              value={newValue}
              onChangeText={setNewValue}
              placeholder={
                modalType === 'displayName'
                  ? 'Enter new display name'
                  : modalType === 'username'
                  ? 'Enter new username'
                  : 'Enter new password'
              }
              placeholderTextColor="#777"
              secureTextEntry={modalType === 'password'}
              keyboardAppearance="dark"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}