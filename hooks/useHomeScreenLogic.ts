import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { MonthOption, Trip, TripMember } from '../types/TripTypes';

export function useHomeScreenLogic() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDescription, setNewTripDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<TripMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [searchResults, setSearchResults] = useState<TripMember[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [tripFilter, setTripFilter] = useState<'active' | 'concluded'>(
    'active',
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
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
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('trips')
      .orderBy('startDate')
      .onSnapshot((snapshot) => {
        const tripsData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.tripName,
              members: data.members.map((member: any) => ({
                id: member.uid,
                username: member.username,
                displayName: member.displayName,
              })),
              startDate: data.startDate.toDate(),
              endDate: data.endDate.toDate(),
              createdAt: data.createdAt?.toDate(),
              tripDescription: data.tripDescription,
              isConcluded: data.isConcluded,
              eventIds: data.eventIds,
            };
          })
          .filter(
            (trip: Trip) =>
              trip.members.some((member: TripMember) => member.id === currentUser.id) &&
              (tripFilter === 'active' ? !trip.isConcluded : trip.isConcluded),
          );

        setTrips(tripsData);
      });
    return unsubscribe;
  }, [currentUser, tripFilter]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!memberSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoadingUsers(true);
      const query = memberSearchQuery.toLowerCase();
      const usersRef = firestore().collection('users');
      let foundUsers: TripMember[] = [];

      const usernameSnapshot = await usersRef
        .where('username', '==', query)
        .limit(1)
        .get();
      usernameSnapshot.forEach((doc) => {
        const userData = doc.data();
        foundUsers.push({
          id: doc.id,
          username: userData.username,
          displayName: userData.displayName,
          billIds: userData?.billIds || [],
          totalSpent: userData?.totalSpent || 0,
          totalPaid: userData?.totalPaid || 0,
        });
      });

      if (foundUsers.length === 0) {
        const displayNameSnapshot = await usersRef
          .orderBy('displayName')
          .startAt(query.charAt(0).toUpperCase() + query.slice(1))
          .endAt(query.charAt(0).toUpperCase() + query.slice(1) + '\uf8ff')
          .get();

        displayNameSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.displayName.toLowerCase().includes(query)) {
            foundUsers.push({
              id: doc.id,
              username: userData.username,
              displayName: userData.displayName,
              billIds: userData?.billIds || [],
              totalSpent: userData?.totalSpent || 0,
              totalPaid: userData?.totalPaid || 0,
            });
          }
        });
      }

      const uniqueFoundUsers = foundUsers.filter(
        (user) =>
          !selectedMembers.some((member) => member.id === user.id) &&
          currentUser?.id !== user.id,
      );

      setSearchResults(uniqueFoundUsers);
      setIsLoadingUsers(false);
    };

    const handler = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(handler);
  }, [memberSearchQuery, selectedMembers, currentUser]);

  const createTrip = async () => {
    if (!newTripName.trim()) {
      Alert.alert("We're going on a what?", 'Please enter a trip name.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Fatal error', 'Current user data not loaded. Please try again.');
      return;
    }

    const allMembers = [
      currentUser,
      ...selectedMembers.filter((member) => member.id !== currentUser.id),
    ].map((member) => ({
      uid: member.id,
      username: member.username,
      displayName: member.displayName,
      billIds: member.billIds || [],
      totalSpent: member.totalSpent || 0,
      totalPaid: member.totalPaid || 0,
    }));

    if (startDate > endDate) {
      Alert.alert(
        'Time Travel Much?',
        'It looks like your trip ends before it starts.',
      );
      return;
    }

    try {
      const docRef = await firestore().collection('trips').add({
        tripName: newTripName.trim(),
        tripDescription: newTripDescription.trim(),
        startDate: firestore.Timestamp.fromDate(startDate),
        endDate: firestore.Timestamp.fromDate(endDate),
        members: allMembers,
        eventIds: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
        isConcluded: false,
      });

      setNewTripName('');
      setNewTripDescription('');
      setSelectedMembers([]);
      setMemberSearchQuery('');
      setStartDate(new Date());
      setEndDate(new Date());
      setIsModalVisible(false);

      router.push({
        pathname: '/trip-view',
        params: { tripId: docRef.id },
      });
    } catch (error) {
      Alert.alert(
        'Failed to create trip',
        'Looks like we were not destined to join you on your trip. :C',
      );
      console.error(error);
    }
  };

  const addMember = (user: TripMember) => {
    if (!selectedMembers.some((member) => member.id === user.id)) {
      setSelectedMembers([...selectedMembers, user]);
      setMemberSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== userId));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
    setStartDate(tempStartDate);
  };

  const handleEndDateDone = () => {
    setShowEndDatePicker(false);
    setEndDate(tempEndDate);
  };

  const navigateToTrip = (trip: Trip) => {
    router.push({
      pathname: trip.isConcluded ? `/concluded-trip-view` : `/trip-view`, // Assuming these paths exist
      params: { tripId: trip.id },
    });
  };

  return {
    trips,
    isModalVisible,
    setIsModalVisible,
    newTripName,
    setNewTripName,
    newTripDescription,
    setNewTripDescription,
    selectedMembers,
    setSelectedMembers,
    memberSearchQuery,
    setMemberSearchQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    currentUser,
    searchResults,
    isLoadingUsers,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    isDropdownVisible,
    setIsDropdownVisible,
    tripFilter,
    setTripFilter,
    createTrip,
    addMember,
    removeMember,
    formatDate,
    generateDateOptions,
    handleStartDateDone,
    handleEndDateDone,
    navigateToTrip,
  };
}