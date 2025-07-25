import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TripDescriptionScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch trip description
  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    const docRef = firestore().collection('trips').doc(tripId as string);

    const unsubscribe = docRef.onSnapshot(
      doc => {
        if (doc.exists()) {
          const data = doc.data();
          const currentDescription = data?.tripDescription || '';
          setDescription(currentDescription);
          setOriginalDescription(currentDescription);
        } else {
          setDescription('');
          setOriginalDescription('');
          Alert.alert('Error', 'Trip not found.');
          router.back();
        }
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching trip description:', error);
        Alert.alert('Error', 'Failed to load trip description.');
        setIsLoading(false);
        router.back();
      }
    );

    return unsubscribe;
  }, [tripId]);

  const handleSave = async () => {
    if (!tripId) return;

    // Only save if the description has changed (I hope this reduces writes!)
    if (description.trim() === originalDescription.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      await firestore().collection('trips').doc(tripId as string).update({
        tripDescription: description.trim(),
      });
      setOriginalDescription(description.trim());
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save description');
      console.error('Error saving trip description:', error);
    }
  };

  const handleCancel = () => {
    setDescription(originalDescription);
    setIsEditing(false);
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Description</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading description...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {isEditing ? (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleBackPress}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Description</Text>
          {isEditing ? (
            <TouchableOpacity
              onPress={handleSave}
              disabled={description.trim() === originalDescription.trim()}
            >
              <Text
                style={[
                  styles.saveButton,
                  description.trim() === originalDescription.trim() &&
                    styles.saveButtonDisabled,
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleEditPress}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {isEditing ? (
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="No description provided."
              placeholderTextColor="#777"
              keyboardAppearance="dark"
              multiline={true}
              autoFocus={true}
            />
          ) : (
            <ScrollView style={styles.textBoxScrollView}>
              <Text style={styles.descriptionDisplay}>
                {description || 'No description provided.'}
              </Text>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#ff453a',
  },
  editButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#555',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  textArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    textAlignVertical: 'top',
  },
  textBoxScrollView: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  descriptionDisplay: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
  },
});