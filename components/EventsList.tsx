import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/TripViewScreenStyles';
import { Event, TripMember } from '../types/TripTypes';

interface EventsListProps {
  events: Event[];
  tripMembers: TripMember[]; // To resolve event member display names
  formatDateTime: (date: Date) => string;
  navigateToEvent: (event: Event) => void;
}

export function EventsList({
  events,
  tripMembers,
  formatDateTime,
  navigateToEvent,
}: EventsListProps) {
  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigateToEvent(item)}
    >
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventDates}>
        {formatDateTime(item.startDateTime)} - {formatDateTime(item.endDateTime)}
      </Text>
      <Text style={styles.eventMembersCount}>
        {item.memberIds.length} member{item.memberIds.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.eventMembersList}>
        {tripMembers
          .filter((member) => item.memberIds.includes(member.id))
          .slice(0, 3)
          .map((member, index) => (
            <Text key={member.id} style={styles.eventMemberName}>
              {member.displayName}
              {index < Math.min(item.memberIds.length - 1, 2) ? ', ' : ''}
            </Text>
          ))}
        {item.memberIds.length > 3 && (
          <Text style={styles.eventMemberName}>
            {' '}
            +{item.memberIds.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={events}
      renderItem={renderEventItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.eventsList}
      showsVerticalScrollIndicator={false}
    />
  );
}