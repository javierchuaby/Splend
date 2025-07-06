import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
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

  useEffect(() => {
    const fetchEvents = async () => {
      const user = auth().currentUser;
      console.log('Current user UID:', user?.uid);
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

              // Firestore Timestamp
              if (start && typeof start === 'object' && typeof start.toDate === 'function') {
                const jsDate = start.toDate();
                date = jsDate.toISOString().slice(0, 10); // YYYY-MM-DD
                time = jsDate.toTimeString().slice(0, 5); // HH:MM
              }
              // String format: "6 July 2025 at 16:54:17 UTC+8"
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
            console.log('Fetched events:', fetchedEvents);
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
              <View style={styles.eventItem}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>{item.time}</Text>
              </View>
            )}
          />
        )}
      </View>
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
});