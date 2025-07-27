import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
interface UserProfile {
  uid: string;
  displayName?: string;
  username?: string;
  email?: string;
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
  [key: string]: any;
}

const userCache: Record<string, UserProfile> = {};

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantNames, setParticipantNames] = useState<string[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      if (!selectedEvent?.participants || selectedEvent.participants.length === 0) {
        setParticipantNames([]);
        return;
      }
      try {
        const uids = selectedEvent.participants;
        const names: string[] = [];
        const uncached: string[] = [];
        uids.forEach(uid => {
          if (userCache[uid]) {
            names.push(userCache[uid].displayName || userCache[uid].username || userCache[uid].uid);
          } else {
            uncached.push(uid);
          }
        });
        for (let i = 0; i < uncached.length; i += 10) {
          const batch = uncached.slice(i, i + 10);
          const querySnapshot = await firestore()
            .collection('users')
            .where(firestore.FieldPath.documentId(), 'in', batch)
            .get();
          querySnapshot.forEach(doc => {
            const data = doc.data();
            userCache[doc.id] = { uid: doc.id, ...data };
            names.push(data.displayName || data.username || doc.id);
          });
        }
        names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        setParticipantNames(names);
      } catch (err) {
        setParticipantNames(selectedEvent.participants);
      }
    };
    if (selectedEvent && modalVisible) {
      fetchNames();
    }
  }, [selectedEvent, modalVisible]);

  useEffect(() => {
    const fetchEvents = async () => {
      const user = auth().currentUser;
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }
      const unsubscribe = firestore()
        .collection('events')
        .where('memberIds', 'array-contains', user.uid)
        .onSnapshot(
          snapshot => {
            const fetchedEvents: Event[] = snapshot.docs.map(doc => {
              const data = doc.data();
              let date = '';
              let time = '';
              let start = data.startDateTime;

              if (start && typeof start === 'object' && typeof start.toDate === 'function') {
                const jsDate = start.toDate();
                date = jsDate.toISOString().slice(0, 10); // YYYY-MM-DD
                time = jsDate.toTimeString().slice(0, 5); // HH:MM
              }

              else if (typeof start === 'string') {
                const match = start.match(/^(\d{1,2}) (\w+) (\d{4}) at (\d{2}):(\d{2})/);
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
                  const month = (monthNames.indexOf(monthStr) + 1).toString().padStart(2, '0');
                  date = `${year}-${month}-${day}`;
                  time = `${hour}:${minute}`;
                }
              }

              return {
                id: doc.id,
                title: data.eventName || '(No Title)',
                date,
                time,
                participants: data.memberIds || [],
                ...data,
              };
            });
            setEvents(fetchedEvents);
            setLoading(false);
          },
          error => {
            console.error('Error fetching events:', error);
            setEvents([]);
            setLoading(false);
          }
        );

      return () => unsubscribe();
    };

    fetchEvents();
  }, []);


  const markedDates = useMemo(() => {
    const marked: { [date: string]: any } = {};
    events.forEach(event => {
      if (event.date) {
        marked[event.date] = { marked: true, dotColor: '#305cde' };
      }
    });
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: '#305cde',
      selectedTextColor: '#fff',
    };
    return marked;
  }, [events, selectedDate]);

  const eventsForSelectedDate = useMemo(
    () => events.filter(event => event.date === selectedDate),
    [events, selectedDate]
  );


  const EventListItem = React.memo(({ event, onPress }: { event: Event; onPress: (e: Event) => void }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => onPress(event)}
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event.title}, at ${event.time}`}
    >
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventTime}>{event.time}</Text>
    </TouchableOpacity>
  ));

  const handleEventPress = useCallback((event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  }, []);


  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedEvent(null);
  }, []);

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
        ) : eventsForSelectedDate.length === 0 ? (
          <Text style={styles.noEvents} accessibilityLabel="No events for this day.">
            No events for this day.
          </Text>
        ) : (
          <FlatList
            data={eventsForSelectedDate}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <EventListItem event={item} onPress={handleEventPress} />
            )}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={7}
            ListEmptyComponent={<Text style={styles.noEvents}>No events for this day.</Text>}
            accessibilityLabel="Event list"
            accessibilityRole="list"
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseModal} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent} accessible accessibilityLabel="Event details modal">
                <ScrollView>
                  <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
                  <Text style={styles.modalLabel}>Date:</Text>
                  <Text style={styles.modalValue}>
                    {selectedEvent?.date
                      ? new Intl.DateTimeFormat(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(selectedEvent.date))
                      : ''}
                  </Text>
                  <Text style={styles.modalLabel}>Time:</Text>
                  <Text style={styles.modalValue}>{selectedEvent?.time}</Text>
                  {selectedEvent?.eventLocation && (
                    <>
                      <Text style={styles.modalLabel}>Location:</Text>
                      <Text style={styles.modalValue}>
                        {Array.isArray(selectedEvent.eventLocation)
                          ? selectedEvent.eventLocation.join(', ')
                          : typeof selectedEvent.eventLocation === 'object'
                          ? JSON.stringify(selectedEvent.eventLocation)
                          : String(selectedEvent.eventLocation)}
                      </Text>
                    </>
                  )}
                  <Text style={styles.modalLabel}>Participants:</Text>
                  {participantNames.length > 0 ? (
                    <Text style={styles.modalValue} accessibilityLabel="Participant list">
                      {participantNames.join('\n')}
                    </Text>
                  ) : (
                    <Text style={styles.noEvents} accessibilityLabel="No participants for this event.">
                      No participants for this event.
                    </Text>
                  )}
                  {selectedEvent?.description && (
                    <>
                      <Text style={styles.modalLabel}>Description:</Text>
                      <Text style={styles.modalValue}>{selectedEvent.description}</Text>
                    </>
                  )}
                  {selectedEvent?.organizerId && (
                    <>
                      <Text style={styles.modalLabel}>Organizer:</Text>
                      <Text style={styles.modalValue}>{selectedEvent.organizerId}</Text>
                    </>
                  )}
                </ScrollView>
                <Pressable style={styles.closeButton} onPress={handleCloseModal} accessibilityRole="button" accessibilityLabel="Close event details">
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}