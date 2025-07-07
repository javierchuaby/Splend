import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  [key: string]: any;
}

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
        for (let i = 0; i < uids.length; i += 10) {
          const batch = uids.slice(i, i + 10);
          const querySnapshot = await firestore()
            .collection('users')
            .where(firestore.FieldPath.documentId(), 'in', batch)
            .get();
          querySnapshot.forEach(doc => {
            const data = doc.data();
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

  const buildMarkedDates = () => {
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
  };

  const eventsForSelectedDate = events.filter(event => event.date === selectedDate);
  const markedDates = buildMarkedDates();

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

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
      />
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          Events for{' '}
          {new Date(selectedDate).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        {loading ? (
          <ActivityIndicator color="#305cde" style={{ marginTop: 32 }} />
        ) : eventsForSelectedDate.length === 0 ? (
          <Text style={styles.noEvents}>No events for this day.</Text>
        ) : (
          <FlatList
            data={eventsForSelectedDate}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventItem}
                onPress={() => handleEventPress(item)}
              >
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                  {item.time}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <Text style={styles.modalLabel}>Date:</Text>
              <Text style={styles.modalValue}>
                {selectedEvent?.date
                  ? new Date(selectedEvent.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
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
                {participantNames.length > 0 && (
                  <>
                    <Text style={styles.modalLabel}>Participants:</Text>
                    <Text style={styles.modalValue}>
                      {participantNames.join('\n')}
                    </Text>
                  </>
                )}
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 400,
    height: 350,
    marginTop: 50,
  },
  eventsSection: {
    width: 400,
    flex: 1,
    padding: 16,
  },
  eventsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noEvents: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  eventItem: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  eventTime: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 340,
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 24,
    alignItems: 'flex-start',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalLabel: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
  modalValue: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#305cde',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});