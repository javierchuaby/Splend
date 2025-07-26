import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMember } from '../../types/TripTypes';
import { SearchResultsList } from './SearchResultsList';

interface AddMemberSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: TripMember[];
  isLoadingUsers: boolean;
  onAddMember: (member: TripMember) => void;
}

export const AddMemberSection: React.FC<AddMemberSectionProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  isLoadingUsers,
  onAddMember,
}) => {
  return (
    <View style={styles.addMemberSection}>
      <Text style={styles.sectionTitle}>Add New Member</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search users by username or display name"
        placeholderTextColor={styles.usernameText.color} // Using AppColors.textDarkGrey
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <SearchResultsList
        searchQuery={searchQuery}
        searchResults={searchResults}
        isLoadingUsers={isLoadingUsers}
        onAddMember={onAddMember}
      />
    </View>
  );
};