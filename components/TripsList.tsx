import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/HomeScreenStyles';
import { Trip, TripMember } from '../types/TripTypes';

interface TripsListProps {
  trips: Trip[];
  navigateToTrip: (trip: Trip) => void;
}

export function TripsList({ trips, navigateToTrip }: TripsListProps) {
  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity style={styles.tripCard} onPress={() => navigateToTrip(item)}>
      <Text style={styles.tripName}>{item.name}</Text>
      <Text style={styles.tripDates}>
        {item.startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })} -{' '}
        {item.endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </Text>
      <Text style={styles.tripMembers}>
        {item.members.length} member{item.members.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.membersList}>
        {item.members.slice(0, 3).map((member: TripMember, index: number) => (
          <Text key={member.id} style={styles.memberName}>
            {member.displayName}
            {index < Math.min(item.members.length - 1, 2) ? ', ' : ''}
          </Text>
        ))}
        {item.members.length > 3 && (
          <Text style={styles.memberName}> +{item.members.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={trips}
      renderItem={renderTripItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tripsList}
      showsVerticalScrollIndicator={false}
    />
  );
}