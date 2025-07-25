import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Event, MonthOption, Trip, TripMember } from '../types/TripTypes'; // Ensure Event is exported

export function useTripViewLogic(tripId: string) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [events, setEvents] = useState<Event[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventStartDate, setNewEventStartDate] = useState(new Date());
  const [newEventEndDate, setNewEventEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [selectedEventMembers, setSelectedEventMembers] = useState<TripMember[]>(
    [],
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TripMember[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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
      .doc(tripId)
      .onSnapshot(
        async (doc) => {
          if (doc.exists) {
            const data = doc.data();
            // Fetch actual user data for members
            const firestoreMembers: { uid: string }[] = data?.members || [];
            const resolvedMembers: TripMember[] = [];

            for (const memberRef of firestoreMembers) {
              const userDoc = await firestore()
                .collection('users')
                .doc(memberRef.uid)
                .get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                resolvedMembers.push({
                  id: memberRef.uid,
                  username: userData?.username,
                  displayName: userData?.displayName,
                  billIds: userData?.billIds || [],
                  totalSpent: userData?.totalSpent || 0,
                  totalPaid: userData?.totalPaid || 0,
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

            const isMember = currentTrip.members.some(
              (member) => member.id === currentUser.id,
            );
            setHasAccess(isMember);

            if (currentTrip.eventIds && currentTrip.eventIds.length > 0) {
              // Fetch events in batches if eventIds is very large
              const eventSnapshots = await firestore()
                .collection('events')
                .where(firestore.FieldPath.documentId(), 'in', currentTrip.eventIds)
                .get();
              const fetchedEvents: Event[] = eventSnapshots.docs.map((eventDoc) => {
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
        (error) => {
          console.error('Error fetching trip or events:', error);
          setTrip(null);
          setEvents([]);
          setHasAccess(false);
          setIsLoading(false);
          Alert.alert('Error', 'Failed to load trip data.');
        },
      );
    return unsubscribe;
  }, [tripId, currentUser]);

  useEffect(() => {
    const searchTripMembers = async () => {
      if (!memberSearchQuery.trim() || !trip) {
        setSearchResults([]);
        return;
      }

      setIsLoadingUsers(true);
      const query = memberSearchQuery.toLowerCase();
      // Filter members from the current trip's members that are not already selected
      const availableMembers = trip.members.filter(
        (member) =>
          !selectedEventMembers.some(
            (selectedMember) => selectedMember.id === member.id,
          ) &&
          (member.username.toLowerCase().includes(query) ||
            member.displayName.toLowerCase().includes(query)),
      );

      setSearchResults(availableMembers);
      setIsLoadingUsers(false);
    };

    const handler = setTimeout(() => {
      searchTripMembers();
    }, 300);

    return () => clearTimeout(handler);
  }, [memberSearchQuery, selectedEventMembers, trip]);

  const navigateToInfo = () => {
    router.push({
      pathname: '/trip-info',
      params: { tripId: trip?.id },
    });
  };

  const createEvent = async () => {
    if (!newEventName.trim()) {
      Alert.alert('Whoops!', 'Please enter an event name.');
      return;
    }
    if (!newEventLocation.trim()) {
      Alert.alert('Whoops!', 'Please enter an event location.');
      return;
    }
    if (!trip) {
      Alert.alert('Fatal error', 'Trip data not loaded.');
      return;
    }

    if (newEventStartDate > newEventEndDate) {
      Alert.alert(
        'Time Anomaly Detected',
        'Event start date cannot be after the end date.',
      );
      return;
    }

    const eventMemberUids = [
      ...selectedEventMembers.map((member) => member.id),
    ];

    try {
      const eventRef = await firestore().collection('events').add({
        eventName: newEventName.trim(),
        eventLocation: newEventLocation.trim(),
        startDateTime: firestore.Timestamp.fromDate(newEventStartDate),
        endDateTime: firestore.Timestamp.fromDate(newEventEndDate),
        memberIds: eventMemberUids,
        billIds: [],
      });

      await firestore()
        .collection('trips')
        .doc(trip.id)
        .update({
          eventIds: firestore.FieldValue.arrayUnion(eventRef.id),
        });

      setNewEventName('');
      setNewEventLocation('');
      setNewEventStartDate(new Date());
      setNewEventEndDate(new Date());
      setSelectedEventMembers([]);
      setMemberSearchQuery('');
      setIsModalVisible(false);

      router.push({
        pathname: '/event-view',
        params: { eventId: eventRef.id, tripId: trip.id },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create event.');
      console.error(error);
    }
  };

  const addEventMember = (member: TripMember) => {
    if (!selectedEventMembers.some((sm) => sm.id === member.id)) {
      setSelectedEventMembers([...selectedEventMembers, member]);
      setMemberSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeEventMember = (memberId: string) => {
    setSelectedEventMembers(
      selectedEventMembers.filter((member) => member.id !== memberId),
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleStartDateDone = () => {
    setShowStartDatePicker(false);
    setNewEventStartDate(tempStartDate);
  };

  const handleEndDateDone = () => {
    setShowEndDatePicker(false);
    setNewEventEndDate(tempEndDate);
  };

  const navigateToEvent = (event: Event) => {
    router.push({
      pathname: '/event-view',
      params: { eventId: event.id, tripId: tripId },
    });
  };

  return {
    trip,
    currentUser,
    hasAccess,
    isLoading,
    events,
    isModalVisible,
    setIsModalVisible,
    newEventName,
    setNewEventName,
    newEventLocation,
    setNewEventLocation,
    newEventStartDate,
    setNewEventStartDate,
    newEventEndDate,
    setNewEventEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    selectedEventMembers,
    setSelectedEventMembers,
    memberSearchQuery,
    setMemberSearchQuery,
    searchResults,
    isLoadingUsers,
    navigateToInfo,
    createEvent,
    addEventMember,
    removeEventMember,
    formatDate,
    formatDateTime,
    generateDateOptions,
    handleStartDateDone,
    handleEndDateDone,
    navigateToEvent,
  };
}