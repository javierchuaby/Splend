import React from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/TripViewScreenStyles';
import { TripMember } from '../types/TripTypes';

interface NewEventModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (isVisible: boolean) => void;
  newEventName: string;
  setNewEventName: (name: string) => void;
  newEventLocation: string;
  setNewEventLocation: (location: string) => void;
  newEventStartDate: Date;
  newEventEndDate: Date;
  setShowStartDatePicker: (show: boolean) => void;
  setShowEndDatePicker: (show: boolean) => void;
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;
  isLoadingUsers: boolean;
  searchResults: TripMember[];
  addEventMember: (member: TripMember) => void;
  selectedEventMembers: TripMember[];
  removeEventMember: (memberId: string) => void;
  currentUser: TripMember | null;
  createEvent: () => void;
  formatDateTime: (date: Date) => string;
}

export function NewEventModal({
  isModalVisible,
  setIsModalVisible,
  newEventName,
  setNewEventName,
  newEventLocation,
  setNewEventLocation,
  newEventStartDate,
  newEventEndDate,
  setShowStartDatePicker,
  setShowEndDatePicker,
  memberSearchQuery,
  setMemberSearchQuery,
  isLoadingUsers,
  searchResults,
  addEventMember,
  selectedEventMembers,
  removeEventMember,
  currentUser,
  createEvent,
  formatDateTime,
}: NewEventModalProps) {
  return (
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
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  Start: {formatDateTime(newEventStartDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
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
                  searchResults.map((member) => (
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
                {selectedEventMembers.map((member) => (
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
      </SafeAreaView>
    </Modal>
  );
}