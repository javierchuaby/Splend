import auth from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
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
import styles from '../../styles/event-members-styles';

interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

interface Event {
  id: string;
  name: string;
  location: FirebaseFirestoreTypes.GeoPoint;
  startDateTime: Date;
  endDateTime: Date;
  memberIds: string[];
  billIds: string[];
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

export default function EventMembersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { eventId, tripId } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [tripMembers, setTripMembers] = useState<TripMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TripMember[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

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

  useEffect(() => {
    if (!eventId || !tripId || !currentUser) {
      setIsLoadingEvent(true);
      return;
    }

    setIsLoadingEvent(true);
    const unsubscribeEvent = firestore()
      .collection('events')
      .doc(eventId as string)
      .onSnapshot(async doc => {
        if (doc.exists()) {
          const data = doc.data();
          const currentEvent: Event = {
            id: doc.id,
            name: data!.eventName,
            location: data!.eventLocation,
            startDateTime: data!.startDateTime.toDate(),
            endDateTime: data!.endDateTime.toDate(),
            memberIds: data!.memberIds || [],
            billIds: data!.billIds || [],
          };
          setEvent(currentEvent);

          const isMember = currentEvent.memberIds.some(
            memberId => memberId === currentUser.id
          );
          setHasAccess(isMember);

          // Fetch trip members
          const tripDoc = await firestore().collection('trips').doc(tripId as string).get();
          if (tripDoc.exists()) {
            const tripData = tripDoc.data();
            const firestoreTripMembers: { uid: string; username: string; displayName: string }[] =
              tripData?.members || [];
            const hydratedTripMembers: TripMember[] = [];
            for (const memberRef of firestoreTripMembers) {
              const userDoc = await firestore().collection('users').doc(memberRef.uid).get();
              if (userDoc.exists()) {
                const userData = userDoc.data();
                hydratedTripMembers.push({
                  id: memberRef.uid,
                  username: userData?.username,
                  displayName: userData?.displayName,
                  billIds: userData?.billIds || [],
                  totalSpent: userData?.totalSpent || 0,
                  totalPaid: userData?.totalPaid || 0,
                });
              }
            }
            setTripMembers(hydratedTripMembers);
          } else {
            router.replace(`/trip-view?tripId=${tripId}`);
            return;
          }

        } else {
          setEvent(null);
          setHasAccess(false);
          Alert.alert('Error', 'Event not found.');
          router.replace(`/trip-view?tripId=${tripId}`);
          return;
        }
        setIsLoadingEvent(false);
      },
      error => {
        console.error('Error fetching event or trip:', error);
        setEvent(null);
        setHasAccess(false);
        setIsLoadingEvent(false);
        Alert.alert('Error', 'Failed to load event data.');
        router.replace(`/trip-view?tripId=${tripId}`);
      }
      );
    return unsubscribeEvent;
  }, [eventId, tripId, currentUser, router]);

  useEffect(() => {
    const searchAvailableMembers = async () => {
      if (!searchQuery.trim() || !event || !tripMembers.length) {
        setSearchResults([]);
        return;
      }

      setIsLoadingUsers(true);
      const query = searchQuery.toLowerCase();

      const filtered = tripMembers.filter(
        member =>
          !event.memberIds.includes(member.id) &&
          (member.username.toLowerCase().includes(query) ||
            member.displayName.toLowerCase().includes(query))
      );
      setSearchResults(filtered);
      setIsLoadingUsers(false);
    };

    const handler = setTimeout(() => {
      searchAvailableMembers();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, event, tripMembers]);

  const addMember = async (memberToAdd: TripMember) => {
    if (!event) return;

    try {
      await firestore()
        .collection('events')
        .doc(event.id)
        .update({
          memberIds: firestore.FieldValue.arrayUnion(memberToAdd.id),
        });
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add member to event');
      console.error(error);
    }
  };

  const removeMember = async (memberToRemove: TripMember) => {
    if (!event || !currentUser) return;

    if (memberToRemove.id === currentUser.id) {
      Alert.alert('Error', 'You cannot remove yourself from the event here.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberToRemove.displayName} from this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('events')
                .doc(event.id)
                .update({
                  memberIds: firestore.FieldValue.arrayRemove(memberToRemove.id),
                });
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member from event');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const orderedEventMembers = useMemo(() => {
    if (!event || !currentUser || !tripMembers.length) {
      return [];
    }

    const currentEventMembers = tripMembers.filter(member =>
      event.memberIds.includes(member.id)
    );

    const membersWithoutCurrentUser = currentEventMembers.filter(
      member => member.id !== currentUser.id
    );

    membersWithoutCurrentUser.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );

    const currentUserAsMember = currentEventMembers.find(
      member => member.id === currentUser.id
    );

    if (currentUserAsMember) {
      return [currentUserAsMember, ...membersWithoutCurrentUser];
    } else {
      return membersWithoutCurrentUser;
    }
  }, [event, currentUser, tripMembers]);

  const renderMemberItem = ({ item }: { item: TripMember }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberUsername}>
        <Text style={{ fontWeight: 'bold' }}>
          {item.displayName.length > 24
            ? `${item.displayName.substring(0, 16)}...`
            : item.displayName}
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

  if (isLoadingEvent) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Event</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Members</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading event data...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!event || !hasAccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Event</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Members</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Event not found or you don't have access.
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
            <Text style={styles.backButton}>← Event</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={styles.addMemberSection}>
            <Text style={styles.sectionTitle}>Add New Member</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search trip members to add"
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
                  <Text style={styles.noResultsText}>No members found in trip to add</Text>
                )}
              </View>
            )}
          </View>
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              Current Event Members ({orderedEventMembers.length})
            </Text>
            <FlatList
              data={orderedEventMembers}
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