import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import styles from '../../styles/trip-packing-list.styles';

interface TripPackingItem {
  id: string;
  name: string;
  isChecked: boolean;
  checkedBy?: string;
  checkedByName?: string;
  createdBy: string;
  createdAt: Date;
}

export default function ConcludedTripPackingListScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();
  const resolvedTripId = Array.isArray(tripId) ? tripId[0] : tripId;

  const [packingItems, setPackingItems] = useState<TripPackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnims, setFadeAnims] = useState<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    if (!resolvedTripId) return;
    const unsubscribe = firestore()
      .collection('trips')
      .doc(resolvedTripId)
      .onSnapshot(doc => {
        const data = doc.data();
        if (data) {
          const sortedItems = (data.packingListItems || [])
            .sort((a: TripPackingItem, b: TripPackingItem) => a.name.localeCompare(b.name))
            .sort((a: TripPackingItem, b: TripPackingItem) => Number(a.isChecked) - Number(b.isChecked));
          const newAnims: { [key: string]: Animated.Value } = {};
          sortedItems.forEach((item: TripPackingItem) => {
            newAnims[item.id] = new Animated.Value(1);
          });
          setFadeAnims(newAnims);
          setPackingItems(sortedItems);
        }
        setIsLoading(false);
      });
    return unsubscribe;
  }, [resolvedTripId]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Trip</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Packing List</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading packing list...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} >
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Packing List</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.packingCard}>
              {packingItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="inventory-2" size={48} color="#666" />
                  <Text style={styles.emptyStateText}>No items in your packing list</Text>
                </View>
              ) : (
                packingItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.packingItem,
                      index === packingItems.length - 1 && styles.lastPackingItem,
                      { opacity: fadeAnims[item.id] }
                    ]}
                  >
                    <View style={styles.packingItemContent}>
                      <View style={styles.checkboxContainer}>
                        <View style={[
                          styles.customCheckbox,
                          item.isChecked && styles.customCheckboxChecked
                        ]}>
                          {item.isChecked && (
                            <MaterialIcons
                              name="check"
                              size={16}
                              color="#fff"
                            />
                          )}
                        </View>
                      </View>
                      <View style={styles.itemTextContainer}>
                        <Text style={[
                          styles.itemText,
                          item.isChecked && styles.itemTextChecked
                        ]}>
                          {item.name}
                        </Text>
                        {item.isChecked && item.checkedByName && (
                          <Text style={styles.checkedByText}>
                            Checked by {item.checkedByName}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}