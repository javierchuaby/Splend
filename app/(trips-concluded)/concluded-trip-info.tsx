import { BillSettlementManager } from '@/components/BillSettlementManager';
import TripPackingListPreview from '@/components/TripPackingListPreview';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import styles from '../../styles/trip-info.styles';

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

export default function ConcludedTripInfoScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageTripModalVisible, setIsManageTripModalVisible] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);

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
      pathname: '/(trips-concluded)/concluded-trip-members',
      params: { tripId: trip?.id },
    });
  };

  const navigateToDescription = () => {
    router.push({
      pathname: '/(trips-concluded)/concluded-trip-description',
      params: { tripId: trip?.id },
    });
  };

  const calculateGroupLedger = (): number => {
    if (!trip || !trip.members) return 0;
    return trip.members.reduce((sum, member) => sum + member.totalSpent, 0);
  };

  const calculateIndividualLedger = (): number => {
    if (!trip || !currentUser || !trip.members) return 0;
    const individualMember = trip.members.find(
      member => member.id === currentUser.id
    );
    return individualMember ? individualMember.totalSpent : 0;
  };

  const resumeTrip = async () => {
    if (!trip) return;
    setIsManageTripModalVisible(false);
    try {
      await firestore().collection('trips').doc(trip.id).update({
        isConcluded: false,
      });
      // Optionally, navigate to the active trip info page
      router.replace({
        pathname: '/trip-info',
        params: { tripId: trip.id },
      });
    } catch (error) {
      // Optionally show error
    }
  };

  const deleteTrip = async () => {
    if (!trip) return;
    setIsManageTripModalVisible(false);
    // Delete Trip logic from trip-info
    try {
      if (trip.eventIds && trip.eventIds.length > 0) {
        const eventPromises = trip.eventIds.map(eventId =>
          firestore().collection('events').doc(eventId).delete()
        );
        await Promise.all(eventPromises);
      }
      await firestore().collection('trips').doc(trip.id).delete();
      router.push('/Home');
    } catch (error) {
      // Optionally show error
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Trip</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Info</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading trip info...</Text>
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
            <Text style={styles.headerTitle}>Info</Text>
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

  const groupLedger = calculateGroupLedger();
  const individualLedger = calculateIndividualLedger();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Info</Text>
          <TouchableOpacity onPress={() => setIsManageTripModalVisible(true)}>
            <Text style={styles.manageTripButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.tripTitle}>{trip.name}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TouchableOpacity style={styles.descriptionCard} onPress={navigateToDescription}>
                <Text style={styles.descriptionText}>
                  {trip.tripDescription || 'No description provided.'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Start: {formatDate(trip.startDate)}</Text>
                </View>
                <View style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>End: {formatDate(trip.endDate)}</Text>
                </View>
              </View>
              <View style={styles.durationSubtextContainer}>
                <Text style={styles.durationSubtext}>
                  {calculateDuration(trip.startDate, trip.endDate)}
                </Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              <TouchableOpacity style={styles.membersCard} onPress={navigateToMembers}>
                <Text style={styles.membersCount}>
                  {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.membersList}>
                  {trip.members.slice(0, 2).map((member, index) => (
                    <Text key={member.id} style={styles.memberName}>
                      {member.displayName}
                      {index < Math.min(trip.members.length - 1, 2) ? ', ' : ''}
                    </Text>
                  ))}
                  {trip.members.length > 2 && (
                    <Text style={styles.memberName}>+{trip.members.length - 2} more</Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ledgers</Text>
              <View style={styles.ledgerCard}>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Group Ledger:</Text>
                  <Text style={styles.ledgerValue}>${groupLedger.toFixed(2)}</Text>
                </View>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Your Ledger:</Text>
                  <Text style={styles.ledgerValue}>${individualLedger.toFixed(2)}</Text>
                </View>
                <View style={styles.ledgerSeparator} />
                <TouchableOpacity
                  style={styles.settlementButtonCompact}
                  onPress={() => setShowSettlement(true)}
                >
                  <Text style={styles.settlementButtonCompactText}>View Settlement</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Packing List</Text>
              <TripPackingListPreview tripId={tripId as string} />
            </View>
          </View>
        </ScrollView>

        {/* Manage Trip Modal */}
        <Modal
          visible={isManageTripModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsManageTripModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.manageTripContainer}>
              <View style={styles.manageTripHeader}>
                <TouchableOpacity onPress={() => setIsManageTripModalVisible(false)}>
                  <Text style={styles.manageTripCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.manageTripTitle}>Manage Trip</Text>
                <View style={styles.placeholder} />
              </View>
              <View style={styles.manageTripButtons}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={resumeTrip}
                >
                  <Text style={styles.primaryActionButtonText}>Resume Trip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.destructiveActionButton}
                  onPress={deleteTrip}
                >
                  <Text style={styles.destructiveActionButtonText}>Delete Trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <BillSettlementManager
          tripId={tripId as string}
          tripName={trip.name}
          visible={showSettlement}
          onClose={() => setShowSettlement(false)}
          // Optionally, you can pass a prop to make it read-only if needed
        />
      </SafeAreaView>
    </>
  );
}