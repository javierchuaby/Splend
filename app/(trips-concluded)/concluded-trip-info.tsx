import BillSettlementManager from '@/components/BillSettlementManager';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import styles from '../../styles/concluded-trip-info-styles';

interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
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
}

interface UserBalance {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
}

interface SettlementData {
  balances: UserBalance[];
  settlements: Settlement[];
  totalExpenses: number;
  summary: {
    totalTransactions: number;
  };
}

export default function ConcludedTripInfoScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentUser, setCurrentUser] = useState<TripMember | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageTripModalVisible, setIsManageTripModalVisible] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [loadingSettlement, setLoadingSettlement] = useState(false);

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
            };
            setTrip(currentTrip);
            const isMember = currentTrip.members.some(
              member => member.id === currentUser.id
            );
            setHasAccess(isMember);
            setIsLoading(false);
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

  useEffect(() => {
    if (trip && !isLoading) {
      loadSettlementData();
    }
  }, [trip, isLoading]);

  const calculateUserBalances = (bills: any[], tripMembers: TripMember[]): UserBalance[] => {
    const balances: { [userId: string]: UserBalance } = {};

    tripMembers.forEach(member => {
      balances[member.id] = {
        userId: member.id,
        userName: member.displayName,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0
      };
    });

    bills.forEach(bill => {
      bill.whoPaid.forEach((payer: any) => {
        if (balances[payer.uid]) {
          balances[payer.uid].totalPaid += Math.round(payer.amountPaid * 100);
        }
      });

      bill.billItems.forEach((item: any) => {
        const itemPriceCents = Math.round(item.billItemPrice * 100);
        let costPerPersonCents: number;

        if (item.costPerUser !== undefined) {
          costPerPersonCents = Math.round(item.costPerUser * 100);
        } else {
          costPerPersonCents = Math.round(itemPriceCents / item.billItemUserIds.length);
        }

        item.billItemUserIds.forEach((userId: string) => {
          if (balances[userId]) {
            balances[userId].totalOwed += costPerPersonCents;
          }
        });
      });
    });

    Object.values(balances).forEach(balance => {
      balance.netBalance = balance.totalPaid - balance.totalOwed;
    });

    return Object.values(balances);
  };

  const optimiseSettlements = (originalBalances: UserBalance[]): Settlement[] => {
    const balances = originalBalances.map(balance => ({ ...balance }));
    const settlements: Settlement[] = [];

    const creditors = balances
      .filter(b => b.netBalance > 1)
      .sort((a, b) => b.netBalance - a.netBalance);

    const debtors = balances
      .filter(b => b.netBalance < -1)
      .map(b => ({ ...b, netBalance: Math.abs(b.netBalance) }))
      .sort((a, b) => b.netBalance - a.netBalance);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const settlementAmountCents = Math.min(creditor.netBalance, debtor.netBalance);

      if (settlementAmountCents > 1) {
        settlements.push({
          id: `${debtor.userId}-${creditor.userId}-${Date.now()}`,
          from: debtor.userId,
          to: creditor.userId,
          amount: settlementAmountCents
        });

        creditor.netBalance -= settlementAmountCents;
        debtor.netBalance -= settlementAmountCents;
      }

      if (creditor.netBalance <= 1) creditorIndex++;
      if (debtor.netBalance <= 1) debtorIndex++;
    }

    return settlements;
  };

  const getSmartTruncatedSettlements = (settlements: Settlement[], currentUserId: string) => {
    const userInvolvedSettlements = settlements.filter(
      settlement => settlement.from === currentUserId || settlement.to === currentUserId
    );

    let displayedSettlements: Settlement[];
    let moreCount: number;

    if (userInvolvedSettlements.length > 0) {
      displayedSettlements = userInvolvedSettlements.slice(0, 3);
      moreCount = settlements.length - displayedSettlements.length;
    } else {
      displayedSettlements = settlements.slice(0, 2);
      moreCount = settlements.length - displayedSettlements.length;
    }

    return {
      displayed: displayedSettlements,
      moreCount: moreCount > 0 ? moreCount : 0
    };
  };

  const loadSettlementData = async () => {
    if (!trip) return;

    try {
      setLoadingSettlement(true);
      const eventIds = trip.eventIds || [];

      if (eventIds.length === 0) {
        setSettlementData(null);
        return;
      }

      const billPromises = eventIds.map(async (eventId: string) => {
        const eventDoc = await firestore().collection('events').doc(eventId).get();
        const eventData = eventDoc.data();
        const billIds = eventData?.billIds || [];

        if (billIds.length === 0) return [];

        const billsSnapshot = await firestore()
          .collection('bills')
          .where(firestore.FieldPath.documentId(), 'in', billIds)
          .get();

        return billsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          billDateTime: doc.data().billDateTime?.toDate() || new Date()
        }));
      });

      const billArrays = await Promise.all(billPromises);
      const bills = billArrays.flat();

      if (bills.length === 0) {
        setSettlementData(null);
        return;
      }

      const balances = calculateUserBalances(bills, trip.members);
      const settlements = optimiseSettlements(balances);

      const totalExpensesCents = bills.reduce((sum: number, bill: any) =>
        sum + bill.billItems.reduce((itemSum: number, item: any) =>
          itemSum + Math.round(item.billItemPrice * 100), 0), 0
      );

      setSettlementData({
        balances,
        settlements,
        totalExpenses: totalExpensesCents,
        summary: {
          totalTransactions: settlements.length,
        }
      });
    } catch (error) {
      console.error('Error loading settlement data:', error);
      setSettlementData(null);
    } finally {
      setLoadingSettlement(false);
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

  const unconcludeTrip = async () => {
    if (!trip) return;

    setIsManageTripModalVisible(false);

    Alert.alert(
      'Unconclude Trip',
      `Are you sure you want to unconclude "${trip.name}"? This will move the trip back to active trips.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unconclude',
          style: 'default',
          onPress: async () => {
            try {
              await firestore().collection('trips').doc(trip.id).update({
                isConcluded: false,
              });
              router.replace({
                pathname: '/trip-view',
                params: { tripId: trip.id },
              });
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to unconclude trip, please try again'
              );
              console.error(error);
            }
          },
        },
      ]
    );
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
      pathname: './concluded-trip-members',
      params: { tripId: trip?.id },
    });
  };

  const navigateToDescription = () => {
    router.push({
      pathname: './concluded-trip-description',
      params: { tripId: trip?.id },
    });
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
            <TouchableOpacity onPress={() => router.back()}>
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

            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TouchableOpacity style={styles.descriptionCard} onPress={navigateToDescription}>
                <Text style={styles.descriptionText}>
                  {trip.tripDescription || 'No description provided. Tap to view.'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Duration Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Start: {formatDate(trip.startDate)}</Text>
                </View>
                <View style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>End: {formatDate(trip.endDate)}</Text>
                </View>
              </View>
              <View style={styles.durationSubtextContainer}>
                <Text style={styles.durationSubtext}>
                  {calculateDuration(trip.startDate, trip.endDate)}
                </Text>
              </View>
            </View>

            {/* Members Section */}
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
                    <Text style={styles.memberName}>
                      +{trip.members.length - 2} more
                    </Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Ledgers Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ledgers</Text>
              <View style={styles.ledgerCard}>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Group Ledger:</Text>
                  <Text style={styles.ledgerValue}>${groupLedger.toFixed(2)}</Text>
                </View>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Your Ledger:</Text>
                  <Text style={styles.ledgerValue}>${individualLedger.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Settlement Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill Settlement</Text>
              <View style={styles.settlementCard}>
                {loadingSettlement ? (
                  <Text style={styles.settlementLoading}>Loading settlement data...</Text>
                ) : settlementData ? (
                  <>
                    <View style={styles.settlementSummary}>
                      <View style={styles.settlementRow}>
                        <Text style={styles.settlementLabel}>Total Expenses:</Text>
                        <Text style={styles.settlementValue}>
                          ${(settlementData.totalExpenses / 100).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.settlementRow}>
                        <Text style={styles.settlementLabel}>Settlements Required:</Text>
                        <Text style={styles.settlementValue}>
                          {settlementData.settlements.length}
                        </Text>
                      </View>
                    </View>

                    {settlementData.settlements.length > 0 && (
                      <View style={styles.settlementInstructions}>
                        <Text style={styles.settlementSubtitle}>Settlement Instructions:</Text>
                        {(() => {
                          const { displayed, moreCount } = getSmartTruncatedSettlements(
                            settlementData.settlements,
                            currentUser?.id || ''
                          );
                          return (
                            <>
                              {displayed.map(settlement => {
                                const fromUser = settlementData.balances.find(
                                  b => b.userId === settlement.from
                                )?.userName || 'Unknown';
                                const toUser = settlementData.balances.find(
                                  b => b.userId === settlement.to
                                )?.userName || 'Unknown';
                                const isUserInvolved = settlement.from === currentUser?.id ||
                                  settlement.to === currentUser?.id;

                                return (
                                  <Text
                                    key={settlement.id}
                                    style={[
                                      styles.settlementInstruction,
                                      isUserInvolved && styles.userInvolvedSettlement
                                    ]}
                                  >
                                    • {fromUser} pays {toUser}: ${(settlement.amount / 100).toFixed(2)}
                                  </Text>
                                );
                              })}
                              {moreCount > 0 && (
                                <Text style={styles.settlementMore}>
                                  +{moreCount} more settlement{moreCount !== 1 ? 's' : ''}
                                </Text>
                              )}
                            </>
                          );
                        })()}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.viewSettlementButton}
                      onPress={() => setShowSettlement(true)}
                    >
                      <Text style={styles.viewSettlementButtonText}>
                        View Full Settlement Report
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.noSettlementText}>
                    No bills found for settlement calculation
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Manage Trip Modal */}
        <Modal
          visible={isManageTripModalVisible}
          transparent={true}
          animationType="slide"
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
                <TouchableOpacity style={styles.unconcludeButton} onPress={unconcludeTrip}>
                  <Text style={styles.unconcludeButtonText}>Unconclude Trip</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={deleteTrip}>
                  <Text style={styles.deleteButtonText}>Delete Trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Settlement Modal */}
        <BillSettlementManager
          visible={showSettlement}
          tripId={tripId as string}
          tripName={trip.name}
          onClose={() => setShowSettlement(false)}
        />
      </SafeAreaView>
    </>
  );
}