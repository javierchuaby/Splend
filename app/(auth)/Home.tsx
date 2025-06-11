// app/(auth)/homepage.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Types
interface TripMember {
  id: string;
  username: string;
}

interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

interface MonthOption {
  label: string;
  value: number;
}

// Mock users for search functionality
const MOCK_USERS: TripMember[] = [
  { id: '1', username: 'Javier Chua' },
  { id: '2', username: 'Chavier Jua' },
];

const STORAGE_KEY = 'splend_trips';

export default function HomeScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<TripMember[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Date picker state
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  // Sign-out Button
  const SignOutButton = () => {
    const user = auth().currentUser;

    return (
        <TouchableOpacity style={styles.signOutButton} onPress={() => auth().signOut()}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
    );
  };

  // Load trips from local storage on component mount
  useEffect(() => {
    loadTrips();
  }, []);

  // Refresh trips when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTrips();
    }, [])
  );

  // Trip storage functions (designed for easy Firebase migration)
  const loadTrips = async () => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
        }));
        setTrips(parsedTrips);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setTrips([]);
    }
  };

  const saveTrips = async (updatedTrips: Trip[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
    } catch (error) {
      console.error('Error saving trips:', error);
    }
  };

  // Create new trip
  const createTrip = async () => {
    if (!newTripName.trim()) {
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please add at least one member');
      return;
    }

    if (startDate > endDate) {
      Alert.alert('Error', 'End date must be on or after start date');
      return;
    }

    const newTrip: Trip = {
      id: Date.now().toString(),
      name: newTripName.trim(),
      members: selectedMembers,
      startDate,
      endDate,
      createdAt: new Date(),
    };

    const updatedTrips = [...trips, newTrip];
    setTrips(updatedTrips);
    await saveTrips(updatedTrips);

    // Reset form
    setNewTripName('');
    setSelectedMembers([]);
    setMemberSearchQuery('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsModalVisible(false);

    Alert.alert('Success', 'Trip created successfully!');
  };

  // Filter users based on search query
  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) &&
      !selectedMembers.some((member) => member.id === user.id)
  );

  // Add member to selected list
  const addMember = (user: TripMember) => {
    setSelectedMembers([...selectedMembers, user]);
    setMemberSearchQuery('');
  };

  // Remove member from selected list
  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== userId));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate date options for picker
  const generateDateOptions = (): { years: number[]; months: MonthOption[]; days: number[] } => {
    const today = new Date();
    const years: number[] = [];
    const months: MonthOption[] = [];
    const days: number[] = [];

    // Years (current year + 5 years)
    for (let i = 0; i < 6; i++) {
      years.push(today.getFullYear() + i);
    }

    // Months
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthNames.forEach((month, index) => {
      months.push({ label: month, value: index });
    });

    // Days (1-31)
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }

    return { years, months, days };
  };

  const { years, months, days } = generateDateOptions();

  // Date picker handlers
  const handleStartDateDone = () => {
    setStartDate(tempStartDate);
    setShowStartDatePicker(false);
  };

  const handleEndDateDone = () => {
    setEndDate(tempEndDate);
    setShowEndDatePicker(false);
  };

  // Navigate to trip view
  const navigateToTrip = (trip: Trip) => {
    router.push({
      pathname: '/trip-view',
      params: { 
        tripId: trip.id,
        tripData: JSON.stringify(trip)
      }
    });
  };

  // Render trip item
  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity style={styles.tripCard} onPress={() => navigateToTrip(item)}>
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
            {member.username}
            {index < Math.min(item.members.length - 1, 2) ? ', ' : ''}
          </Text>
        ))}
        {item.members.length > 3 && (
          <Text style={styles.memberName}>
            +{item.members.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e1e1e" barStyle="light-content" />

      {/* New title at the very top */}
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Splend</Text>
      </View>

      {/* Existing header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity
          style={styles.newTripButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.newTripButtonText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome message above trip cards */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.signOutWelcomeText}>Welcome back, {auth().currentUser?.email}</Text>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No trips yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first group trip to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tripsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Trip Modal */}
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

          <ScrollView style={styles.modalContent}>
            {/* Trip Name */}
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

            {/* Date Selection */}
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

            {/* Member Search */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Add Members</Text>
              <TextInput
                style={styles.textInput}
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholder="Search users by username"
                placeholderTextColor="#777"
                keyboardAppearance="dark"
              />

              {/* Search Results */}
              {memberSearchQuery.length > 0 && (
                <View style={styles.searchResults}>
                  {filteredUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.searchResultItem}
                      onPress={() => addMember(user)}
                    >
                      <Text style={styles.searchResultText}>
                        {user.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredUsers.length === 0 && (
                    <Text style={styles.noResultsText}>No users found</Text>
                  )}
                </View>
              )}

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <View style={styles.selectedMembers}>
                  <Text style={styles.selectedMembersTitle}>
                    Selected Members:
                  </Text>
                  {selectedMembers.map((member) => (
                    <View key={member.id} style={styles.selectedMemberItem}>
                      <Text style={styles.selectedMemberText}>
                        {member.username}
                      </Text>
                      <TouchableOpacity onPress={() => removeMember(member.id)}>
                        <Text style={styles.removeMemberButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Start Date Picker */}
          {showStartDatePicker && (
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
                  onValueChange={(value) => {
                    const newDate = new Date(tempStartDate);
                    newDate.setFullYear(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getMonth()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempStartDate);
                    newDate.setMonth(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {months.map((month) => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>
                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getDate()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempStartDate);
                    newDate.setDate(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {days.map((day) => (
                    <Picker.Item key={day} label={day.toString()} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* End Date Picker */}
          {showEndDatePicker && (
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
                  onValueChange={(value) => {
                    const newDate = new Date(tempEndDate);
                    newDate.setFullYear(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>
                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getMonth()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempEndDate);
                    newDate.setMonth(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {months.map((month) => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>
                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getDate()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempEndDate);
                    newDate.setDate(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {days.map((day) => (
                    <Picker.Item key={day} label={day.toString()} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Fixed Sign Out button at bottom */}
      <View style={styles.signOutContainer}>
        <SignOutButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  pageTitleContainer: {
    paddingTop: 0,
    paddingBottom: 2,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#305cde',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  newTripButton: {
    backgroundColor: '#305cde',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newTripButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  tripsList: {
    padding: 20,
  },
  tripCard: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  tripDates: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  tripMembers: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 4,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 12,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  createButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1e1e1e',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultText: {
    fontSize: 16,
    color: '#fff',
  },
  noResultsText: {
    padding: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  selectedMembers: {
    marginTop: 16,
  },
  selectedMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bbb',
    marginBottom: 8,
  },
  selectedMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedMemberText: {
    fontSize: 14,
    color: '#fff',
  },
  removeMemberButton: {
    fontSize: 18,
    color: '#ff453a',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
    backgroundColor: '#1e1e1e',
  },
  picker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 0,
  },
  signOutWelcomeText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 0,
  },
  signOutContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  signOutButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});