import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, // Keep Modal for types, but won't be used
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Types (Keep these consistent with trip-view.tsx)
interface TripMember {
  id: string; // User's UID
  username: string;
  displayName: string;
}

interface Trip {
  id: string;
  name: string; // This will now refer to 'tripName' from Firestore
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  tripDescription: string;
  isConcluded: boolean;
  eventIds: string[];
}

interface MonthOption {
  label: string;
  value: number;
}

export default function ConcludedTripViewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);

  // Removed date picker states as they are not needed here
  // const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  // const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // const [tempStartDate, setTempStartDate] = useState(new Date());
  // const [tempEndDate, setTempEndDate] = useState(new Date());

  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user's details
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            username: userData?.username,
            displayName: userData?.displayName,
          });
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Real-time listener for this trip and access control
  useEffect(() => {
    if (!tripId || !currentUser) {
      setIsLoading(true);
      return;
    }

    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(
        doc => {
          if (doc.exists()) {
            const data = doc.data();
            const currentTrip: Trip = {
              id: doc.id,
              name: data!.tripName,
              members: data!.members.map((member: any) => ({
                id: member.uid,
                username: member.username,
                displayName: member.displayName,
                billIds: member.billIds || [],
                totalSpent: member.totalSpent || 0,
                totalPaid: member.totalPaid || 0,
              })),
              startDate: data!.startDate.toDate(),
              endDate: data!.endDate.toDate(),
              createdAt: data!.createdAt?.toDate() ?? new Date(),
              tripDescription: data!.tripDescription || '',
              isConcluded: data!.isConcluded || false,
              eventIds: data!.eventIds || [],
            };

            // Crucially, check if the trip is actually concluded
            if (!currentTrip.isConcluded) {
                // If it's not concluded, redirect to the active trip view
                router.replace({
                    pathname: '/trip-view',
                    params: { tripId: currentTrip.id },
                });
                return; // Stop further processing in this component
            }

            setTrip(currentTrip);

            const isMember = currentTrip.members.some(
              member => member.id === currentUser.id
            );
            setHasAccess(isMember);
            setIsLoading(false);
          } else {
            setTrip(null);
            setHasAccess(false);
            setIsLoading(false);
          }
        },
        error => {
          console.error('Error fetching trip:', error);
          setTrip(null);
          setHasAccess(false);
          setIsLoading(false);
        }
      );
    return unsubscribe;
  }, [tripId, currentUser, router]); // Added router to dependency array for replace

  // `saveTrip` is no longer needed as fields are not editable
  // const saveTrip = async (updatedFields: Partial<Trip>) => {
  //   if (!trip) return;
  //   // ... (logic from original saveTrip if you decide to allow some read-only updates)
  // };

  const deleteTrip = async () => {
    if (!trip) return;
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('trips').doc(trip.id).delete();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trip');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // `concludeTrip` is not needed as the trip is already concluded
  // const concludeTrip = async () => { /* ... */ };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return '1 day';
    } else {
      return `${diffDays + 1} days`;
    }
  };

  const navigateToMembers = () => {
    router.push({
      pathname: '/concluded-trip-members', // Changed path for concluded members view
      params: { tripId: trip?.id },
    });
  };

  const navigateToDescription = () => {
    router.push({
      pathname: '/concluded-trip-description', // Changed path for concluded description view
      params: { tripId: trip?.id },
    });
  };

  // Date picker related functions are removed as per requirements
  // const generateDateOptions = (): { /* ... */ } => { /* ... */ };
  // const { years, months, days } = generateDateOptions();
  // const handleStartDateDone = async () => { /* ... */ };
  // const handleEndDateDone = async () => { /* ... */ };

  // Display loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← All Trips</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading trip...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Display access denied or trip not found
  if (!trip || !hasAccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← All Trips</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Trip not found or you don't have access.
            </Text>
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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← All Trips</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <Text style={styles.tripTitle}>{trip.name}</Text>

            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TouchableOpacity
                style={styles.descriptionCard}
                onPress={navigateToDescription} // Navigates to concluded description screen
              >
                <Text
                  style={styles.descriptionText}
                  numberOfLines={4}
                  ellipsizeMode="tail"
                >
                  {trip.tripDescription ||
                    'No description provided for this concluded trip.'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Duration Section - Not editable */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.dateRow}>
                {/* Removed TouchableOpacity to make dates non-interactive */}
                <View style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>
                    Start: {formatDate(trip.startDate)}
                  </Text>
                </View>
                <View style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>
                    End: {formatDate(trip.endDate)}
                  </Text>
                </View>
              </View>
              <View style={styles.durationSubtextContainer}>
                <Text style={styles.durationSubtext}>
                  {calculateDuration(trip.startDate, trip.endDate)}
                </Text>
              </View>
            </View>

            {/* Members Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              <TouchableOpacity
                style={styles.membersCard}
                onPress={navigateToMembers} // Navigates to concluded members screen
              >
                <Text style={styles.membersCount}>
                  {trip.members.length} member
                  {trip.members.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.membersList}>
                  {trip.members.slice(0, 2).map((member, index) => (
                    <Text key={member.id} style={styles.memberName}>
                      {member.displayName}
                      {index < Math.min(trip.members.length - 1, 2) ? ', ' : ''}
                    </Text>
                  ))}
                  {trip.members.length > 2 && (
                    <Text style={styles.memberName}>
                      +{trip.members.length - 2} more
                    </Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* Conclude Trip button is removed */}

        {/* Delete Trip button remains */}
        <View style={styles.deleteSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteTrip}>
            <Text style={styles.deleteButtonText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modals are entirely removed */}
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
    paddingHorizontal: 20,
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
  // Styles for the new description card
  descriptionCard: {
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
    justifyContent: 'space-between',
    minHeight: 80, // Minimum height for the box
  },
  descriptionText: {
    flex: 1, // Allow text to take up available space
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20, // Adjust line height for readability
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Modified dateButton to be a plain View, not TouchableOpacity
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1e1e1e',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  durationSubtextContainer: {
    marginTop: 8,
    alignItems: 'center',
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
  // Conclude section is removed entirely from this view
  // concludeSection: { /* ... */ },
  // concludeButton: { /* ... */ },
  // concludeButtonText: { /* ... */ },
  deleteSection: {
    paddingHorizontal: 20,
    paddingTop: 0,
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
  // Date picker modals styles are no longer needed
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
    backgroundColor: '#1e1e1e',
  },
  picker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
});