// app/trip-view.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

// Define types for Trip and TripMember data structure
interface TripMember {
  id: string;
  username: string;
}

interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// Key for storing trip data in AsyncStorage
const STORAGE_KEY = 'splend_trips';

// Component for displaying details of a single trip
export default function TripViewScreen() {
  // Hooks for navigation and accessing route parameters
  const router = useRouter();
  const navigation = useNavigation();
  const { tripId } = useLocalSearchParams();

  // State to hold the loaded trip data
  const [trip, setTrip] = useState<Trip | null>(null);

  // Use layout effect to configure screen options (like hiding header)
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Load trip data when the component mounts or tripId changes
  useEffect(() => {
    loadTrip();
  }, [tripId]);

  // Function to load trip data from AsyncStorage
  const loadTrip = async () => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
        }));
        // Find the specific trip by ID
        const foundTrip = parsedTrips.find((t: Trip) => t.id === tripId);
        setTrip(foundTrip || null);
      }
    } catch (error) {
      console.error('Error loading trip:', error);
    }
  };

  // Function to handle trip deletion
  const deleteTrip = async () => {
    if (!trip) return;

    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
              if (storedTrips) {
                const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
                  ...trip,
                  startDate: new Date(trip.startDate),
                  endDate: new Date(trip.endDate),
                  createdAt: new Date(trip.createdAt),
                }));

                // Filter out the trip to be deleted
                const updatedTrips = parsedTrips.filter((t: Trip) => t.id !== trip.id);
                // Save the updated list back to AsyncStorage
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));

                // Show success message and navigate back
                Alert.alert('Success', 'Trip deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Error deleting trip:', error);
              Alert.alert('Error', 'Failed to delete trip');
            }
          },
        },
      ]
    );
  };

  // Helper function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to calculate trip duration in days
  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Add 1 to include both start and end days in the duration
    if (diffDays === 0) {
        return '1 day';
    } else {
        return `${diffDays + 1} days`;
    }
  };


  // Function to navigate to the members management screen
  const navigateToMembers = () => {
    router.push({
      pathname: '/(auth)/trip-members',
      params: { tripId: trip?.id }
    });
  };

  // Render a loading or error state if the trip is not found
  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Custom header for the 'Trip not found' state */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => auth().signOut()}>
            <Text style={styles.backButton}>← All Trips</Text>
          </TouchableOpacity>
          {/* Placeholder for alignment when there's no title/button on the right */}
          <View style={styles.placeholder} />
        </View>
        {/* Message displayed when the trip data couldn't be loaded */}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render for the trip details screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header for the Trip Details view */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          {/* Button to navigate back to the previous screen (All Trips) */}
          <Text style={styles.backButton}>← All Trips</Text>
        </TouchableOpacity>
        {/* Title for the header */}
        <Text style={styles.headerTitle}></Text>
        {/* Placeholder for alignment when there's no button on the right */}
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable container for the main content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Section displaying the trip's main title */}
          <View style={styles.section}>
            <Text style={styles.tripTitle}>{trip.name}</Text>
          </View>

          {/* Section displaying the trip's duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.durationCard}>
              <Text style={styles.durationText}>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </Text>
              <Text style={styles.durationSubtext}>
                {calculateDuration(trip.startDate, trip.endDate)}
              </Text>
            </View>
          </View>

          {/* Section displaying trip members */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              {/* Button to navigate to the members management screen */}
              <TouchableOpacity onPress={navigateToMembers}>
                <Text style={styles.manageButton}>Manage</Text>
              </TouchableOpacity>
            </View>
            {/* Touchable card displaying a summary of members */}
            <TouchableOpacity style={styles.membersCard} onPress={navigateToMembers}>
              <Text style={styles.membersCount}>
                {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
              </Text>
              {/* Display a limited list of member usernames */}
              <View style={styles.membersList}>
                {trip.members.slice(0, 3).map((member, index) => (
                  <Text key={member.id} style={styles.memberName}>
                    {member.username}
                    {index < Math.min(trip.members.length - 1, 2) ? ', ' : ''}
                  </Text>
                ))}
                {/* Indicate if there are more members not shown */}
                {trip.members.length > 3 && (
                  <Text style={styles.memberName}>
                    +{trip.members.length - 3} more
                  </Text>
                )}
              </View>
              {/* Chevron icon to indicate tappable area */}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section containing the delete trip button */}
        <View style={styles.deleteSection}>
          {/* Button to trigger the delete trip confirmation */}
          <TouchableOpacity style={styles.deleteButton} onPress={deleteTrip}>
            <Text style={styles.deleteButtonText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Stylesheet for the component
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
    backgroundColor: '#121212',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '500',
  },
  durationCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  durationText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  durationSubtext: {
    fontSize: 14,
    color: '#aaa',
  },
  membersCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginRight: 12,
  },
  membersList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 14,
    color: '#aaa',
  },
  chevron: {
    fontSize: 20,
    color: '#777',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#aaa',
  },
  deleteSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  deleteButton: {
    backgroundColor: '#2c1a1a',
    borderWidth: 1,
    borderColor: '#4d2c2c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff453a',
  },
});