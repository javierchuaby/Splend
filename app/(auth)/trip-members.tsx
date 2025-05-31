// app/trip-members.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Define types for Trip and TripMember data structure
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

// Mock users for search functionality
const MOCK_USERS: TripMember[] = [
  { id: '1', username: 'Javier Chua' },
  { id: '2', username: 'Chavier Jua' },
];

// Key for storing trip data in AsyncStorage
const STORAGE_KEY = 'splend_trips';

// Component for managing trip members
export default function TripMembersScreen() {
  // Hooks for navigation and accessing route parameters
  const router = useRouter();
  const navigation = useNavigation();
  const { tripId } = useLocalSearchParams();

  // State to hold the loaded trip data
  const [trip, setTrip] = useState<Trip | null>(null);
  // State for the member search input query
  const [searchQuery, setSearchQuery] = useState('');
  // Note: isAddingMember state is removed as the add member section is always visible

  // Use layout effect to configure screen options (like hiding header)
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Load trip data when the component mounts or tripId changes
  useEffect(() => {
    loadTrip();
  }, [tripId]);

  // Function to load trip data from AsyncStorage
  const loadTrip = async () => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
        }));
        // Find the specific trip by ID
        const foundTrip = parsedTrips.find((t: Trip) => t.id === tripId);
        setTrip(foundTrip || null);
      }
    } catch (error) {
      console.error('Error loading trip:', error);
    }
  };

  // Function to save the updated trip data to AsyncStorage
  const saveTrip = async (updatedTrip: Trip) => {
    try {
      const storedTrips = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips).map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          createdAt: new Date(trip.createdAt),
        }));
        // Update the specific trip in the array
        const updatedTrips = parsedTrips.map((t: Trip) =>
          t.id === updatedTrip.id ? updatedTrip : t
        );
        // Save the updated list back to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
        // Update the component's state with the saved trip
        setTrip(updatedTrip);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  // Function to add a member to the trip
  const addMember = async (user: TripMember) => {
    if (!trip) return;

    // Check if the user is already a member
    if (trip.members.some(member => member.id === user.id)) {
      Alert.alert('Error', 'User is already a member of this trip');
      return;
    }

    // Create an updated trip object with the new member
    const updatedTrip = {
      ...trip,
      members: [...trip.members, user],
    };

    // Save the updated trip
    await saveTrip(updatedTrip);
    // Clear the search query and hide the search results
    setSearchQuery('');
    // Removed setIsAddingMember(false) as the section is always visible
  };

  // Function to remove a member from the trip
  const removeMember = async (memberId: string) => {
    if (!trip) return;

    // Prevent removing the last member
    if (trip.members.length === 1) {
      Alert.alert('Error', 'Trip must have at least one member');
      return;
    }

    // Show a confirmation alert before removing
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Create an updated trip object without the removed member
            const updatedTrip = {
              ...trip,
              members: trip.members.filter(member => member.id !== memberId),
            };
            // Save the updated trip
            await saveTrip(updatedTrip);
          },
        },
      ]
    );
  };

  // Filter mock users based on search query and exclude existing members
  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !trip?.members.some((member) => member.id === user.id)
  );

  // Render function for each member item in the FlatList
  const renderMemberItem = ({ item }: { item: TripMember }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberUsername}>{item.username}</Text>
      {/* Button to remove a member */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeMember(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  // Render function for each search result item in the FlatList
  const renderSearchResultItem = ({ item }: { item: TripMember }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => addMember(item)}
    >
      <Text style={styles.searchResultText}>{item.username}</Text>
      {/* Button to add a user to the trip */}
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  );

  // Render a loading or error state if the trip is not found
  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Custom header for the 'Trip not found' state */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
          {/* Placeholder for alignment */}
          <View style={styles.placeholder} />
        </View>
        {/* Message displayed when the trip data couldn't be loaded */}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main render for the Trip Members screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header for the Members view */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          {/* Button to navigate back to the Trip Details screen */}
          <Text style={styles.backButton}>← Trip</Text>
        </TouchableOpacity>
        {/* Title for the header */}
        <Text style={styles.headerTitle}>Members</Text>
        {/* Placeholder for alignment when there's no button on the right */}
        <View style={styles.placeholder} />
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {/* Add Member Section (Always visible) */}
        <View style={styles.addMemberSection}>
          <Text style={styles.sectionTitle}>Add New Member</Text>
          {/* Input for searching users */}
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users by username"
            placeholderTextColor="#777"
            keyboardAppearance="dark"
          />
          {/* Display search results if there is a query */}
          {searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              <FlatList
                data={filteredUsers}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.id}
                style={styles.searchResultsList}
                keyboardShouldPersistTaps="handled"
              />
              {/* Message when no users match the search */}
              {filteredUsers.length === 0 && (
                <Text style={styles.noResultsText}>No users found</Text>
              )}
            </View>
          )}
        </View>

        {/* Section displaying the current members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Current Members ({trip.members.length})
          </Text>
          {/* List to display current trip members */}
          <FlatList
            data={trip.members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            style={styles.membersList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// Stylesheet for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#121212',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  // addButton style is no longer used for header button
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addMemberSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    marginBottom: 8,
    color: '#fff',
  },
  searchResults: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultText: {
    fontSize: 16,
    color: '#fff',
  },
  addButtonText: {
    fontSize: 14,
    color: '#0a84ff',
    fontWeight: '500',
  },
  noResultsText: {
    padding: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  membersSection: {
    flex: 1,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  memberUsername: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#4d2c2c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#ff453a',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#aaa',
  },
});