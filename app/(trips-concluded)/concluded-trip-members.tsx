import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import styles from '../../styles/concluded-trip-members-styles';

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
            billIds: userData?.billIds,
            totalSpent: userData?.totalSpent,
            totalPaid: userData?.totalPaid,
          });
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch trip data and members
  useEffect(() => {
    if (!tripId || !currentUser) return;

    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(async doc => {
        if (doc.exists()) {
          const data = doc.data();
          const tripMembers = data!.members;

          // Fetch user data for each member from the `users` collection
          const resolvedMembers: TripMember[] = await Promise.all(
            tripMembers.map(async (member: { uid: string, username: string, displayName: string }) => {
              const userDoc = await firestore().collection('users').doc(member.uid).get();
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  id: member.uid,
                  username: userData?.username,
                  displayName: userData?.displayName,
                };
              } else {
                // Fallback to member info in the trip document (might be outdated) if cannot find member in members collection
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
            name: data!.tripName,
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