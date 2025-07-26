import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMember } from '../../types/TripTypes';

interface MemberItemProps {
  item: TripMember;
  currentUserUid: string | null;
  onRemoveMember: (member: TripMember) => void;
}

export const MemberItem: React.FC<MemberItemProps> = ({
  item,
  currentUserUid,
  onRemoveMember,
}) => {
  return (
    <View style={styles.memberItem}>
      <Text style={styles.memberUsername}>
        <Text style={styles.memberDisplayNameBold}>
          {item.displayName.length > 24
            ? `${item.displayName.substring(0, 16)}...`
            : item.displayName}
        </Text>{' '}
        <Text style={styles.usernameText}>@{item.username}</Text>
      </Text>
      {currentUserUid !== item.id && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemoveMember(item)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};