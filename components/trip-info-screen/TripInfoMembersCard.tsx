import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';
import { TripMember } from '../../types/TripTypes';

interface TripInfoMembersCardProps {
  members: TripMember[];
  onPress: () => void;
}

export const TripInfoMembersCard: React.FC<TripInfoMembersCardProps> = ({
  members,
  onPress,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Members</Text>
      <TouchableOpacity style={styles.membersCard} onPress={onPress}>
        <Text style={styles.membersCount}>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.membersList}>
          {members.slice(0, 2).map((member, index) => (
            <Text key={member.id} style={styles.memberName}>
              {member.displayName}
              {index < Math.min(members.length - 1, 2) ? ', ' : ''}
            </Text>
          ))}
          {members.length > 2 && (
            <Text style={styles.memberName}>+{members.length - 2} more</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
};