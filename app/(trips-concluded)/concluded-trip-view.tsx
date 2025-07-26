import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  tripDescription: string;
  isConcluded: boolean;
  eventIds: string[];
}

interface Event {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
  startDateTime: Date;
  endDateTime: Date;
  memberIds: string[];
  billIds: string[];
}

export default function ConcludedTripViewScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
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
    if (!tripId || !currentUser) {
      setIsLoading(true);
      return;
    }

    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(
        async doc => {
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

            // If trip is no longer concluded, redirect to active trip view
            if (!currentTrip.isConcluded) {
              router.replace({
                pathname: '/trip-view',
                params: { tripId: currentTrip.id },
              });
              return;
            }

            setTrip(currentTrip);

            const isMember = currentTrip.members.some(
              member => member.id === currentUser.id
            );
            setHasAccess(isMember);

            if (currentTrip.eventIds && currentTrip.eventIds.length > 0) {
              const eventsSnapshot = await firestore()
                .collection('events')
                .where(firestore.FieldPath.documentId(), 'in', currentTrip.eventIds)
                .get();
              const fetchedEvents: Event[] = eventsSnapshot.docs.map(eventDoc => {
                const eventData = eventDoc.data();
                return {
                  id: eventDoc.id,
                  name: eventData.eventName,
                  location: eventData.eventLocation,
                  startDateTime: eventData.startDateTime.toDate(),
                  endDateTime: eventData.endDateTime.toDate(),
                  memberIds: eventData.memberIds,
                  billIds: eventData.billIds,
                };
              });
              setEvents(fetchedEvents);
            } else {
              setEvents([]);
            }

            setIsLoading(false);
          } else {
            setTrip(null);
            setEvents([]);
            setHasAccess(false);
            setIsLoading(false);
          }
        },
        error => {
          console.error('Error fetching trip:', error);
          setTrip(null);
          setEvents([]);
          setHasAccess(false);
          setIsLoading(false);
        }
      );
    return unsubscribe;
  }, [tripId, currentUser, router]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateToEventView = (event: Event) => {
    router.push({
      pathname: '../(events)/event-view',
      params: { eventId: event.id, tripId: tripId },
    });
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigateToEventView(item)}
    >
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventDates}>
        {formatDateTime(item.startDateTime)} -{' '}
        {formatDateTime(item.endDateTime)}
      </Text>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetailText}>
          Members: {item.memberIds.length}
        </Text>
        <Text style={styles.eventDetailText}>Bills: {item.billIds.length}</Text>
      </View>
    </TouchableOpacity>
  );

  // Loading...
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← All Trips</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Concluded Trip</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading trip...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Access denied, just in case
  if (!trip || !hasAccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← All Trips</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Concluded Trip</Text>
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
            <Text style={styles.backButton}>← All Trips</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{trip.name}</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: './concluded-trip-info',
                params: { tripId: trip?.id },
              })
            }
          >
            <Text style={styles.infoButtonText}>Info</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Events</Text>
            {events.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No events recorded.</Text>
                <Text style={styles.emptyStateSubtext}>
                  This trip has no events.
                </Text>
              </View>
            ) : (
              <FlatList
                data={events}
                renderItem={renderEventItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.eventsList}
                scrollEnabled={false} // Disable FlatList's own scroll as it's inside a ScrollView
              />
            )}
          </View>
        </ScrollView>
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
  infoButtonText: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  createEventButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createEventButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  eventsList: {
    paddingBottom: 10,
  },
  eventCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventDates: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#bbb',
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
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