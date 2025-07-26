import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMember } from '../../types/TripTypes';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsListProps {
  searchResults: TripMember[];
  isLoadingUsers: boolean;
  onAddMember: (member: TripMember) => void;
  searchQuery: string; // Include searchQuery to determine rendering of "No users found"
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
  isLoadingUsers,
  onAddMember,
  searchQuery,
}) => {
  if (isLoadingUsers) {
    return (
      <View style={styles.searchResults}>
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }

  if (searchQuery.length > 0 && searchResults.length === 0) {
    return (
      <View style={styles.searchResults}>
        <Text style={styles.noResultsText}>No users found</Text>
      </View>
    );
  }

  if (searchResults.length === 0) {
    return null; // Don't show anything if no search query and no results
  }

  return (
    <View style={styles.searchResults}>
      <FlatList
        data={searchResults}
        renderItem={({ item }) => (
          <SearchResultItem item={item} onAddMember={onAddMember} />
        )}
        keyExtractor={item => item.id}
        style={styles.searchResultsList}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};