import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import styles from '../../styles/trip-members.styles';

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

export default function ConcludedTripMembersScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setIsLoadingTrip(false);
      return;
    }
    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(async doc => {
        if (doc.exists()) {
          const data = doc.data();
          const firestoreMembers: any[] = data?.members || [];
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
              resolvedMembers.push({
                id: memberRef.uid,
                username: 'deleted',
                displayName: 'Deleted User',
                billIds: [],
                totalSpent: 0,
                totalPaid: 0,
              });
            }
          }
          setTrip({
            id: doc.id,
            name: data!.tripName,
            members: resolvedMembers,
            startDate: data!.startDate.toDate(),
            endDate: data!.endDate.toDate(),
            createdAt: data!.createdAt?.toDate() ?? new Date(),
            tripDescription: data?.tripDescription || '',
            isConcluded: data?.isConcluded || false,
            eventIds: data?.eventIds || [],
          });
        } else {
          setTrip(null);
        }
        setIsLoadingTrip(false);
      });
    return unsubscribe;
  }, [tripId]);

  const orderedMembers = useMemo(() => {
    if (!trip) return [];
    return [...trip.members].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [trip]);

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

  if (!trip) {
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
            <Text style={styles.sectionTitle}>
              Members ({orderedMembers.length})
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