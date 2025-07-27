import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import styles from '../../styles/CalendarScreenStyles';

enum EventStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
enum EventType {
  MEETING = 'meeting',
  TRIP = 'trip',
  OTHER = 'other',
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  eventLocation?: string | string[] | object;
  description?: string;
  organizerId?: string;
  status?: EventStatus;
  type?: EventType;
  tripId: string; // Now mandatory for new events, assuming old ones are migrated or handled.
  [key: string]: any;
}

interface TripDisplay {
  tripId: string;
  tripName: string; // We'll fetch this dynamically
  events: Event[];
}

// Simple cache for trip names to avoid redundant Firestore reads
const tripNameCache: Record<string, string> = {};

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventsByTrip, setEventsByTrip] = useState<TripDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndOrganizeEvents = async () => {
      const user = auth().currentUser;
      if (!user) {
        setEventsByTrip([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const unsubscribeEvents = firestore()
        .collection('events')
        .where('memberIds', 'array-contains', user.uid)
        .onSnapshot(
          async snapshot => {
            const fetchedEvents: Event[] = [];
            const uniqueTripIds: Set<string> = new Set();
            const eventsByTripId: { [key: string]: Event[] } = {};

            snapshot.docs.forEach(doc => {
              const data = doc.data();
              let date = '';
              let time = '';
              let start = data.startDateTime;

              // Robustly handle different date formats from Firestore
              if (
                start &&
                typeof start === 'object' &&
                typeof start.toDate === 'function'
              ) {
                const jsDate = start.toDate();
                date = jsDate.toISOString().slice(0, 10); // YYYY-MM-DD
                time = jsDate.toTimeString().slice(0, 5); // HH:MM
              } else if (typeof start === 'string') {
                // Keep this fallback for legacy data, but aim for Timestamps
                const match = start.match(
                  /^(\d{1,2}) (\w+) (\d{4}) at (\d{2}):(\d{2})/
                );
                if (match) {
                  const day = match[1].padStart(2, '0');
                  const monthStr = match[2];
                  const year = match[3];
                  const hour = match[4];
                  const minute = match[5];
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  const month = (monthNames.indexOf(monthStr) + 1)
                    .toString()
                    .padStart(2, '0');
                  date = `${year}-${month}-${day}`;
                  time = `${hour}:${minute}`;
                }
              }

              // IMPORTANT: Ensure tripId exists for the event to be displayed
              // If it's undefined, it means old events without tripId won't be grouped.
              // Consider a data migration script for existing events if needed.
              const eventTripId = data.tripId as string | undefined;

              if (eventTripId) {
                const event: Event = {
                  id: doc.id,
                  title: data.eventName || '(No Title)',
                  date,
                  time,
                  participants: data.memberIds || [],
                  tripId: eventTripId,
                  ...data,
                };
                fetchedEvents.push(event);
                uniqueTripIds.add(eventTripId);
                if (!eventsByTripId[eventTripId]) {
                  eventsByTripId[eventTripId] = [];
                }
                eventsByTripId[eventTripId].push(event);
              } else {
                // Log or handle events without a tripId if they are expected
                console.warn(`Event ${doc.id} found without a tripId. It will not be displayed in trip-grouped calendar.`);
              }
            });

            // Fetch trip names for unique tripIds
            const currentTripNames: { [key: string]: string } = {};
            const tripIdsToFetch: string[] = [];

            Array.from(uniqueTripIds).forEach(id => {
              if (tripNameCache[id]) {
                currentTripNames[id] = tripNameCache[id];
              } else {
                tripIdsToFetch.push(id);
              }
            });

            // Fetch missing trip names in batches
            if (tripIdsToFetch.length > 0) {
              for (let i = 0; i < tripIdsToFetch.length; i += 10) {
                const batchIds = tripIdsToFetch.slice(i, i + 10);
                const tripNameSnapshot = await firestore()
                  .collection('trips')
                  .where(firestore.FieldPath.documentId(), 'in', batchIds)
                  .get();

                tripNameSnapshot.forEach(doc => {
                  const data = doc.data();
                  const name = data.tripName || 'Untitled Trip';
                  currentTripNames[doc.id] = name;
                  tripNameCache[doc.id] = name; // Cache the name
                });
              }
            }

            // Organize into final display structure
            const organizedData: TripDisplay[] = Array.from(uniqueTripIds)
              .map(tripId => ({
                tripId: tripId,
                tripName: currentTripNames[tripId] || 'Unknown Trip',
                events: eventsByTripId[tripId] || [], // Should not be empty based on logic above
              }))
              .sort((a, b) => a.tripName.localeCompare(b.tripName)); // Sort trips alphabetically

            setEventsByTrip(organizedData);
            setLoading(false);
          },
          error => {
            console.error('Error fetching events or trip names:', error);
            setEventsByTrip([]);
            setLoading(false);
          }
        );

      return () => unsubscribeEvents();
    };

    fetchAndOrganizeEvents();
  }, []); // Depend on nothing as the listener handles updates

  const markedDates = useMemo(() => {
    const marked: { [date: string]: any } = {};
    eventsByTrip.forEach(trip => {
      trip.events.forEach(event => {
        if (event.date) {
          marked[event.date] = { marked: true, dotColor: '#305cde' };
        }
      });
    });
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: '#305cde',
      selectedTextColor: '#fff',
    };
    return marked;
  }, [eventsByTrip, selectedDate]);

  const organizedEventsForSelectedDate = useMemo(() => {
    return eventsByTrip
      .map(trip => ({
        tripId: trip.tripId,
        tripName: trip.tripName,
        events: trip.events
          .filter(event => event.date === selectedDate)
          .sort((a, b) => a.time.localeCompare(b.time)), // Sort events within a trip by time
      }))
      .filter(trip => trip.events.length > 0) // Only show trips that have events on the selected date
      .sort((a, b) => a.tripName.localeCompare(b.tripName)); // Sort trips by name
  }, [eventsByTrip, selectedDate]);

  const EventListItem = React.memo(
    ({ event, onPress }: { event: Event; onPress: (e: Event) => void }) => (
      <TouchableOpacity
        style={styles.eventItem}
        onPress={() => onPress(event)}
        accessibilityRole="button"
        accessibilityLabel={`Event: ${event.title}, at ${event.time}`}
      >
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventTime}>{event.time}</Text>
      </TouchableOpacity>
    )
  );

  const handleEventPress = useCallback(
    (event: Event) => {
      // tripId is now guaranteed on Event interface for new events,
      // and expected to be present for any event fetched/displayed.
      if (event.id && event.tripId) {
        router.push({
          pathname: '/event-view',
          params: { eventId: event.id, tripId: event.tripId },
        });
      } else {
        console.warn(
          'Cannot navigate to EventView: Event ID or Trip ID is missing (this should not happen with new events).',
          event
        );
      }
    },
    [router]
  );

  const renderTripSection = ({ item }: { item: TripDisplay }) => (
    <View style={styles.tripSection}>
      <Text style={styles.tripHeader}>{item.tripName}</Text>
      <FlatList
        data={item.events}
        keyExtractor={eventItem => eventItem.id}
        renderItem={({ item: eventItem }) => (
          <EventListItem event={eventItem} onPress={handleEventPress} />
        )}
        scrollEnabled={false} // Prevents nested scrolling issues
        ListEmptyComponent={
          <Text style={styles.noEvents}>No events for this trip on this day.</Text>
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        markedDates={markedDates}
        onDayPress={day => setSelectedDate(day.dateString)}
        theme={{
          calendarBackground: '#1e1e1e',
          dayTextColor: '#fff',
          monthTextColor: '#fff',
          arrowColor: '#305cde',
          todayTextColor: '#305cde',
        }}
        accessibilityLabel="Calendar view"
        accessibilityRole="adjustable"
      />
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          Events for{' '}
          {new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }).format(new Date(selectedDate))}
        </Text>
        {loading ? (
          <ActivityIndicator color="#305cde" style={{ marginTop: 32 }} />
        ) : organizedEventsForSelectedDate.length === 0 ? (
          <Text style={styles.noEvents} accessibilityLabel="No events for this day.">
            No events for this day.
          </Text>
        ) : (
          <FlatList
            data={organizedEventsForSelectedDate}
            keyExtractor={item => item.tripId}
            renderItem={renderTripSection}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={7}
            ListEmptyComponent={<Text style={styles.noEvents}>No events for this day.</Text>}
            accessibilityLabel="Event list"
            accessibilityRole="list"
          />
        )}
      </View>
    </View>
  );
}