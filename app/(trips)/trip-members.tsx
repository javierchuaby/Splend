import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../styles/trip-members.styles';

interface FirestoreTripMemberRef {
  uid: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  tripDescription?: string;
  isConcluded?: boolean;
  eventIds?: string[];
}

export default function TripMembersScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TripMember[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

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
            billIds: userData?.billIds,
            totalSpent: userData?.totalSpent,
            totalPaid: userData?.totalPaid,
          });
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch trip data and resolve members from `users` collection
  useEffect(() => {
    if (!tripId || !currentUser) {
      setIsLoadingTrip(true);
      return;
    }

    setIsLoadingTrip(true);
    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(async doc => {
        if (doc.exists()) {
          const data = doc.data();
          const firestoreMembers: FirestoreTripMemberRef[] = data?.members || [];

          // Fetch user data for each member from the `users` collection
          const resolvedMembers: TripMember[] = [];
          for (const memberRef of firestoreMembers) {
            const userDoc = await firestore().collection('users').doc(memberRef.uid).get();
            if (userDoc.exists()) {
              const userData = userDoc.data();
              resolvedMembers.push({
                id: memberRef.uid,
                username: userData?.username,
                displayName: userData?.displayName,
                billIds: userData?.billIds,
                totalSpent: userData?.totalSpent,
                totalPaid: userData?.totalPaid,
              });
            } else {
              // Check for deleted account
              resolvedMembers.push({
                id: memberRef.uid,
                username: 'deleted',
                displayName: 'Deleted User',
                billIds: [],
                totalSpent: 0,
                totalPaid:0,
              });
            }
          }

          const currentTrip: Trip = {
            id: doc.id,
            name: data!.tripName, 
            members: resolvedMembers, 
            startDate: data!.startDate.toDate(),
            endDate: data!.endDate.toDate(),
            createdAt: data!.createdAt?.toDate() ?? new Date(),
            tripDescription: data?.tripDescription || '',
            isConcluded: data?.isConcluded || false,
            eventIds: data?.eventIds || [],
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
          Alert.alert('Error', 'Trip not found.');
          router.replace('/Home');
        }
        setIsLoadingTrip(false); // Done loading
      },
      error => {
        console.error('Error fetching trip:', error);
        setTrip(null);
        setHasAccess(false);
        setIsLoadingTrip(false);
        Alert.alert('Error', 'Failed to load trip data.');
        router.replace('/Home');
      }
      );
    return unsubscribe;
  }, [tripId, currentUser, router]);

  // Search users based on query
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoadingUsers(true);
      const query = searchQuery.toLowerCase();
      const usersRef = firestore().collection('users');
      let foundUsers: TripMember[] = [];

      try {
        // Search by exact username first
        const usernameSnapshot = await usersRef
          .where('username', '==', query)
          .limit(1)
          .get();
        usernameSnapshot.forEach(doc => {
          const userData = doc.data();
          foundUsers.push({
            id: doc.id,
            username: userData?.username,
            displayName: userData?.displayName,
            billIds: userData?.billIds,
            totalSpent: userData?.totalSpent,
            totalPaid: userData?.totalPaid,
          });
        });

        // If username not found, search by displayName (case-insensitive start/end at for range queries)
        if (foundUsers.length === 0) {
          const displayNameSnapshot = await usersRef
            .orderBy('displayName')
            .startAt(query.charAt(0).toUpperCase() + query.slice(1))
            .endAt(query.charAt(0).toUpperCase() + query.slice(1) + '\uf8ff')
            .get();

          displayNameSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.displayName.toLowerCase().includes(query)) {
              foundUsers.push({
                id: doc.id,
                username: userData.username,
                displayName: userData.displayName,
                billIds: userData?.billIds,
                totalSpent: userData?.totalSpent,
                totalPaid: userData?.totalPaid,
              });
            }
          });
        }

        const currentTripMemberUids = trip?.members.map(m => m.id) || [];
        const uniqueFoundUsers = foundUsers.filter(
          user => !currentTripMemberUids.includes(user.id)
        );

        setSearchResults(uniqueFoundUsers);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const handler = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, trip?.members]);

  const addMember = async (userToAdd: TripMember) => {
    if (!trip) return;

    try {
      await firestore()
        .collection('trips')
        .doc(trip.id)
        .update({
          members: firestore.FieldValue.arrayUnion({ 
            uid: userToAdd.id,
            username: userToAdd.username,
            displayName: userToAdd.displayName,
            billIds: [],
            totalSpent: 0,
            totalPaid: 0, 
          }),
        });
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
      console.error(error);
    }
  };

  const removeMember = async (memberToRemove: TripMember) => {
    if (!trip || !currentUser) return;

    // Prevent removing self
    if (memberToRemove.id === currentUser.id) {
      Alert.alert('Error', 'You cannot remove yourself from the trip here.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberToRemove.displayName} from the trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const memberObjectInFirestore = {
                uid: memberToRemove.id || "",
                username: memberToRemove.username || "",
                displayName: memberToRemove.displayName || "",
                billIds: memberToRemove.billIds || [],
                totalSpent: memberToRemove.totalSpent || 0,
                totalPaid: memberToRemove.totalPaid || 0,
              };

              await firestore()
                .collection('trips')
                .doc(trip.id)
                .update({
                  members: firestore.FieldValue.arrayRemove(memberObjectInFirestore),
                });
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const orderedMembers = useMemo(() => {
    if (!trip || !currentUser) {
      return [];
    }

    const membersWithoutCurrentUser = trip.members.filter(
      member => member.id !== currentUser.id
    );

    membersWithoutCurrentUser.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );

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
      {currentUser?.id !== item.id && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeMember(item)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSearchResultItem = ({ item }: { item: TripMember }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => addMember(item)}
    >
      <Text style={styles.searchResultText}>
        <Text style={{ fontWeight: 'bold' }}>{item.displayName}</Text>{' '}
        <Text style={styles.usernameText}>@{item.username}</Text>
      </Text>
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  );

  // Loading...
  if (isLoadingTrip) {
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

  // Check for access (in case somebody kicked you out of the trip)
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
          <View style={styles.addMemberSection}>
            <Text style={styles.sectionTitle}>Add New Member</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by username or display name"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <View style={styles.searchResults}>
                {isLoadingUsers ? (
                  <Text style={styles.loadingText}>Searching...</Text>
                ) : searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResultItem}
                    keyExtractor={item => item.id}
                    style={styles.searchResultsList}
                    keyboardShouldPersistTaps="handled"
                  />
                ) : (
                  <Text style={styles.noResultsText}>No users found</Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              Current Members ({orderedMembers.length})
            </Text>
            <FlatList
              data={orderedMembers}
              renderItem={renderMemberItem}
              keyExtractor={item => item.id}
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}