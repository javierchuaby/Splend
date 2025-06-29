import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const MOCK_EVENTS = [
  { id: '1', title: 'Meeting with Sponge', date: '2025-06-22', time: '10:00 AM' },
  { id: '2', title: 'Lunch with Patrick', date: '2025-06-22', time: '1:00 PM' },
  { id: '3', title: 'Play with Squid', date: '2025-06-23', time: '3:00 PM' },
  { id: '4', title: 'Eat at Krabbs', date: '2025-06-24', time: '6:00 PM' },
];

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const eventsForSelectedDate = MOCK_EVENTS.filter(event => event.date === selectedDate);

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#305cde',
      selectedTextColor: '#fff',
    },
  };

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#1e1e1e',
          calendarBackground: '#1e1e1e',
          dayTextColor: '#fff',
          monthTextColor: '#fff',
          arrowColor: '#305cde',
          textDayFontSize: 22,
          textMonthFontSize: 24,
          textDayHeaderFontSize: 18,
        }}
        markedDates={markedDates}
        onDayPress={day => setSelectedDate(day.dateString)}
      />

      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          Events for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        {eventsForSelectedDate.length === 0 ? (
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