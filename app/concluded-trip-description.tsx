import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ConcludedTripDescriptionScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
          // Check if the trip is actually concluded
          if (!data?.isConcluded) {
            Alert.alert('Redirect', 'This trip is not concluded. Redirecting.');
            router.replace({
              pathname: '/trip-description', // Redirect to active description view
              params: { tripId: tripId },
            });
            return; // Prevent rendering of this component
          }
          const currentDescription = data?.tripDescription || '';
          setDescription(currentDescription);
        } else {
          setDescription('');
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
  }, [tripId]); // Added router to dependency array for replace

  // Removed handleSave, handleCancel, handleEditPress as editing is disabled

  const handleBackPress = () => {
    router.back(); // Simply go back
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
          <TouchableOpacity onPress={handleBackPress}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Description</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <ScrollView style={styles.textBoxScrollView}>
            <Text style={styles.descriptionDisplay}>
              {description || 'No description provided.'}
            </Text>
          </ScrollView>
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
  // Removed cancel, edit, save button styles
  placeholder: {
    width: 50, // To balance the header title position
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Removed textArea styles as TextInput is not used
  textBoxScrollView: {
    flex: 1, // Allow scroll view to expand
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