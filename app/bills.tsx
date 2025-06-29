import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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

interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
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

interface Event {
  id: string;
  name: string;
  location: FirebaseFirestoreTypes.GeoPoint;
  startDateTime: Date;
  endDateTime: Date;
  memberIds: string[];
  billIds: string[];
}

interface MonthOption {
  label: string;
  value: number;
}

export default function BillsScreen() {
  const router = useRouter();
  const { eventId, tripId } = useLocalSearchParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventMembers, setEventMembers] = useState<TripMember[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillDateTime, setNewBillDateTime] = useState(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
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

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const unsubscribeEvent = firestore()
      .collection('events')
      .doc(eventId as string)
      .onSnapshot(
        async doc => {
          if (doc.exists()) {
            const eventData = doc.data();
            const currentEvent: Event = {
              id: doc.id,
              name: eventData?.eventName,
              location: eventData?.eventLocation,
              startDateTime: eventData?.startDateTime.toDate(),
              endDateTime: eventData?.endDateTime.toDate(),
              memberIds: eventData?.memberIds || [],
              billIds: eventData?.billIds || [],
            };
            setEvent(currentEvent);

            if (tripId && currentEvent.memberIds.length > 0) {
              const tripDoc = await firestore().collection('trips').doc(tripId as string).get();
              if (tripDoc.exists()) {
                const tripData = tripDoc.data();
                const allTripMembers: any[] = tripData?.members || [];
                const membersForEvent: TripMember[] = await Promise.all(
                  currentEvent.memberIds.map(async memberUid => {
                    const foundMember = allTripMembers.find((m: any) => m.uid === memberUid);
                    if (foundMember) {
                      const userDoc = await firestore().collection('users').doc(memberUid).get();
                      const userData = userDoc.data();
                      return {
                        id: memberUid,
                        username: userData?.username,
                        displayName: userData?.displayName,
                        billIds: foundMember.billIds || [],
                        totalSpent: foundMember.totalSpent || 0,
                        totalPaid: foundMember.totalPaid || 0,
                      };
                    }
                    return {
                      id: memberUid,
                      username: 'unknown',
                      displayName: 'Unknown User',
                      billIds: [],
                      totalSpent: 0,
                      totalPaid: 0,
                    };
                  })
                );
                setEventMembers(membersForEvent);
              }
            } else {
              setEventMembers([]);
            }

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
          } else {
            setEvent(null);
            setBills([]);
            setEventMembers([]);
          }
          setIsLoading(false);
        },
        error => {
          console.error('Error fetching event or bills:', error);
          setEvent(null);
          setBills([]);
          setEventMembers([]);
          setIsLoading(false);
        }
      );
    return unsubscribeEvent;
  }, [eventId, tripId]);

  const navigateToBillView = (bill: Bill) => {
    router.push({
      pathname: '/bill-view',
      params: { billId: bill.id, eventId: eventId, tripId: tripId },
    });
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

      // Update event's billIds
      const eventRef = firestore().collection('events').doc(event.id);
      batch.update(eventRef, {
        billIds: firestore.FieldValue.arrayUnion(billRef.id),
      });

      // Update trip members' totalSpent and totalPaid
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
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create bill or update member totals.');
      console.error(error);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateDateOptions = (): {
    years: number[];
    months: MonthOption[];
    days: number[];
    hours: number[];
    minutes: number[];
  } => {
    const years: number[] = [];
    const months: MonthOption[] = [];
    const days: number[] = [];
    const hours: number[] = [];
    const minutes: number[] = [];

    for (let i = 0; i < 6; i++) {
      years.push(new Date().getFullYear() + i);
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

  const handleDateTimeDone = () => {
    setShowDateTimePicker(false);
    setNewBillDateTime(tempBillDateTime);
  };

  const renderBillItem = ({ item }: { item: Bill }) => (
    <TouchableOpacity style={styles.billCard} onPress={() => navigateToBillView(item)}>
      <Text style={styles.billName}>{item.billName}</Text>
      <Text style={styles.billDateTime}>{formatDateTime(item.billDateTime)}</Text>
      <View style={styles.billSummary}>
        <Text style={styles.billSummaryText}>Items: {item.billItems.length}</Text>
        <Text style={styles.billSummaryText}>Paid by: {item.whoPaid.length} person{item.whoPaid.length !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.loadingTitle}>Loading Bills...</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading bills for this event...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.loadingTitle}>Not Found</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Event not found.</Text>
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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.tripTitle}>Bills</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No bills yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add the first bill for this event!
            </Text>
          </View>
        ) : (
          <FlatList
            data={bills}
            renderItem={renderBillItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.billsList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.createEventSection}>
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={() => {
              setIsModalVisible(true);
              setNewBillDateTime(new Date());
            }}
          >
            <Text style={styles.createEventButtonText}>+ Create New Bill</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
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
                      setShowDateTimePicker(true);
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
              visible={showDateTimePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDateTimePicker(false)}
            >
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowDateTimePicker(false)}
                    >
                      <Text style={styles.datePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select Date & Time</Text>
                    <TouchableOpacity onPress={handleDateTimeDone}>
                      <Text style={styles.datePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pickerRow}>
                    <Picker
                      style={styles.picker}
                      selectedValue={tempBillDateTime.getFullYear()}
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
    paddingVertical: 10,
    backgroundColor: '#121212',
  },
  backButton: {
    fontSize: 20,
    color: '#0a84ff',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#aaa',
    textAlign: 'center',
  },
  placeholder: {
    width: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#aaa',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  billsList: {
    padding: 20,
    paddingBottom: 100,
  },
  billCard: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  billName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  billDateTime: {
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
  createEventSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#121212',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  createEventButton: {
    backgroundColor: '#305cde',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createEventButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  dateButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
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
    height: 150,
    backgroundColor: '#1e1e1e',
  },
  picker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
});