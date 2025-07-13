import { MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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
            setPackingItems(sortedItems);
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
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading packing list...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerCustom}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Packing List</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listWrapper}>
          <View style={styles.card}>
            {packingItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.listRowNoBorder}
                onPress={() => handleToggleItem(item)}
              >
                <MaterialIcons
                  name={item.isChecked ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={item.isChecked ? '#0a84ff' : '#777'}
                  style={styles.leftIcon}
                />
                <View style={styles.itemTextContainer}>
                  <Text style={[styles.cardText, item.isChecked && styles.cardTextChecked]}>
                    {item.name}
                  </Text>
                  {item.isChecked && item.checkedByName && (
                    <Text style={styles.cardTextSub}>Checked by {item.checkedByName}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Modal visible={modalVisible} animationType="slide">
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
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Enter item name"
                placeholderTextColor="#777"
                style={styles.textInput}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '500',
  },
  listWrapper: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 10,
  },
  listRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    color: '#fff',
  },
  cardTextChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  cardTextSub: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalAdd: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  modalContent: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
});