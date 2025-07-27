import { MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
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

export default function TripPackingListScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();
  const resolvedTripId = Array.isArray(tripId) ? tripId[0] : tripId;

  const [packingItems, setPackingItems] = useState<TripPackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [fadeAnims, setFadeAnims] = useState<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    if (!resolvedTripId) return;

    const unsubscribe = firestore()
      .collection('trips')
      .doc(resolvedTripId)
      .onSnapshot(
        doc => {
          const data = doc.data();
          if (data) {
            const sortedItems = (data.packingListItems || [])
              .sort((a: TripPackingItem, b: TripPackingItem) => a.name.localeCompare(b.name))
              .sort((a: TripPackingItem, b: TripPackingItem) => Number(a.isChecked) - Number(b.isChecked));

            const newAnims: { [key: string]: Animated.Value } = {};
            sortedItems.forEach((item: TripPackingItem) => {
              newAnims[item.id] = new Animated.Value(0);
            });

            setFadeAnims(newAnims);
            setPackingItems(sortedItems);

            sortedItems.forEach((item: TripPackingItem) => {
              Animated.spring(newAnims[item.id], {
                toValue: 1,
                useNativeDriver: true,
                stiffness: 120,
                damping: 14,
                mass: 0.9,
              }).start();
            });
          }
          setIsLoading(false);
        },
        error => {
          Alert.alert('Error', 'Failed to load packing list');
          setIsLoading(false);
        }
      );

    return unsubscribe;
  }, [resolvedTripId]);

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const item: Partial<TripPackingItem> = {
      id: Math.random().toString(36).substring(2, 9),
      name: newItemText.trim(),
      isChecked: false,
      createdBy: currentUser.uid,
      createdAt: new Date(),
    };

    const cleanedItem = Object.fromEntries(
      Object.entries(item).filter(([, value]) => value !== undefined)
    );

    await firestore()
      .collection('trips')
      .doc(resolvedTripId)
      .update({
        packingListItems: firestore.FieldValue.arrayUnion(cleanedItem),
      });

    setNewItemText('');
    setModalVisible(false);
  };

  const handleToggleItem = async (item: TripPackingItem) => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
    const displayName = userDoc.exists() ? userDoc.data()?.displayName : '';

    const tripRef = firestore().collection('trips').doc(resolvedTripId);

    await firestore().runTransaction(async transaction => {
      const tripDoc = await transaction.get(tripRef);
      const tripData = tripDoc.data();
      if (!tripData) return;

      const updatedItems = (tripData.packingListItems || []).map((i: TripPackingItem) => {
        if (i.id !== item.id) return i;

        const updatedItem: any = {
          ...i,
          isChecked: !i.isChecked,
        };

        if (!i.isChecked) {
          updatedItem.checkedBy = currentUser.uid;
          updatedItem.checkedByName = displayName;
        } else {
          delete updatedItem.checkedBy;
          delete updatedItem.checkedByName;
        }

        return updatedItem;
      });

      transaction.update(tripRef, { packingListItems: updatedItems });
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/trip-info',
                  params: { tripId: resolvedTripId }
                });
              }}
            >
              <Text style={styles.backButton}>← Back</Text>
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
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.packingCard}>
              {packingItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="inventory-2" size={48} color="#666" />
                  <Text style={styles.emptyStateText}>No items in your packing list</Text>
                  <Text style={styles.emptyStateSubtext}>Tap "Add" to get started</Text>
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
                    <TouchableOpacity
                      style={styles.packingItemContent}
                      onPress={() => handleToggleItem(item)}
                      activeOpacity={0.7}
                    >
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
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Item</Text>
              <TouchableOpacity onPress={handleAddItem}>
                <Text style={styles.modalAdd}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter item name..."
                placeholderTextColor="#666"
                value={newItemText}
                onChangeText={setNewItemText}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddItem}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}