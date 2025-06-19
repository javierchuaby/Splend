import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TripMember {
  id: string; // This corresponds to `uid` in the `users` collection
  username: string;
  displayName: string;
}

interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  // Added fields from the new Firestore structure for completeness
  tripDescription: string;
  isConcluded: boolean;
  eventIds: string[];
}

export default function ConcludedTripMembersScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

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

  // Fetch trip data and resolve members from `users` collection
  useEffect(() => {
    if (!tripId || !currentUser) return;

    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(async doc => {
        if (doc.exists()) {
          const data = doc.data();
          // Ensure it's a concluded trip
          if (!data!.isConcluded) {
            Alert.alert('Error', 'This trip is not concluded.');
            router.back();
            return;
          }

          const tripMembers = data!.members;

          // Fetch user data for each member from the `users` collection
          const resolvedMembers: TripMember[] = await Promise.all(
            tripMembers.map(async (member: { uid: string, username: string, displayName: string }) => {
              // Note: Using member.uid here as per the new Firestore structure
              const userDoc = await firestore().collection('users').doc(member.uid).get();
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  id: member.uid, // Use uid as the id for TripMember interface
                  username: userData?.username,
                  displayName: userData?.displayName,
                };
              } else {
                // Fallback to stored data if user document not found (e.g., deleted user)
                return {
                  id: member.uid,
                  username: member.username,
                  displayName: member.displayName,
                };
              }
            })
          );

          const currentTrip: Trip = {
            id: doc.id,
            name: data!.tripName, // Use tripName from the new structure
            members: resolvedMembers,
            startDate: data!.startDate.toDate(),
            endDate: data!.endDate.toDate(),
            createdAt: data!.createdAt?.toDate() ?? new Date(),
            tripDescription: data!.tripDescription || '',
            isConcluded: data!.isConcluded || false,
            eventIds: data!.eventIds || [],
          };

          setTrip(currentTrip);

          // Check if current user is a member to grant access
          const isMember = resolvedMembers.some(
            member => member.id === currentUser.id
          );
          setHasAccess(isMember);
        } else {
          setTrip(null);
          setHasAccess(false);
        }
      });
    return unsubscribe;
  }, [tripId, currentUser]);


  const orderedMembers = useMemo(() => {
    if (!trip || !currentUser) {
      return [];
    }

    const membersWithoutCurrentUser = trip.members.filter(
      member => member.id !== currentUser.id
    );

    // Sort remaining members alphabetically by display name
    membersWithoutCurrentUser.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );

    // Add current user to the beginning of list
    const currentUserAsMember = trip.members.find(
      member => member.id === currentUser.id
    );

    if (currentUserAsMember) {
      return [currentUserAsMember, ...membersWithoutCurrentUser];
    } else {
      return membersWithoutCurrentUser;
    }
  }, [trip, currentUser]);

  const renderMemberItem = ({ item }: { item: TripMember }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberUsername}>
        <Text style={{ fontWeight: 'bold' }}>
          {item.displayName.length > 24
            ? `${item.displayName.substring(0, 16)}...`
            : item.displayName
          }
        </Text>{' '}
        <Text style={styles.usernameText}>@{item.username}</Text>
      </Text>
      {/* No remove button in concluded view */}
    </View>
  );

  if (!tripId || !currentUser) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Trip</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Members</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading trip data...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!trip || !hasAccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Trip</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Members</Text>
            <View style={styles.placeholder} />
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
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          {/* Removed Add New Member section (search input, search results) */}

          <View style={styles.membersSection}>
            <FlatList
              data={orderedMembers}
              renderItem={renderMemberItem}
              keyExtractor={item => item.id}
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <Text style={styles.noMembersText}>No members found for this trip.</Text>
              )}
            />
          </View>
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
    width: 50, // To balance the header title position
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Removed addMemberSection and its related styles
  // addMemberSection: {
  //   marginBottom: 24,
  // },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  // Removed searchInput, searchResults, searchResultsList, searchResultItem, addButtonText, noResultsText, loadingText
  // searchInput: {}, etc.
  membersSection: {
    flex: 1,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  memberUsername: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 14,
    color: '#888',
  },
  // Removed removeButton, removeButtonText
  // removeButton: {}, etc.
  noMembersText: {
    padding: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
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
});