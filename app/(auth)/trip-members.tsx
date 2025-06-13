import firestore from '@react-native-firebase/firestore';
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

export default function TripMembersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { tripId } = useLocalSearchParams();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Real-time listener for this trip
  useEffect(() => {
    if (!tripId) return;
    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(doc => {
        if (doc.exists()) {
          const data = doc.data();
          setTrip({
            id: doc.id,
            name: data!.name,
            members: data!.members,
            startDate: data!.startDate.toDate(),
            endDate: data!.endDate.toDate(),
            createdAt: data!.createdAt?.toDate() ?? new Date(),
          });
        } else {
          setTrip(null);
        }
      });
    return unsubscribe;
  }, [tripId]);

  // Add member
  const addMember = async (user: TripMember) => {
    if (!trip) return;
    if (trip.members.some(member => member.id === user.id)) {
      Alert.alert('Error', 'User is already a member of this trip');
      return;
    }
    try {
      await firestore()
        .collection('trips')
        .doc(trip.id)
        .update({
          members: [...trip.members, user],
        });
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
      console.error(error);
    }
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    if (!trip) return;
    if (trip.members.length === 1) {
      Alert.alert('Error', 'Trip must have at least one member');
      return;
    }
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('trips')
                .doc(trip.id)
                .update({
                  members: trip.members.filter(member => member.id !== memberId),
                });
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Search Query For Mock Users
  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !trip?.members.some((member) => member.id === user.id)
  );

  const renderMemberItem = ({ item }: { item: TripMember }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberUsername}>{item.username}</Text>
      {/* Button to Remove Member */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeMember(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchResultItem = ({ item }: { item: TripMember }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => addMember(item)}
    >
      <Text style={styles.searchResultText}>{item.username}</Text>
      {/* Button to Add Member */}
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  );

  // Trip not Found error message
  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
        {/* Trip not Found message */}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Trip Members screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          {/* Back button */}
          <Text style={styles.backButton}>← Trip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {/* Add Member Section */}
        <View style={styles.addMemberSection}>
          <Text style={styles.sectionTitle}>Add New Member</Text>
          {/* User Search Bar */}
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users by username"
            placeholderTextColor="#777"
            keyboardAppearance="dark"
          />
          {/* Display search results */}
          {searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              <FlatList
                data={filteredUsers}
                renderItem={renderSearchResultItem}
                keyExtractor={(item) => item.id}
                style={styles.searchResultsList}
                keyboardShouldPersistTaps="handled"
              />
              {/* User not found error message */}
              {filteredUsers.length === 0 && (
                <Text style={styles.noResultsText}>No users found</Text>
              )}
            </View>
          )}
        </View>

        {/* Current members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Current Members ({trip.members.length})
          </Text>
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