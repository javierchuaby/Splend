import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface CurrentUser {
  displayName: string;
  username: string;
}

export function useProfileScreenLogic() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [greeting, setGreeting] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    'displayName' | 'username' | 'password' | null
  >(null);
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

    // Listener for real-time updates if needed (optional)
    const unsubscribe = firestore().collection('users').doc(auth().currentUser?.uid)
      .onSnapshot(docSnapshot => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setCurrentUser({
            displayName: userData?.displayName,
            username: userData?.username,
          });
        }
      });
    return () => unsubscribe(); // Cleanup the listener
  }, []);

  // Determine greeting based on time of day
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

  // Update user data in Firestore and Firebase Auth
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
        await user.updateProfile({ displayName: newValue.trim() }); // Also update Firebase Auth display name
        // State update handled by Firestore snapshot listener now
      } else if (modalType === 'username') {
        const usernameSnapshot = await firestore()
          .collection('users')
          .where('username', '==', newValue.trim().toLowerCase())
          .get();

        if (!usernameSnapshot.empty) {
          Alert.alert('Error', 'Username is already taken.');
          return;
        }

        await userRef.update({ username: newValue.trim().toLowerCase() });
        // State update handled by Firestore snapshot listener now
      } else if (modalType === 'password') {
        await user.updatePassword(newValue.trim());
        Alert.alert('Success', 'Password updated successfully.');
      }

      setIsModalVisible(false);
      setNewValue('');
    } catch (error: any) {
      console.error('Error updating user data:', error);
      let errorMessage = 'Failed to update user data.';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign in again to update your password.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The new password is too weak.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return {
    currentUser,
    greeting,
    isModalVisible,
    modalType,
    newValue,
    setNewValue,
    setModalType,
    setIsModalVisible,
    updateUserData,
  };
}