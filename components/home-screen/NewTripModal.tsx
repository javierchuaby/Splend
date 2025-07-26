import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../styles/HomeScreenStyles';
import { TripMember } from '../../types/TripTypes';

interface NewTripModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (isVisible: boolean) => void;
  newTripName: string;
  setNewTripName: (name: string) => void;
  newTripDescription: string;
  setNewTripDescription: (description: string) => void;
  startDate: Date;
  endDate: Date;
  setShowStartDatePicker: (show: boolean) => void;
  setShowEndDatePicker: (show: boolean) => void;
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;
  isLoadingUsers: boolean;
  searchResults: TripMember[];
  addMember: (user: TripMember) => void;
  selectedMembers: TripMember[];
  removeMember: (userId: string) => void;
  currentUser: TripMember | null;
  createTrip: () => void;
  formatDate: (date: Date) => string;
}

export function NewTripModal({
  isModalVisible,
  setIsModalVisible,
  newTripName,
  setNewTripName,
  newTripDescription,
  setNewTripDescription,
  startDate,
  endDate,
  setShowStartDatePicker,
  setShowEndDatePicker,
  memberSearchQuery,
  setMemberSearchQuery,
  isLoadingUsers,
  searchResults,
  addMember,
  selectedMembers,
  removeMember,
  currentUser,
  createTrip,
  formatDate,
}: NewTripModalProps) {
  return (
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
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    Start: {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
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
                    searchResults.map((user) => (
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
                  {selectedMembers.map((member) => (
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
                        <TouchableOpacity onPress={() => removeMember(member.id)}>
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
      </SafeAreaView>
    </Modal>
  );
}