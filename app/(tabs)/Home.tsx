import { MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import styles from '../../styles/HomeScreenStyles';

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

interface MonthOption {
  label: string;
  value: number;
}

export default function HomeScreen() {
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
    'active'
  );

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
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('trips')
      .orderBy('startDate')
      .onSnapshot(snapshot => {
        const tripsData = snapshot.docs
          .map(doc => {
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
          .filter((trip: Trip) =>
            trip.members.some((member: TripMember) => member.id === currentUser.id) &&
            (tripFilter === 'active' ? !trip.isConcluded : trip.isConcluded)
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
      usernameSnapshot.forEach(doc => {
        const userData = doc.data();
        foundUsers.push({
          id: doc.id,
          username: userData.username,
          displayName: userData.displayName,
          billIds: userData?.billIds,
          totalSpent: userData?.totalSpent,
          totalPaid: userData?.totalPaid,
        });
      });

      if (foundUsers.length === 0) {
        const displayNameSnapshot = await usersRef
          .orderBy('displayName')
          .startAt(query.charAt(0).toUpperCase() + query.slice(1))
          .endAt(query.charAt(0).toUpperCase() + query.slice(1) + '\uf8ff')
          .get();

        displayNameSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.displayName.toLowerCase().includes(query)) {
            foundUsers.push({
              id: doc.id,
              username: userData.username,
              displayName: userData.displayName,
              billIds: userData?.billIds,
              totalSpent: userData?.totalSpent,
              totalPaid: userData?.totalPaid,
            });
          }
        });
      }

      const uniqueFoundUsers = foundUsers.filter(
        user =>
          !selectedMembers.some(member => member.id === user.id) &&
          currentUser?.id !== user.id
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
      ...selectedMembers.filter(member => member.id !== currentUser.id),
    ].map(member => ({
      uid: member.id,
      username: member.username,
      displayName: member.displayName,
      billIds: [],
      totalSpent: 0,
      totalPaid: 0,
    }));

    if (startDate > endDate) {
      Alert.alert('Time Travel Much?', 'It looks like your trip ends before it starts.');
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
      Alert.alert('Failed to create trip', 'Looks like we were not destined to join you on your trip. :C');
      console.error(error);
    }
  };

  const addMember = (user: TripMember) => {
    if (!selectedMembers.some(member => member.id === user.id)) {
      setSelectedMembers([...selectedMembers, user]);
      setMemberSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== userId));
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

  const { years, months, days } = generateDateOptions();

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
      pathname: trip.isConcluded ? `/concluded-trip-view` : `/trip-view`,
      params: { tripId: trip.id },
    });
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigateToTrip(item)}
    >
      <Text style={styles.tripName}>{item.name}</Text>
      <Text style={styles.tripDates}>
        {formatDate(item.startDate)} - {formatDate(item.endDate)}
      </Text>
      <Text style={styles.tripMembers}>
        {item.members.length} member{item.members.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.membersList}>
        {item.members.slice(0, 3).map((member, index) => (
          <Text key={member.id} style={styles.memberName}>
            {member.displayName}
            {index < Math.min(item.members.length - 1, 2) ? ', ' : ''}
          </Text>
        ))}
        {item.members.length > 3 && (
          <Text style={styles.memberName}> +{item.members.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e1e1e" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.titleButton}
            onPress={() => setIsDropdownVisible(!isDropdownVisible)}
          >
            <Text style={styles.title}>
              {tripFilter === 'active' ? 'My Trips' : 'Concluded'}
            </Text>
            <MaterialIcons
              name={isDropdownVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#fff"
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
          {isDropdownVisible && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setTripFilter('active');
                  setIsDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownItemText}>My Trips</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setTripFilter('concluded');
                  setIsDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Concluded</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.newTripButton}
          onPress={() => {
            setIsModalVisible(true);
            if (currentUser) {
              setSelectedMembers([currentUser]);
            }
          }}
        >
          <Text style={styles.newTripButtonText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No trips yet</Text>
          <Text style={styles.emptyStateSubtext}>
            {tripFilter === 'active'
              ? 'Create your first group trip to get started!'
              : 'You have no concluded trips yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.tripsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Trip</Text>
            <TouchableOpacity onPress={createTrip}>
              <Text style={styles.createButton}>Create</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior="padding"
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.scrollViewContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Trip Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTripName}
                  onChangeText={setNewTripName}
                  placeholder="Enter trip name"
                  placeholderTextColor="#777"
                  keyboardAppearance="dark"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Trip Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newTripDescription}
                  onChangeText={setNewTripDescription}
                  placeholder="Describe your trip..."
                  placeholderTextColor="#777"
                  keyboardAppearance="dark"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Dates</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempStartDate(startDate);
                      setShowStartDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      Start: {formatDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempEndDate(endDate);
                      setShowEndDatePicker(true);
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      End: {formatDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Add Members</Text>
                <TextInput
                  style={styles.textInput}
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                  placeholder="Search users by username or display name"
                  placeholderTextColor="#777"
                  keyboardAppearance="dark"
                />

                {memberSearchQuery.length > 0 && (
                  <View style={styles.searchResults}>
                    {isLoadingUsers ? (
                      <Text style={styles.loadingText}>Searching...</Text>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <TouchableOpacity
                          key={user.id}
                          style={styles.searchResultItem}
                          onPress={() => addMember(user)}
                        >
                          <Text style={styles.searchResultText}>
                            <Text style={{ fontWeight: 'bold' }}>
                              {user.displayName}
                            </Text>{' '}
                            <Text style={styles.usernameText}>
                              @{user.username}
                            </Text>
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResultsText}>No users found</Text>
                    )}
                  </View>
                )}

                {selectedMembers.length > 0 && (
                  <View style={styles.selectedMembers}>
                    <Text style={styles.selectedMembersTitle}>
                      Selected Members:
                    </Text>
                    {selectedMembers.map(member => (
                      <View key={member.id} style={styles.selectedMemberItem}>
                        <Text style={styles.selectedMemberText}>
                          <Text style={{ fontWeight: 'bold' }}>
                            {member.displayName.length > 24
                              ? `${member.displayName.substring(0, 24)}...`
                              : member.displayName
                            }
                          </Text>{' '}
                          <Text style={styles.usernameText}>
                            @{member.username}
                          </Text>
                        </Text>
                        {currentUser?.id !== member.id && (
                          <TouchableOpacity
                            onPress={() => removeMember(member.id)}
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
          </KeyboardAvoidingView>

          <Modal
            visible={showStartDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowStartDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
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
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
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
  );
}