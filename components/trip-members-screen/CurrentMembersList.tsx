import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';
import { TripMember } from '../../types/TripTypes';
import { MemberItem } from './MemberItem';

interface CurrentMembersListProps {
  orderedMembers: TripMember[];
  currentUserUid: string | null;
  onRemoveMember: (member: TripMember) => void;
}

export const CurrentMembersList: React.FC<CurrentMembersListProps> = ({
  orderedMembers,
  currentUserUid,
  onRemoveMember,
}) => {
  return (
    <View style={styles.membersSection}>
      <Text style={styles.sectionTitle}>
        Current Members ({orderedMembers.length})
      </Text>
      <FlatList
        data={orderedMembers}
        renderItem={({ item }) => (
          <MemberItem
            item={item}
            currentUserUid={currentUserUid}
            onRemoveMember={onRemoveMember}
          />
        )}
        keyExtractor={item => item.id}
        style={styles.membersList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};