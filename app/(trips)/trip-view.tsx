import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
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

interface MonthOption {
  label: string;
  value: number;
}

export default function TripViewScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
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
    []
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
            const firestoreMembers: any[] = data?.members || [];
            const resolvedMembers: TripMember[] = await Promise.all(
              firestoreMembers.map(async memberRef => {
                const userDoc = await firestore()
                  .collection('users')
                  .doc(memberRef.uid)
                  .get();
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  return {
                    id: memberRef.uid,
                    username: userData?.username,
                    displayName: userData?.displayName,
                    billIds: userData?.billIds,
                    totalSpent: userData?.totalSpent,
                    totalPaid: userData?.totalPaid,
                  };
                }
                return {
                  id: memberRef.uid,
                  username: 'deleted',
                  displayName: 'Deleted User',
                  billIds: [],
                  totalSpent: 0,
                  totalPaid: 0,
                };
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
          console.error('Error fetching trip or events:', error);
          setTrip(null);
          setEvents([]);
          setHasAccess(false);
          setIsLoading(false);
        }
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
      const availableMembers = trip.members.filter(
        member =>
          !selectedEventMembers.some(
            selectedMember => selectedMember.id === member.id
          )
      );

      const filtered = availableMembers.filter(
        member =>
          member.username.toLowerCase().includes(query) ||
          member.displayName.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
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
        'Event start date cannot be after the end date.'
      );
      return;
    }

    const eventMemberUids = [
      ...selectedEventMembers.map(member => member.id),
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
    if (!selectedEventMembers.some(sm => sm.id === member.id)) {
      setSelectedEventMembers([...selectedEventMembers, member]);
      setMemberSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeEventMember = (memberId: string) => {
    setSelectedEventMembers(
      selectedEventMembers.filter(member => member.id !== memberId)
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

  const { years, months, days } = generateDateOptions();

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
            <Text style={styles.emptyStateText}>No events yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first event for this trip!
            </Text>
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

        <View style={styles.createEventSection}>
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={() => {
              setIsModalVisible(true);
              if (currentUser) {
                setSelectedEventMembers([currentUser]);
              }
            }}
          >
            <Text style={styles.createEventButtonText}>+ Create New Event</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Event</Text>
              <TouchableOpacity onPress={createEvent}>
                <Text style={styles.createButton}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Event Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newEventName}
                  onChangeText={setNewEventName}
                  placeholder="Enter event name"
                  placeholderTextColor="#777"
                  keyboardAppearance="dark"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Event Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={newEventLocation}
                  onChangeText={setNewEventLocation}
                  placeholder="Enter event location"
                  placeholderTextColor="#777"
                  keyboardAppearance="dark"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Dates & Time</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempStartDate(newEventStartDate);
                      setShowStartDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      Start: {formatDateTime(newEventStartDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempEndDate(newEventEndDate);
                      setShowEndDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      End: {formatDateTime(newEventEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Add Members (from Trip)</Text>
                <TextInput
                  style={styles.textInput}
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                  placeholder="Search members from this trip"
                  placeholderTextColor="#777"
                  keyboardAppearance="dark"
                />

                {memberSearchQuery.length > 0 && (
                  <View style={styles.searchResults}>
                    {isLoadingUsers ? (
                      <Text style={styles.loadingText}>Searching...</Text>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(member => (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.searchResultItem}
                          onPress={() => addEventMember(member)}
                        >
                          <Text style={styles.searchResultText}>
                            <Text style={{ fontWeight: 'bold' }}>
                              {member.displayName}
                            </Text>{' '}
                            <Text style={styles.usernameText}>
                              @{member.username}
                            </Text>
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResultsText}>No members found</Text>
                    )}
                  </View>
                )}

                {selectedEventMembers.length > 0 && (
                  <View style={styles.selectedMembers}>
                    <Text style={styles.selectedMembersTitle}>
                      Selected Members:
                    </Text>
                    {selectedEventMembers.map(member => (
                      <View key={member.id} style={styles.selectedMemberItem}>
                        <Text style={styles.selectedMemberText}>
                          <Text style={{ fontWeight: 'bold' }}>
                            {member.displayName.length > 24
                              ? `${member.displayName.substring(0, 24)}...`
                              : member.displayName}
                          </Text>{' '}
                          <Text style={styles.usernameText}>
                            @{member.username}
                          </Text>
                        </Text>
                        {currentUser?.id !== member.id && (
                          <TouchableOpacity
                            onPress={() => removeEventMember(member.id)}
                          >
                            <Text style={styles.removeMemberButton}>remove</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <Modal
              visible={showStartDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowStartDatePicker(false)}
            >
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowStartDatePicker(false)}
                    >
                      <Text style={styles.datePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select Start Date</Text>
                    <TouchableOpacity onPress={handleStartDateDone}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerRow}>
                    <Picker
                      style={styles.picker}
                      selectedValue={tempStartDate.getFullYear()}
                      onValueChange={value => {
                        const newDate = new Date(tempStartDate);
                        newDate.setFullYear(value);
                        setTempStartDate(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {years.map(year => (
                        <Picker.Item
                          key={year}
                          label={year.toString()}
                          value={year}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempStartDate.getMonth()}
                      onValueChange={value => {
                        const newDate = new Date(tempStartDate);
                        newDate.setMonth(value);
                        setTempStartDate(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {months.map(month => (
                        <Picker.Item
                          key={month.value}
                          label={month.label}
                          value={month.value}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempStartDate.getDate()}
                      onValueChange={value => {
                        const newDate = new Date(tempStartDate);
                        newDate.setDate(value);
                        setTempStartDate(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {days.map(day => (
                        <Picker.Item
                          key={day}
                          label={day.toString()}
                          value={day}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showEndDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowEndDatePicker(false)}
            >
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndDatePicker(false)}
                    >
                      <Text style={styles.datePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select End Date</Text>
                    <TouchableOpacity onPress={handleEndDateDone}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerRow}>
                    <Picker
                      style={styles.picker}
                      selectedValue={tempEndDate.getFullYear()}
                      onValueChange={value => {
                        const newDate = new Date(tempEndDate);
                        newDate.setFullYear(value);
                        setTempEndDate(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {years.map(year => (
                        <Picker.Item
                          key={year}
                          label={year.toString()}
                          value={year}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempEndDate.getMonth()}
                      onValueChange={value => {
                        const newDate = new Date(tempEndDate);
                        newDate.setMonth(value);
                        setTempEndDate(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {months.map(month => (
                        <Picker.Item
                          key={month.value}
                          label={month.label}
                          value={month.value}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempEndDate.getDate()}
                      onValueChange={value => {
                        const newDate = new Date(tempEndDate);
                        newDate.setDate(value);
                        setTempEndDate(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {days.map(day => (
                        <Picker.Item
                          key={day}
                          label={day.toString()}
                          value={day}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </Modal>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}