import AsyncStorage from '@react-native-async-storage/async-storage'; // NEW: Import AsyncStorage
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios'; // Import Axios for HTTP requests
import * as ImagePicker from 'expo-image-picker'; // Import Expo Image Picker
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// IMPORTANT: Replace with your backend server URL
// const BACKEND_URL = 'http://172.20.10.13:3000'; // Or your machine's IP if testing on a real device

interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

interface Event {
  id: string;
  name: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  memberIds: string[];
  billIds: string[];
}

interface BillItem {
  billItemName: string;
  billItemPrice: number;
  billItemUserIds: string[];
  costPerUser: number;
}

interface WhoPaidEntry {
  uid: string;
  amountPaid: number;
}

interface Bill {
  id: string;
  billName: string;
  billEvent: string;
  billDateTime: Date;
  billUserIds: string[];
  billItems: BillItem[];
  whoPaid: WhoPaidEntry[];
}

interface MonthOption {
  label: string;
  value: number;
}

// Interface for AI parsed item
interface AIParsedItem {
  name: string;
  price: number | string;
}

const STORAGE_KEY_BACKEND_URL = 'backend_url'; // NEW: AsyncStorage key

export default function EventViewScreen() {
  const router = useRouter();
  const { eventId, tripId } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [eventMembers, setEventMembers] = useState<TripMember[]>([]);
  const [isManageEventModalVisible, setIsManageEventModalVisible] =
    useState(false);

  const [isNewBillModalVisible, setIsNewBillModalVisible] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillDateTime, setNewBillDateTime] = useState(new Date());
  const [showBillDateTimePicker, setShowBillDateTimePicker] = useState(false);
  const [tempBillDateTime, setTempBillDateTime] = useState(new Date());

  interface NewBillItemInput {
    name: string;
    price: string;
    selectedUsers: TripMember[];
    userSearchQuery: string;
    searchResults: TripMember[];
  }

  const [newBillItems, setNewBillItems] = useState<NewBillItemInput[]>([]);
  const [newWhoPaid, setNewWhoPaid] = useState<
    { member: TripMember | null; amount: string; search: string; results: TripMember[] }[]
  >([]);

  // State for receipt scanning
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // NEW: State for dynamic backend URL and its input modal
  const [backendUrl, setBackendUrl] = useState<string>('http://172.20.10.13:3000'); // Default or initial value
  const [isIpInputModalVisible, setIsIpInputModalVisible] = useState(false);
  const [tempBackendUrl, setTempBackendUrl] = useState(backendUrl); // For input field

  // NEW: Effect to load backend URL from AsyncStorage
  useEffect(() => {
    const loadBackendUrl = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_BACKEND_URL);
        if (storedUrl) {
          setBackendUrl(storedUrl);
          setTempBackendUrl(storedUrl); // Keep temp in sync
          console.log('Loaded backend URL from storage:', storedUrl);
        } else {
            console.log('No backend URL found in storage, using default:', backendUrl);
        }
      } catch (e) {
        console.error('Failed to load backend URL from storage:', e);
      }
    };
    loadBackendUrl();
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: user.uid,
            username: userData?.username,
            displayName: userData?.displayName,
            billIds: userData?.billIds,
            totalSpent: userData?.totalSpent,
            totalPaid: userData?.totalPaid,
          });
        }
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!eventId || !currentUser) {
      setIsLoading(true);
      return;
    }

    const unsubscribe = firestore()
      .collection('events')
      .doc(eventId as string)
      .onSnapshot(
        async doc => {
          if (doc.exists()) {
            const data = doc.data();
            const currentEvent: Event = {
              id: doc.id,
              name: data!.eventName,
              location: data!.eventLocation,
              startDateTime: data!.startDateTime.toDate(),
              endDateTime: data!.endDateTime.toDate(),
              memberIds: data!.memberIds || [],
              billIds: data!.billIds || [],
            };
            setEvent(currentEvent);

            const isMember = currentEvent.memberIds.some(
              memberId => memberId === currentUser.id
            );
            setHasAccess(isMember);

            const membersData: TripMember[] = [];
            if (currentEvent.memberIds.length > 0) {
              const membersSnapshot = await firestore()
                .collection('users')
                .where(firestore.FieldPath.documentId(), 'in', currentEvent.memberIds)
                .get();
              membersSnapshot.forEach(memberDoc => {
                const userData = memberDoc.data();
                membersData.push({
                  id: memberDoc.id,
                  username: userData.username,
                  displayName: userData.displayName,
                  billIds: userData.billIds || [],
                  totalSpent: userData.totalSpent || 0,
                  totalPaid: userData.totalPaid || 0,
                });
              });
            }
            setEventMembers(membersData);

            if (currentEvent.billIds && currentEvent.billIds.length > 0) {
              const billsSnapshot = await firestore()
                .collection('bills')
                .where(firestore.FieldPath.documentId(), 'in', currentEvent.billIds)
                .get();
              const fetchedBills: Bill[] = billsSnapshot.docs.map(billDoc => {
                const billData = billDoc.data();
                return {
                  id: billDoc.id,
                  billName: billData.billName,
                  billEvent: billData.billEvent,
                  billDateTime: billData.billDateTime.toDate(),
                  billUserIds: billData.billUserIds,
                  billItems: billData.billItems,
                  whoPaid: billData.whoPaid,
                };
              });
              setBills(fetchedBills);
            } else {
              setBills([]);
            }

            setIsLoading(false);
          } else {
            setEvent(null);
            setHasAccess(false);
            setBills([]);
            setIsLoading(false);
          }
        },
        error => {
          console.error('Error fetching event:', error);
          setEvent(null);
          setHasAccess(false);
          setBills([]);
          setIsLoading(false);
        }
      );
    return unsubscribe;
  }, [eventId, currentUser]);

  const saveEvent = async (updatedFields: Partial<Event>) => {
    if (!event) return;

    const firestoreUpdate: { [key: string]: any } = {};
    if (updatedFields.startDateTime) {
      firestoreUpdate.startDateTime = firestore.Timestamp.fromDate(
        updatedFields.startDateTime
      );
    }
    if (updatedFields.endDateTime) {
      firestoreUpdate.endDateTime = firestore.Timestamp.fromDate(
        updatedFields.endDateTime
      );
    }
    if (updatedFields.name) {
      firestoreUpdate.eventName = updatedFields.name;
    }
    if (updatedFields.location !== undefined) {
      firestoreUpdate.eventLocation = updatedFields.location;
    }
    if (updatedFields.memberIds) {
      firestoreUpdate.memberIds = updatedFields.memberIds;
    }

    try {
      await firestore()
        .collection('events')
        .doc(event.id)
        .update(firestoreUpdate);
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
      console.error(error);
    }
  };

  const deleteEvent = async () => {
    if (!event || !tripId) return;
    setIsManageEventModalVisible(false);
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('events').doc(event.id).delete();
              await firestore()
                .collection('trips')
                .doc(tripId as string)
                .update({
                  eventIds: firestore.FieldValue.arrayRemove(event.id),
                });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return '1 day';
    } else {
      return `${diffDays + 1} days`;
    }
  };

  const navigateToMembers = () => {
    router.push({
      pathname: '/event-members',
      params: { eventId: event?.id, tripId: tripId },
    });
  };

  const navigateToBillView = (bill: Bill) => {
    router.push({
      pathname: '/bill-view',
      params: { billId: bill.id, eventId: eventId, tripId: tripId },
    });
  };

  const generateDateOptions = (): {
    years: number[];
    months: MonthOption[];
    days: number[];
    hours: number[];
    minutes: number[];
  } => {
    const today = new Date();
    const years: number[] = [];
    const months: MonthOption[] = [];
    const days: number[] = [];
    const hours: number[] = [];
    const minutes: number[] = [];

    for (let i = 0; i < 6; i++) {
      years.push(today.getFullYear() + i);
    }
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December',
    ];
    monthNames.forEach((month, index) => {
      months.push({ label: month, value: index });
    });
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    for (let i = 0; i < 60; i += 5) {
      minutes.push(i);
    }
    return { years, months, days, hours, minutes };
  };

  const { years, months, days, hours, minutes } = generateDateOptions();

  const handleStartDateDone = async () => {
    if (!event) return;
    if (tempStartDate > event.endDateTime) {
      Alert.alert('Error', 'Start date cannot be after the end date');
      return;
    }
    await saveEvent({ startDateTime: tempStartDate });
    setShowStartDatePicker(false);
  };

  const handleEndDateDone = async () => {
    if (!event) return;
    if (tempEndDate < event.startDateTime) {
      Alert.alert('Error', 'End date cannot be before the start date');
      return;
    }
    await saveEvent({ endDateTime: tempEndDate });
    setShowEndDatePicker(false);
  };

  const addBillItem = () => {
    setNewBillItems([
      ...newBillItems,
      {
        name: '',
        price: '',
        selectedUsers: [],
        userSearchQuery: '',
        searchResults: [],
      },
    ]);
  };

  const removeBillItem = (index: number) => {
    const updatedItems = [...newBillItems];
    updatedItems.splice(index, 1);
    setNewBillItems(updatedItems);
  };

  const updateBillItem = (index: number, field: keyof NewBillItemInput, value: any) => {
    const updatedItems = [...newBillItems];
    if (field === 'price') {
      updatedItems[index][field] = value.replace(/[^0-9.]/g, '');
    } else {
      updatedItems[index][field] = value;
    }

    if (field === 'userSearchQuery') {
      const query = (value as string).toLowerCase();
      const filtered = eventMembers.filter(
        member =>
          !updatedItems[index].selectedUsers.some(su => su.id === member.id) &&
          (member.username.toLowerCase().includes(query) ||
            member.displayName.toLowerCase().includes(query))
      );
      updatedItems[index].searchResults = filtered;
    }
    setNewBillItems(updatedItems);
  };

  const addBillItemUser = (itemIndex: number, user: TripMember) => {
    const updatedItems = [...newBillItems];
    if (!updatedItems[itemIndex].selectedUsers.some(su => su.id === user.id)) {
      updatedItems[itemIndex].selectedUsers.push(user);
      updatedItems[itemIndex].userSearchQuery = '';
      updatedItems[itemIndex].searchResults = [];
    }
    setNewBillItems(updatedItems);
  };

  const removeBillItemUser = (itemIndex: number, userId: string) => {
    const updatedItems = [...newBillItems];
    updatedItems[itemIndex].selectedUsers = updatedItems[itemIndex].selectedUsers.filter(
      user => user.id !== userId
    );
    setNewBillItems(updatedItems);
  };

  const addWhoPaidEntry = () => {
    setNewWhoPaid([
      ...newWhoPaid,
      { member: null, amount: '', search: '', results: [] },
    ]);
  };

  const removeWhoPaidEntry = (index: number) => {
    const updatedWhoPaid = [...newWhoPaid];
    updatedWhoPaid.splice(index, 1);
    setNewWhoPaid(updatedWhoPaid);
  };

  const updateWhoPaidEntry = (
    index: number,
    field: 'member' | 'amount' | 'search' | 'results',
    value: any
  ) => {
    const updatedWhoPaid = [...newWhoPaid];
    if (field === 'amount') {
      updatedWhoPaid[index][field] = value.replace(/[^0-9.]/g, '');
    } else {
      updatedWhoPaid[index][field] = value;
    }

    if (field === 'search') {
      const query = (value as string).toLowerCase();
      const filtered = eventMembers.filter(
        member =>
          (updatedWhoPaid[index].member?.id !== member.id) &&
          (member.username.toLowerCase().includes(query) ||
            member.displayName.toLowerCase().includes(query))
      );
      updatedWhoPaid[index].results = filtered;
    } else if (field === 'member') {
      updatedWhoPaid[index].search = '';
      updatedWhoPaid[index].results = [];
    }
    setNewWhoPaid(updatedWhoPaid);
  };

  const handleCreateBill = async () => {
    if (!newBillName.trim()) {
      Alert.alert('Whoops!', 'Please enter a bill name.');
      return;
    }
    if (!event) {
      Alert.alert('Fatal Error', 'Event data not loaded.');
      return;
    }
    if (newBillItems.length === 0) {
      Alert.alert('Whoops!', 'Please add at least one bill item.');
      return;
    }
    if (newWhoPaid.length === 0) {
      Alert.alert('Whoops!', 'Please specify who paid for the bill.');
      return;
    }

    const billItemsToSave: BillItem[] = [];
    let totalBillAmount = 0;
    const memberSpentUpdates: { [key: string]: number } = {};

    for (const item of newBillItems) {
      const price = parseFloat(item.price);
      if (isNaN(price) || price <= 0) {
        Alert.alert('Whoops!', 'Please enter a valid price for all bill items.');
        return;
      }
      if (item.selectedUsers.length === 0) {
        Alert.alert('Whoops!', `Please select users for item "${item.name}".`);
        return;
      }

      const costPerUser = price / item.selectedUsers.length;
      billItemsToSave.push({
        billItemName: item.name.trim(),
        billItemPrice: price,
        billItemUserIds: item.selectedUsers.map(user => user.id),
        costPerUser: parseFloat(costPerUser.toFixed(2)),
      });
      totalBillAmount += price;

      for (const user of item.selectedUsers) {
        memberSpentUpdates[user.id] = (memberSpentUpdates[user.id] || 0) + costPerUser;
      }
    }

    const whoPaidToSave: WhoPaidEntry[] = [];
    const memberPaidUpdates: { [key: string]: number } = {};
    let totalPaidSum = 0;

    for (const entry of newWhoPaid) {
      const amount = parseFloat(entry.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Whoops!', 'Please enter a valid amount paid for all entries.');
        return;
      }
      if (!entry.member) {
        Alert.alert('Whoops!', 'Please select a member for all "Who Paid" entries.');
        return;
      }
      whoPaidToSave.push({
        uid: entry.member.id,
        amountPaid: parseFloat(amount.toFixed(2)),
      });
      memberPaidUpdates[entry.member.id] = (memberPaidUpdates[entry.member.id] || 0) + amount;
      totalPaidSum += amount;
    }

    if (Math.abs(totalBillAmount - totalPaidSum) > 0.01) {
      Alert.alert(
        'Payment Mismatch',
        `Total bill amount (${totalBillAmount.toFixed(2)}) does not match total amount paid (${totalPaidSum.toFixed(2)}). Please adjust payments.`
      );
      return;
    }

    try {
      const billRef = await firestore().collection('bills').add({
        billName: newBillName.trim(),
        billEvent: event.id,
        billDateTime: firestore.Timestamp.fromDate(newBillDateTime),
        billUserIds: eventMembers.map(m => m.id),
        billItems: billItemsToSave,
        whoPaid: whoPaidToSave,
      });

      const batch = firestore().batch();

      const eventRef = firestore().collection('events').doc(event.id);
      batch.update(eventRef, {
        billIds: firestore.FieldValue.arrayUnion(billRef.id),
      });

      const tripRef = firestore().collection('trips').doc(tripId as string);
      const tripDoc = await tripRef.get();
      if (tripDoc.exists()) {
        const currentTripMembers = tripDoc.data()?.members || [];
        const updatedTripMembers = currentTripMembers.map((member: any) => {
          const newSpent = (member.totalSpent || 0) + (memberSpentUpdates[member.uid] || 0);
          const newPaid = (member.totalPaid || 0) + (memberPaidUpdates[member.uid] || 0);
          return {
            ...member,
            totalSpent: parseFloat(newSpent.toFixed(2)),
            totalPaid: parseFloat(newPaid.toFixed(2)),
          };
        });
        batch.update(tripRef, { members: updatedTripMembers });
      }

      await batch.commit();

      setNewBillName('');
      setNewBillDateTime(new Date());
      setNewBillItems([]);
      setNewWhoPaid([]);
      setIsNewBillModalVisible(false);

      Alert.alert('Success!', 'Bill created and member totals updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to create bill or update member totals.');
      console.error(error);
    }
  };

  const handleBillDateTimeDone = () => {
    setShowBillDateTimePicker(false);
    setNewBillDateTime(tempBillDateTime);
  };

  const renderBillItem = ({ item }: { item: Bill }) => (
    <TouchableOpacity style={styles.billCard} onPress={() => navigateToBillView(item)}>
      <Text style={styles.billCardName}>{item.billName}</Text>
      <Text style={styles.billCardDateTime}>{formatDateTime(item.billDateTime)}</Text>
      <View style={styles.billSummary}>
        <Text style={styles.billSummaryText}>Items: {item.billItems.length}</Text>
        <Text style={styles.billSummaryText}>Paid by: {item.whoPaid.length} person{item.whoPaid.length !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleEventViewBack = () => {
    router.push({
      pathname: '/trip-view',
      params: { tripId: tripId },
    });
  };

  // --- RECEIPT SCANNING FUNCTIONS ---

  const processImageForChatGPT = async (imageUri: string) => {
    setIsScanningReceipt(true);
    setScanError(null);
    try {
      // NEW: Use the dynamic backendUrl
      const response = await axios.post(`${backendUrl}/process-receipt`, {
        imageData: imageUri, // Already base64 with data URL header
      });

      const { items } = response.data; // Expecting { items: [{ name, price }] }

      if (items && Array.isArray(items)) {
        const parsedItems: NewBillItemInput[] = items.map((item: AIParsedItem) => ({
          name: item.name || '',
          price: typeof item.price === 'number' ? item.price.toFixed(2) : String(item.price || ''),
          selectedUsers: eventMembers.length > 0 && currentUser ? [currentUser] : [], // Default to current user if available
          userSearchQuery: '',
          searchResults: [],
        }));
        setNewBillItems(parsedItems);

        // Try to infer bill name from first few items
        if (items.length > 0 && !newBillName.trim()) {
            const billNames = items.slice(0, 3).map((item: AIParsedItem) => item.name);
            setNewBillName(`Receipt (${billNames.join(', ')})`);
        }
        setNewBillDateTime(new Date()); // Set bill date to now

        // Set who paid to current user by default with total amount
        const totalAmount = items.reduce((sum: number, item: AIParsedItem) => {
            const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
            return sum + (isNaN(price) ? 0 : price);
        }, 0);

        if (currentUser && totalAmount > 0) {
            setNewWhoPaid([
                {
                    member: currentUser,
                    amount: totalAmount.toFixed(2),
                    search: currentUser.displayName, // Pre-fill search with displayName
                    results: [],
                },
            ]);
        } else {
            setNewWhoPaid([]); // Clear if no current user or no items
        }

        Alert.alert('Scan Complete', 'Receipt items populated!');
      } else {
        setScanError('AI did not return expected item format.');
        Alert.alert('Scan Failed', 'Could not parse receipt from AI. Please try again or enter manually.');
      }
    } catch (err: any) {
      console.error('Error scanning receipt:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || err.message;
      setScanError(`Scan failed: ${errorMessage}`);
      Alert.alert('Scan Failed', `Failed to scan receipt: ${errorMessage}`);
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleScanReceipt = async (method: 'camera' | 'gallery') => {
    let result;
    setScanError(null);

    // Request permissions first
    if (method === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant camera access to scan receipts.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photo library access to scan receipts.');
        return;
      }
    }

    try {
      if (method === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          allowsEditing: true, // Allow user to crop/edit for better OCR
          aspect: [4, 3],
          quality: 0.7, // Reduce quality for faster upload, balance with OCR quality
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          // Construct data URL for OpenAI Vision API
          const base64Data = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
          processImageForChatGPT(base64Data);
        } else {
          setScanError('Could not get base64 data from image.');
        }
      }
    } catch (e: any) {
      console.error('Image picker error:', e);
      setScanError(`Image picker failed: ${e.message}`);
    }
  };

  // --- END RECEIPT SCANNING FUNCTIONS ---

  // NEW: Functions for backend URL management
  const handleSaveBackendUrl = async () => {
    if (!tempBackendUrl.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid URL.');
      return;
    }
    setBackendUrl(tempBackendUrl);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_BACKEND_URL, tempBackendUrl);
      Alert.alert('Success', 'Backend URL updated and saved.');
    } catch (e) {
      console.error('Failed to save backend URL:', e);
      Alert.alert('Error', 'Failed to save backend URL.');
    } finally {
      setIsIpInputModalVisible(false);
    }
  };

  const handleCancelBackendUrl = () => {
    setTempBackendUrl(backendUrl); // Revert to current backendUrl
    setIsIpInputModalVisible(false);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleEventViewBack}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a84ff" />
            <Text style={styles.loadingText}>Loading event...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!event || !hasAccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleEventViewBack}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Event not found or you don't have access.
            </Text>
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
          <TouchableOpacity onPress={handleEventViewBack}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsManageEventModalVisible(true)}>
            <Text style={styles.manageEventButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.eventTitle}>{event.name}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>{event.location}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setTempStartDate(new Date(event.startDateTime));
                    setShowStartDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    Start: {formatDateTime(event.startDateTime)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setTempEndDate(new Date(event.endDateTime));
                    setShowEndDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    End: {formatDateTime(event.endDateTime)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.durationSubtextContainer}>
                <Text style={styles.durationSubtext}>
                  {calculateDuration(event.startDateTime, event.endDateTime)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              <TouchableOpacity
                style={styles.membersCard}
                onPress={navigateToMembers}
              >
                <Text style={styles.membersCount}>
                  {eventMembers.length} member
                  {eventMembers.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.membersList}>
                  {eventMembers.slice(0, 2).map((member, index) => (
                    <Text key={member.id} style={styles.memberName}>
                      {member.displayName}
                      {index < Math.min(eventMembers.length - 1, 2) ? ', ' : ''}
                    </Text>
                  ))}
                  {eventMembers.length > 2 && (
                    <Text style={styles.memberName}>
                      +{eventMembers.length - 2} more
                    </Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bills</Text>
              {bills.length === 0 ? (
                <View style={styles.emptyStateBills}>
                  <Text style={styles.emptyStateBillsText}>No bills yet</Text>
                  <Text style={styles.emptyStateBillsSubtext}>
                    Add the first bill for this event!
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={bills}
                  renderItem={renderBillItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.billsList}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.createBillButton}
            onPress={() => {
              setIsNewBillModalVisible(true);
              setNewBillName('');
              setNewBillDateTime(new Date());
              setNewBillItems([]);
              setNewWhoPaid([]);
              setScanError(null); // Clear scan errors on modal open
            }}
          >
            <Text style={styles.createBillButtonText}>+ Create New Bill</Text>
          </TouchableOpacity>

          {/* NEW: Change Backend URL Button */}
          <TouchableOpacity
            style={[styles.createBillButton, { backgroundColor: '#333', marginTop: 10 }]} // Styling adjustment
            onPress={() => setIsIpInputModalVisible(true)}
          >
            <Text style={styles.createBillButtonText}>Change Backend URL</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isManageEventModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsManageEventModalVisible(false)}
        >
          <View style={styles.manageEventOverlay}>
            <View style={styles.manageEventContainer}>
              <View style={styles.manageEventHeader}>
                <TouchableOpacity
                  onPress={() => setIsManageEventModalVisible(false)}
                >
                  <Text style={styles.manageEventCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.manageEventTitle}>Manage Event</Text>
                <View style={styles.placeholder} />
              </View>
              <View style={styles.manageEventButtons}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={deleteEvent}
                >
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showStartDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select Start Date</Text>
                <TouchableOpacity onPress={handleStartDateDone}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerRow}>
                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getFullYear()}
                  onValueChange={value => {
                    const newDate = new Date(tempStartDate);
                    newDate.setFullYear(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {years.map(year => (
                    <Picker.Item
                      key={year}
                      label={year.toString()}
                      value={year}
                    />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getMonth()}
                  onValueChange={value => {
                    const newDate = new Date(tempStartDate);
                    newDate.setMonth(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {months.map(month => (
                    <Picker.Item
                      key={month.value}
                      label={month.label}
                      value={month.value}
                    />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getDate()}
                  onValueChange={value => {
                    const newDate = new Date(tempStartDate);
                    newDate.setDate(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {days.map(day => (
                    <Picker.Item
                      key={day}
                      label={day.toString()}
                      value={day}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEndDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select End Date</Text>
                <TouchableOpacity onPress={handleEndDateDone}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerRow}>
                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getFullYear()}
                  onValueChange={value => {
                    const newDate = new Date(tempEndDate);
                    newDate.setFullYear(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {years.map(year => (
                    <Picker.Item
                      key={year}
                      label={year.toString()}
                      value={year}
                    />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getMonth()}
                  onValueChange={value => {
                    const newDate = new Date(tempEndDate);
                    newDate.setMonth(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {months.map(month => (
                    <Picker.Item
                      key={month.value}
                      label={month.label}
                      value={month.value}
                    />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getDate()}
                  onValueChange={value => {
                    const newDate = new Date(tempEndDate);
                    newDate.setDate(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {days.map(day => (
                    <Picker.Item
                      key={day}
                      label={day.toString()}
                      value={day}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isNewBillModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsNewBillModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsNewBillModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Bill</Text>
              <TouchableOpacity onPress={handleCreateBill}>
                <Text style={styles.createButton}>Create</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView style={styles.modalContent}>
                {/* Scan Receipt Section */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Scan Receipt (Beta)</Text>
                    <View style={styles.scanButtonsContainer}>
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => handleScanReceipt('camera')}
                            disabled={isScanningReceipt}
                        >
                            <Text style={styles.scanButtonText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => handleScanReceipt('gallery')}
                            disabled={isScanningReceipt}
                        >
                            <Text style={styles.scanButtonText}>From Gallery</Text>
                        </TouchableOpacity>
                    </View>
                    {isScanningReceipt && (
                        <View style={styles.loadingScanContainer}>
                            <ActivityIndicator size="small" color="#0a84ff" />
                            <Text style={styles.loadingScanText}>Scanning...</Text>
                        </View>
                    )}
                    {scanError && <Text style={styles.scanErrorText}>{scanError}</Text>}
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Bill Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newBillName}
                    onChangeText={setNewBillName}
                    placeholder="Enter bill name"
                    placeholderTextColor="#777"
                    keyboardAppearance="dark"
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Date & Time</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setTempBillDateTime(newBillDateTime);
                      setShowBillDateTimePicker(true);
                    }}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDateTime(newBillDateTime)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Bill Items</Text>
                  {newBillItems.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.billItemContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={item.name}
                        onChangeText={text =>
                          updateBillItem(itemIndex, 'name', text)
                        }
                        placeholder="Item name"
                        placeholderTextColor="#777"
                        keyboardAppearance="dark"
                      />
                      <TextInput
                        style={[styles.textInput, { marginTop: 8 }]}
                        value={item.price}
                        onChangeText={text =>
                          updateBillItem(itemIndex, 'price', text)
                        }
                        placeholder="Price"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        keyboardAppearance="dark"
                      />

                      <Text style={styles.subLabel}>Who used this item?</Text>
                      <TextInput
                        style={styles.textInput}
                        value={item.userSearchQuery}
                        onChangeText={text =>
                          updateBillItem(itemIndex, 'userSearchQuery', text)
                        }
                        placeholder="Search event members"
                        placeholderTextColor="#777"
                        keyboardAppearance="dark"
                      />
                      {item.userSearchQuery.length > 0 && (
                        <View style={styles.searchResults}>
                          {item.searchResults.length > 0 ? (
                            item.searchResults.map(member => (
                              <TouchableOpacity
                                key={member.id}
                                style={styles.searchResultItem}
                                onPress={() => addBillItemUser(itemIndex, member)}
                              >
                                <Text style={styles.searchResultText}>
                                  <Text style={{ fontWeight: 'bold' }}>
                                    {member.displayName}
                                  </Text>{' '}
                                  <Text style={styles.usernameText}>
                                    @{member.username}
                                  </Text>
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noResultsText}>No members found</Text>
                          )}
                        </View>
                      )}

                      {item.selectedUsers.length > 0 && (
                        <View style={styles.selectedMembers}>
                          <Text style={styles.selectedMembersTitle}>
                            Selected:
                          </Text>
                          {item.selectedUsers.map(member => (
                            <View key={member.id} style={styles.selectedMemberItem}>
                              <Text style={styles.selectedMemberText}>
                                <Text style={{ fontWeight: 'bold' }}>
                                  {member.displayName}
                                </Text>
                                <Text style={styles.usernameText}>
                                  {' '}@
                                  {member.username}
                                </Text>
                              </Text>
                              <TouchableOpacity
                                onPress={() => removeBillItemUser(itemIndex, member.id)}
                              >
                                <Text style={styles.removeMemberButton}>remove</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={() => removeBillItem(itemIndex)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>Remove Item</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={addBillItem}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>+ Add Bill Item</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Who Paid?</Text>
                  {newWhoPaid.map((entry, index) => (
                    <View key={index} style={styles.whoPaidContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={entry.search}
                        onChangeText={text =>
                          updateWhoPaidEntry(index, 'search', text)
                        }
                        placeholder="Search event members (who paid)"
                        placeholderTextColor="#777"
                        keyboardAppearance="dark"
                      />
                      {entry.search.length > 0 && (
                        <View style={styles.searchResults}>
                          {entry.results.length > 0 ? (
                            entry.results.map(member => (
                              <TouchableOpacity
                                key={member.id}
                                style={styles.searchResultItem}
                                onPress={() => updateWhoPaidEntry(index, 'member', member)}
                              >
                                <Text style={styles.searchResultText}>
                                  <Text style={{ fontWeight: 'bold' }}>
                                    {member.displayName}
                                  </Text>{' '}
                                  <Text style={styles.usernameText}>
                                    @{member.username}
                                  </Text>
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noResultsText}>No members found</Text>
                          )}
                        </View>
                      )}
                      {entry.member && (
                        <View style={styles.selectedMemberItem}>
                          <Text style={styles.selectedMemberText}>
                            <Text style={{ fontWeight: 'bold' }}>
                              {entry.member.displayName}
                            </Text>
                            <Text style={styles.usernameText}>
                              {' '}@
                              {entry.member.username}
                            </Text>
                          </Text>
                          <TouchableOpacity onPress={() => updateWhoPaidEntry(index, 'member', null)}>
                            <Text style={styles.removeMemberButton}>change</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <TextInput
                        style={[styles.textInput, { marginTop: 8 }]}
                        value={entry.amount}
                        onChangeText={text =>
                          updateWhoPaidEntry(index, 'amount', text)
                        }
                        placeholder="Amount paid"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        keyboardAppearance="dark"
                      />
                      <TouchableOpacity
                        onPress={() => removeWhoPaidEntry(index)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>Remove Payer</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={addWhoPaidEntry}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>+ Add Payer</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>

            <Modal
              visible={showBillDateTimePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowBillDateTimePicker(false)}
            >
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowBillDateTimePicker(false)}
                    >
                      <Text style={styles.datePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select Date & Time</Text>
                    <TouchableOpacity onPress={handleBillDateTimeDone}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerRow}>
                    <Picker
                      style={styles.picker}
                      selectedValue={years.includes(tempBillDateTime.getFullYear()) ? tempBillDateTime.getFullYear() : years[0]}
                      onValueChange={value => {
                        const newDate = new Date(tempBillDateTime);
                        newDate.setFullYear(value);
                        setTempBillDateTime(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {years.map(year => (
                        <Picker.Item
                          key={year}
                          label={year.toString()}
                          value={year}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempBillDateTime.getMonth()}
                      onValueChange={value => {
                        const newDate = new Date(tempBillDateTime);
                        newDate.setMonth(value);
                        setTempBillDateTime(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {months.map(month => (
                        <Picker.Item
                          key={month.value}
                          label={month.label}
                          value={month.value}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempBillDateTime.getDate()}
                      onValueChange={value => {
                        const newDate = new Date(tempBillDateTime);
                        newDate.setDate(value);
                        setTempBillDateTime(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {days.map(day => (
                        <Picker.Item
                          key={day}
                          label={day.toString()}
                          value={day}
                        />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.pickerRow}>
                    <Picker
                      style={styles.picker}
                      selectedValue={tempBillDateTime.getHours()}
                      onValueChange={value => {
                        const newDate = new Date(tempBillDateTime);
                        newDate.setHours(value);
                        setTempBillDateTime(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {hours.map(hour => (
                        <Picker.Item
                          key={hour}
                          label={hour.toString().padStart(2, '0')}
                          value={hour}
                        />
                      ))}
                    </Picker>

                    <Picker
                      style={styles.picker}
                      selectedValue={tempBillDateTime.getMinutes()}
                      onValueChange={value => {
                        const newDate = new Date(tempBillDateTime);
                        newDate.setMinutes(value);
                        setTempBillDateTime(newDate);
                      }}
                      dropdownIconColor="#fff"
                      itemStyle={{ color: '#fff' }}
                    >
                      {minutes.map(minute => (
                        <Picker.Item
                          key={minute}
                          label={minute.toString().padStart(2, '0')}
                          value={minute}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </Modal>
          </SafeAreaView>
        </Modal>

        {/* NEW: Modal for Backend URL Input */}
        <Modal
          visible={isIpInputModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsIpInputModalVisible(false)}
        >
          <View style={styles.ipInputOverlay}>
            <View style={styles.ipInputContainer}>
              <View style={styles.ipInputHeader}>
                <TouchableOpacity onPress={handleCancelBackendUrl}>
                  <Text style={styles.ipInputCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.ipInputTitle}>Change Backend URL</Text>
                <TouchableOpacity onPress={handleSaveBackendUrl}>
                  <Text style={styles.ipInputSave}>Save</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ipInputContent}>
                <Text style={styles.inputLabel}>New Backend URL (e.g., http://192.168.1.100:3000)</Text>
                <TextInput
                  style={styles.textInput}
                  value={tempBackendUrl}
                  onChangeText={setTempBackendUrl}
                  placeholder="Enter backend server URL"
                  placeholderTextColor="#777"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                />
                <Text style={styles.warningText}>
                    Warning: Changing this URL is for development/testing only and can break functionality if incorrect.
                </Text>
                <Text style={styles.currentUrlText}>
                    Current URL: {backendUrl}
                </Text>
              </View>
            </View>
          </View>
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
  section: {
    marginBottom: 24,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1e1e1e',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  durationSubtextContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  durationSubtext: {
    fontSize: 14,
    color: '#aaa',
  },
  membersCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginRight: 12,
  },
  billsCount: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginRight: 12,
  },
  membersList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 14,
    color: '#aaa',
  },
  chevron: {
    fontSize: 20,
    color: '#777',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    color: '#aaa',
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  deleteButton: {
    backgroundColor: '#2c1a1a',
    borderWidth: 1,
    borderColor: '#4d2c2c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff453a',
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
    backgroundColor: '#1e1e1e',
  },
  picker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
  billsList: {
    paddingVertical: 10,
  },
  billCard: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  billCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  billCardDateTime: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  billSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  billSummaryText: {
    fontSize: 14,
    color: '#bbb',
  },
  createBillButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createBillButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateBills: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginTop: 10,
  },
  emptyStateBillsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 4,
  },
  emptyStateBillsSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
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
  cancelButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  createButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#bbb',
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  billItemContainer: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  whoPaidContainer: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  addButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ff453a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultText: {
    fontSize: 16,
    color: '#fff',
  },
  usernameText: {
    fontSize: 14,
    color: '#888',
  },
  noResultsText: {
    padding: 12,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  selectedMembers: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  selectedMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#bbb',
    marginBottom: 8,
  },
  selectedMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedMemberText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  removeMemberButton: {
    fontSize: 14,
    color: '#ff453a',
    fontWeight: 'bold',
    paddingHorizontal: 2,
  },
  manageEventButtonText: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  manageEventOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  manageEventContainer: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  manageEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  manageEventCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  manageEventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  manageEventButtons: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  scanButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingScanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
  },
  loadingScanText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },
  scanErrorText: {
    color: '#ff453a',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  // NEW: Styles for IP Input Modal
  ipInputOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  ipInputContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  ipInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  ipInputCancel: {
    fontSize: 16,
    color: '#ff453a',
  },
  ipInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  ipInputSave: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  ipInputContent: {
    padding: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#ffcc00',
    marginTop: 10,
    textAlign: 'center',
  },
  currentUrlText: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '500',
  }
});