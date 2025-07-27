import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../styles/concluded-trip-description-styles';

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
            router.replace({
              pathname: '../(trips)/trip-description',
              params: { tripId: tripId },
            });
            return;
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
  }, [tripId]);

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