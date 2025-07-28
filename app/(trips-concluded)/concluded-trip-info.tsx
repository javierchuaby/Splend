import { BillSettlementManager } from '@/components/BillSettlementManager';
import TripPackingListPreview from '@/components/TripPackingListPreview';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../styles/trip-info.styles';

interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

interface Budget {
  group?: number;
  individual?: { uid: string; indivBudget: number }[];
}

interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  tripDescription: string;
  isConcluded: boolean;
  eventIds: string[];
  budgets?: Budget;
}

interface MonthOption {
  label: string;
  value: number;
}

export default function TripInfoScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageTripModalVisible, setIsManageTripModalVisible] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [isFromConcludeFlow, setIsFromConcludeFlow] = useState(false);
  const [isEditBudgetModalVisible, setIsEditBudgetModalVisible] = useState(false);
  const [editGroupBudget, setEditGroupBudget] = useState('');
  const [editIndividualBudget, setEditIndividualBudget] = useState('');

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
    if (!tripId || !currentUser) {
      setIsLoading(true);
      return;
    }

    const unsubscribe = firestore()
      .collection('trips')
      .doc(tripId as string)
      .onSnapshot(
        doc => {
          if (doc.exists()) {
            const data = doc.data();
            const currentTrip: Trip = {
              id: doc.id,
              name: data!.tripName,
              members: data!.members.map((member: any) => ({
                id: member.uid,
                username: member.username,
                displayName: member.displayName,
                billIds: member.billIds || [],
                totalSpent: member.totalSpent || 0,
                totalPaid: member.totalPaid || 0,
              })),
              startDate: data!.startDate.toDate(),
              endDate: data!.endDate.toDate(),
              createdAt: data!.createdAt?.toDate() ?? new Date(),
              tripDescription: data!.tripDescription || '',
              isConcluded: data!.isConcluded || false,
              eventIds: data!.eventIds || [],
              budgets: data!.budgets || undefined, // Capture budgets
            };

            setTrip(currentTrip);

            const isMember = currentTrip.members.some(
              member => member.id === currentUser.id
            );
            setHasAccess(isMember);
            setIsLoading(false);

            // Populate budget fields for the modal
            setEditGroupBudget(currentTrip.budgets?.group?.toString() || '');
            const currentUserIndivBudget = currentTrip.budgets?.individual?.find(
              (b) => b.uid === currentUser.id
            )?.indivBudget;
            setEditIndividualBudget(currentUserIndivBudget?.toString() || '');

          } else {
            setTrip(null);
            setHasAccess(false);
            setIsLoading(false);
          }
        },
        error => {
          console.error('Error fetching trip:', error);
          setTrip(null);
          setHasAccess(false);
          setIsLoading(false);
        }
      );

    return unsubscribe;
  }, [tripId, currentUser]);

  const saveTrip = async (updatedFields: Partial<Trip>) => {
    if (!trip) return;

    const firestoreUpdate: { [key: string]: any } = {};

    if (updatedFields.startDate) {
      firestoreUpdate.startDate = firestore.Timestamp.fromDate(
        updatedFields.startDate
      );
    }

    if (updatedFields.endDate) {
      firestoreUpdate.endDate = firestore.Timestamp.fromDate(
        updatedFields.endDate
      );
    }

    if (updatedFields.budgets !== undefined) {
      firestoreUpdate.budgets = updatedFields.budgets;
    }

    try {
      await firestore()
        .collection('trips')
        .doc(trip.id)
        .update(firestoreUpdate);
    } catch (error) {
      Alert.alert('Error', 'Failed to update trip');
      console.error(error);
    }
  };

  const deleteTrip = async () => {
    if (!trip) return;

    setIsManageTripModalVisible(false);

    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (trip.eventIds && trip.eventIds.length > 0) {
                const eventPromises = trip.eventIds.map(eventId =>
                  firestore().collection('events').doc(eventId).delete()
                );
                await Promise.all(eventPromises);
              }

              await firestore().collection('trips').doc(trip.id).delete();
              router.push('/Home');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trip');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const concludeTrip = async () => {
    if (!trip) return;

    setIsManageTripModalVisible(false);

    Alert.alert(
      'Conclude Trip',
      `Are you sure you want to conclude "${trip.name}"? This will calculate final bill settlements.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Conclude & Split Bills',
          style: 'default',
          onPress: () => {
            setIsFromConcludeFlow(true);
            setShowSettlement(true);
          },
        },
      ]
    );
  };

  const concludeTripAfterSettlement = async () => {
    if (!trip) return;

    try {
      await firestore().collection('trips').doc(trip.id).update({
        isConcluded: true,
      });
      router.push('/Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to conclude trip, please try again');
      console.error('Trip conclusion error:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      pathname: '/concluded-trip-members',
      params: { tripId: trip?.id },
    });
  };

  const navigateToDescription = () => {
    router.push({
      pathname: '/concluded-trip-description',
      params: { tripId: trip?.id },
    });
  };

  const generateDateOptions = (): {
    years: number[];
    months: MonthOption[];
    days: number[];
  } => {
    const today = new Date();
    const years: number[] = [];
    const months: MonthOption[] = [];
    const days: number[] = [];

    for (let i = 0; i < 6; i++) {
      years.push(today.getFullYear() + i);
    }

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    monthNames.forEach((month, index) => {
      months.push({ label: month, value: index });
    });

    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }

    return { years, months, days };
  };

  const { years, months, days } = generateDateOptions();

  const handleStartDateDone = async () => {
    if (!trip) return;

    if (tempStartDate > trip.endDate) {
      Alert.alert('Error', 'Start date cannot be after the end date');
      return;
    }

    await saveTrip({ startDate: tempStartDate });
    setShowStartDatePicker(false);
  };

  const handleEndDateDone = async () => {
    if (!trip) return;

    if (tempEndDate < trip.startDate) {
      Alert.alert('Error', 'End date cannot be before the start date');
      return;
    }

    await saveTrip({ endDate: tempEndDate });
    setShowEndDatePicker(false);
  };

  const calculateGroupLedger = (): number => {
    if (!trip || !trip.members) return 0;
    return trip.members.reduce((sum, member) => sum + member.totalSpent, 0);
  };

  const calculateIndividualLedger = (): number => {
    if (!trip || !currentUser || !trip.members) return 0;
    const individualMember = trip.members.find(
      member => member.id === currentUser.id
    );
    return individualMember ? individualMember.totalSpent : 0;
  };

  // NEW: Handle saving budgets
  const handleSaveBudgets = async () => {
    if (!trip || !currentUser) return;

    const newBudgets: Budget = {
      group: undefined,
      individual: [],
    };

    const parsedGroupBudget = parseFloat(editGroupBudget);
    const parsedIndividualBudget = parseFloat(editIndividualBudget);

    // Validate and set group budget
    if (editGroupBudget.trim() !== '') {
      if (isNaN(parsedGroupBudget) || parsedGroupBudget < 0) {
        Alert.alert('Invalid Input', 'Please enter a valid number for Group Budget.');
        return;
      }
      newBudgets.group = parseFloat(parsedGroupBudget.toFixed(2));
    }

    // Validate and set individual budget for current user
    if (editIndividualBudget.trim() !== '') {
      if (isNaN(parsedIndividualBudget) || parsedIndividualBudget < 0) {
        Alert.alert('Invalid Input', 'Please enter a valid number for Your Individual Budget.');
        return;
      }
      newBudgets.individual = [
        ...(trip.budgets?.individual || []).filter(b => b.uid !== currentUser.id), // Keep other individual budgets
        { uid: currentUser.id, indivBudget: parseFloat(parsedIndividualBudget.toFixed(2)) },
      ];
    } else {
        // If individual budget input is empty, ensure current user's budget is removed or not added
        newBudgets.individual = (trip.budgets?.individual || []).filter(b => b.uid !== currentUser.id);
    }

    try {
      await saveTrip({ budgets: newBudgets });
      setIsEditBudgetModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update budgets.');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Trip</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Info</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading trip info...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!trip || !hasAccess) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(trips)/trip-view',
                  params: { tripId: tripId }
                });
              }}
            >
              <Text style={styles.backButton}>← Trip</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Info</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Trip not found or you don't have access.</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const groupLedger = calculateGroupLedger();
  const individualLedger = calculateIndividualLedger();
  const groupBudgetDisplay = trip.budgets?.group !== undefined ? trip.budgets.group : null;
  const individualBudgetDisplay = trip.budgets?.individual?.find(b => b.uid === currentUser?.id)?.indivBudget || null;


  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Trip</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Info</Text>
          <TouchableOpacity onPress={() => setIsManageTripModalVisible(true)}>
            <Text style={styles.manageTripButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.tripTitle}>{trip.name}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TouchableOpacity style={styles.descriptionCard} onPress={navigateToDescription}>
                <Text style={styles.descriptionText}>
                  {trip.tripDescription || 'No description provided. Tap to add one.'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setTempStartDate(new Date(trip.startDate));
                    setShowStartDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>Start: {formatDate(trip.startDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setTempEndDate(new Date(trip.endDate));
                    setShowEndDatePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>End: {formatDate(trip.endDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.durationSubtextContainer}>
                <Text style={styles.durationSubtext}>
                  {calculateDuration(trip.startDate, trip.endDate)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              <TouchableOpacity style={styles.membersCard} onPress={navigateToMembers}>
                <Text style={styles.membersCount}>
                  {trip.members.length} member{trip.members.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.membersList}>
                  {trip.members.slice(0, 2).map((member, index) => (
                    <Text key={member.id} style={styles.memberName}>
                      {member.displayName}
                      {index < Math.min(trip.members.length - 1, 2) ? ', ' : ''}
                    </Text>
                  ))}
                  {trip.members.length > 2 && (
                    <Text style={styles.memberName}>+{trip.members.length - 2} more</Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ledgers</Text>
              <View style={styles.ledgerCard}>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Group Ledger:</Text>
                  <Text style={styles.ledgerValue}>
                    ${groupLedger.toFixed(2)}{' '}
                    {groupBudgetDisplay !== null && (
                      <Text style={styles.budgetSuffix}>/ ${groupBudgetDisplay.toFixed(2)}</Text>
                    )}
                  </Text>
                </View>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Your Ledger:</Text>
                  <Text style={styles.ledgerValue}>
                    ${individualLedger.toFixed(2)}{' '}
                    {individualBudgetDisplay !== null && (
                      <Text style={styles.budgetSuffix}>/ ${individualBudgetDisplay.toFixed(2)}</Text>
                    )}
                  </Text>
                </View>

                <View style={styles.ledgerSeparator} />

                <TouchableOpacity
                  style={styles.settlementButtonCompact}
                  onPress={() => {
                    setIsFromConcludeFlow(false);
                    setShowSettlement(true);
                  }}
                >
                  <Text style={styles.settlementButtonCompactText}>View Bill Settlement</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Packing List</Text>
              <TripPackingListPreview tripId={tripId as string} />
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={isManageTripModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsManageTripModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.manageTripContainer}>
              <View style={styles.manageTripHeader}>
                <TouchableOpacity onPress={() => setIsManageTripModalVisible(false)}>
                  <Text style={styles.manageTripCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.manageTripTitle}>Manage Trip</Text>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.manageTripButtons}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    setIsManageTripModalVisible(false);
                    setIsFromConcludeFlow(false);
                    setShowSettlement(true);
                  }}
                >
                  <Text style={styles.primaryActionButtonText}>Split Bills</Text>
                </TouchableOpacity>

                {!trip.isConcluded && (
                  <TouchableOpacity style={styles.successActionButton} onPress={concludeTrip}>
                    <Text style={styles.successActionButtonText}>Conclude Trip</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.destructiveActionButton} onPress={deleteTrip}>
                  <Text style={styles.destructiveActionButtonText}>Delete Trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* This is not going to be visible. Ignore */}
        <Modal
          visible={isEditBudgetModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsEditBudgetModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditBudgetModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Budgets</Text>
              <TouchableOpacity onPress={handleSaveBudgets}>
                <Text style={styles.createButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} contentContainerStyle={styles.scrollViewContentContainer}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Group Budget ($)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editGroupBudget}
                  onChangeText={text => setEditGroupBudget(text.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g., 1000.00"
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  keyboardAppearance="dark"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Your Individual Budget ($)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editIndividualBudget}
                  onChangeText={text => setEditIndividualBudget(text.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g., 200.00"
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  keyboardAppearance="dark"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showStartDatePicker}
          animationType="slide"
          transparent={true}
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
                  onValueChange={(value) => {
                    const newDate = new Date(tempStartDate);
                    newDate.setFullYear(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {years.map(year => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getMonth()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempStartDate);
                    newDate.setMonth(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {months.map(month => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempStartDate.getDate()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempStartDate);
                    newDate.setDate(value);
                    setTempStartDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {days.map(day => (
                    <Picker.Item key={day} label={day.toString()} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEndDatePicker}
          animationType="slide"
          transparent={true}
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
                  onValueChange={(value) => {
                    const newDate = new Date(tempEndDate);
                    newDate.setFullYear(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {years.map(year => (
                    <Picker.Item key={year} label={year.toString()} value={year} />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getMonth()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempEndDate);
                    newDate.setMonth(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {months.map(month => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>

                <Picker
                  style={styles.picker}
                  selectedValue={tempEndDate.getDate()}
                  onValueChange={(value) => {
                    const newDate = new Date(tempEndDate);
                    newDate.setDate(value);
                    setTempEndDate(newDate);
                  }}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: '#fff' }}
                >
                  {days.map(day => (
                    <Picker.Item key={day} label={day.toString()} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>

        <BillSettlementManager
          tripId={tripId as string}
          tripName={trip.name}
          visible={showSettlement}
          onClose={() => {
            setShowSettlement(false);
            if (isFromConcludeFlow) {
              concludeTripAfterSettlement();
            }
            setIsFromConcludeFlow(false);
          }}
        />
      </SafeAreaView>
    </>
  );
}