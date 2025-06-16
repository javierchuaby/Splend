import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
        setCurrentUser(prev => prev && { ...prev, displayName: newValue.trim() });
      } else if (modalType === 'username') {
        // Check for unique username
        const usernameSnapshot = await firestore()
          .collection('users')
          .where('username', '==', newValue.trim())
          .get();

        if (!usernameSnapshot.empty) {
          alert('Username is already taken.');
          return;
        }

        await userRef.update({ username: newValue.trim() });
        setCurrentUser(prev => prev && { ...prev, username: newValue.trim() });
      } else if (modalType === 'password') {
        await user.updatePassword(newValue.trim());
        Alert.alert('Success', 'Password updated successfully.');
      }

      setIsModalVisible(false);
      setNewValue('');
    } catch (error) {
      console.error('Error updating user data:', error);
      Alert.alert('Error', 'Failed to update user data.');
    }
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
      </View>

      {/* Settings Buttons */}
      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setModalType('displayName');
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.settingsButtonText}>Change Display Name</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setModalType('username');
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.settingsButtonText}>Change Username</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            setModalType('password');
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.settingsButtonText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => useRouter().push('/concluded-trips')}
            >
            <Text style={styles.settingsButtonText}>Concluded Trips</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <SignOutButton />
      </View>

      {/* Modal for Editing Because I'm Too Lazy To Code New Screens FOR NOW */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#aaa',
  },
  displayNameText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  settingsContainer: {
    flex: 2,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  settingsButton: {
    backgroundColor: '#2c2c2c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  signOutButton: {
    backgroundColor: '#ff453a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
});