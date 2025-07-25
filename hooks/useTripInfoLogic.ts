import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { MonthOption, Trip, TripMember } from '../types/TripTypes';

export const useTripInfoLogic = (tripId: string) => {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageTripModalVisible, setIsManageTripModalVisible] =
    useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [isFromConcludeFlow, setIsFromConcludeFlow] = useState(false);

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
            billIds: userData?.billIds || [],
            totalSpent: userData?.totalSpent || 0,
            totalPaid: userData?.totalPaid || 0,
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

  const saveTrip = async (updatedFields: Partial<Trip>) => {
    if (!trip) return;

    const firestoreUpdate: { [key: string]: any } = {};

    if (updatedFields.startDate) {
      firestoreUpdate.startDate = firestore.Timestamp.fromDate(
        updatedFields.startDate
      );
    }

    if (updatedFields.endDate) {
      firestoreUpdate.endDate = firestore.Timestamp.fromDate(
        updatedFields.endDate
      );
    }

    try {
      await firestore()
        .collection('trips')
        .doc(trip.id)
        .update(firestoreUpdate);
    } catch (error) {
      Alert.alert('Error', 'Failed to update trip');
      console.error(error);
    }
  };

  const deleteTrip = async () => {
    if (!trip) return;

    setIsManageTripModalVisible(false);

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
              if (trip.eventIds && trip.eventIds.length > 0) {
                const eventPromises = trip.eventIds.map(eventId =>
                  firestore().collection('events').doc(eventId).delete()
                );
                await Promise.all(eventPromises);
              }

              await firestore().collection('trips').doc(trip.id).delete();
              router.push('/Home');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trip');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const concludeTrip = async () => {
    if (!trip) return;

    setIsManageTripModalVisible(false);

    Alert.alert(
      'Conclude Trip',
      `Are you sure you want to conclude "${trip.name}"? This will calculate final bill settlements.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Conclude & Split Bills',
          style: 'default',
          onPress: () => {
            setIsFromConcludeFlow(true);
            setShowSettlement(true);
          },
        },
      ]
    );
  };

  const concludeTripAfterSettlement = async () => {
    if (!trip) return;

    try {
      await firestore().collection('trips').doc(trip.id).update({
        isConcluded: true,
      });
      router.push('/Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to conclude trip, please try again');
      console.error('Trip conclusion error:', error);
    }
  };

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
      pathname: '/trip-members',
      params: { tripId: trip?.id },
    });
  };

  const navigateToDescription = () => {
    router.push({
      pathname: '/trip-description',
      params: { tripId: trip?.id },
    });
  };

  const generateDateOptions = (): {
    years: number[];
    months: MonthOption[];
    days: number[];
  } => {
    const today = new Date();
    const years: number[] = [];
    const months: MonthOption[] = [];
    const days: number[] = [];

    for (let i = 0; i < 6; i++) {
      years.push(today.getFullYear() + i);
    }

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    monthNames.forEach((month, index) => {
      months.push({ label: month, value: index });
    });

    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }

    return { years, months, days };
  };

  const { years, months, days } = generateDateOptions();

  const handleStartDateDone = async () => {
    if (!trip) return;

    if (tempStartDate > trip.endDate) {
      Alert.alert('Error', 'Start date cannot be after the end date');
      return;
    }

    await saveTrip({ startDate: tempStartDate });
    setShowStartDatePicker(false);
  };

  const handleEndDateDone = async () => {
    if (!trip) return;

    if (tempEndDate < trip.startDate) {
      Alert.alert('Error', 'End date cannot be before the start date');
      return;
    }

    await saveTrip({ endDate: tempEndDate });
    setShowEndDatePicker(false);
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

  const handleSettlementClose = () => {
    setShowSettlement(false);
    if (isFromConcludeFlow) {
      concludeTripAfterSettlement();
    }
    setIsFromConcludeFlow(false);
  };

  return {
    trip,
    isLoading,
    hasAccess,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    isManageTripModalVisible,
    setIsManageTripModalVisible,
    showSettlement,
    setShowSettlement,
    isFromConcludeFlow,
    setIsFromConcludeFlow,
    saveTrip,
    deleteTrip,
    concludeTrip,
    concludeTripAfterSettlement,
    formatDate,
    calculateDuration,
    navigateToMembers,
    navigateToDescription,
    years,
    months,
    days,
    handleStartDateDone,
    handleEndDateDone,
    groupLedger: calculateGroupLedger(),
    individualLedger: calculateIndividualLedger(),
    handleSettlementClose,
  };
};