import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import styles from '../../styles/trip-view.styles';

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
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  memberIds: string[];
  billIds: string[];
}

export default function ConcludedTripViewScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

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
  }, [tripId, currentUser]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateToInfo = () => {
    router.push({
      pathname: '/(trips-concluded)/concluded-trip-info',
      params: { tripId: trip?.id },
    });
  };

  const navigateToEvent = (event: Event) => {
    router.push({
      pathname: '/event-view',
      params: { eventId: event.id, tripId: tripId },
    });
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.eventCard} onPress={() => navigateToEvent(item)}>
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventDates}>
        {formatDateTime(item.startDateTime)} -{' '}
        {formatDateTime(item.endDateTime)}
      </Text>
      <Text style={styles.eventMembersCount}>
        {item.memberIds.length} member{item.memberIds.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.eventMembersList}>
        {trip?.members
          .filter(member => item.memberIds.includes(member.id))
          .slice(0, 3)
          .map((member, index) => (
            <Text key={member.id} style={styles.eventMemberName}>
              {member.displayName}
              {index < Math.min(item.memberIds.length - 1, 2) ? ', ' : ''}
            </Text>
          ))}
        {item.memberIds.length > 3 && (
          <Text style={styles.eventMemberName}>
            {' '}
            +{item.memberIds.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/Home')}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.loadingTitle}>Loading...</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading trip and events...</Text>
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
            <TouchableOpacity onPress={() => router.push('/Home')}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.loadingTitle}>Not Found</Text>
            </View>
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
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={navigateToInfo}
            style={styles.headerTitleContainer}
          >
            <Text style={styles.tripTitle}>{trip.name}</Text>
            <Text style={styles.tripSubtitle}>Tap to view details</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}