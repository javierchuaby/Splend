import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMember } from '../../types/TripTypes';

interface SearchResultItemProps {
  item: TripMember;
  onAddMember: (member: TripMember) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  item,
  onAddMember,
}) => {
  return (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => onAddMember(item)}
    >
      <Text style={styles.searchResultText}>
        <Text style={styles.memberDisplayNameBold}>{item.displayName}</Text>{' '}
        <Text style={styles.usernameText}>@{item.username}</Text>
      </Text>
      <Text style={styles.addButtonText}>Add</Text>
    </TouchableOpacity>
  );
};