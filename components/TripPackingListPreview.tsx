import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PackingListItem {
  id: string;
  name: string;
  isChecked: boolean;
}

export default function TripPackingListPreview() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [items, setItems] = useState<PackingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tripId || typeof tripId !== 'string') return;

    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId)
      .onSnapshot(
        doc => {
          const data = doc.data();
          if (data) {
            setItems(data.packingListItems || []);
          }
          setIsLoading(false);
        },
        error => {
          Alert.alert('Error', 'Failed to load packing list');
          setIsLoading(false);
        }
      );

    return unsubscribe;
  }, [tripId]);

  if (isLoading) {
    return <ActivityIndicator style={{ paddingVertical: 10 }} />;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/trip-packing-list?tripId=${tripId}`)}>
      <View style={styles.itemRow}>
        {items.slice(0, 2).map((item, idx) => (
          <Text key={item.id} style={styles.itemText}>
            {item.name}{idx === 0 && items.length > 1 ? ', ' : ''}
          </Text>
        ))}
        {items.length > 2 && <Text style={styles.itemText}>+{items.length - 2} more</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#888" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  itemText: {
    color: '#aaa',
    fontSize: 14,
    marginRight: 4,
  },
});