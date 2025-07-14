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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#121212',
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
  placeholder: {
    width: 50,
  },
  addButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  packingCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  packingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lastPackingItem: {
    borderBottomWidth: 0,
  },
  packingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxChecked: {
    backgroundColor: '#0a84ff',
    borderColor: '#0a84ff',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  checkedByText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalAdd: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  modalContent: {
    padding: 20,
  },
  textInput: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
});