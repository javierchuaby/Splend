import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export interface BillItem {
  billItemName: string;
  billItemPrice: number;
  billItemUserIds: string[];
  costPerUser?: number;
}

export interface WhoPaidEntry {
  uid: string;
  amountPaid: number;
}

export interface Bill {
  id: string;
  billName: string;
  billEvent: string;
  billDateTime: Date;
  billUserIds: string[];
  billItems: BillItem[];
  whoPaid: WhoPaidEntry[];
}

export interface UserBalance {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
}

export interface SettlementReport {
  balances: UserBalance[];
  settlements: Settlement[];
  totalExpenses: number;
  summary: {
    totalTransactions: number;
    maxTransactionsWithoutOptimisation: number;
    optimisationSavings: number;
  };
}

export interface TripMember {
  uid: string;
  username: string;
  displayName: string;
}

export interface BillSettlementManagerProps {
  tripId: string;
  tripName: string;
  onClose?: () => void;
  visible: boolean;
}

const calculateUserBalances = (bills: Bill[], tripMembers: TripMember[]): UserBalance[] => {
  const balances: { [userId: string]: UserBalance } = {};
  
  tripMembers.forEach(member => {
    balances[member.uid] = {
      userId: member.uid,
      userName: member.displayName,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0
    };
  });

  bills.forEach(bill => {
    bill.whoPaid.forEach(payer => {
      if (balances[payer.uid]) {
        balances[payer.uid].totalPaid += Math.round(payer.amountPaid * 100);
      }
    });

    bill.billItems.forEach(item => {
      const itemPriceCents = Math.round(item.billItemPrice * 100);
      let costPerPersonCents: number;

      if (item.costPerUser !== undefined) {
        costPerPersonCents = Math.round(item.costPerUser * 100);
      } else {
        costPerPersonCents = Math.round(itemPriceCents / item.billItemUserIds.length);
      }

      item.billItemUserIds.forEach(userId => {
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

  const creditors = originalBalances.filter(b => b.netBalance > 0).map(b => ({ ...b }));
  const debtors = originalBalances.filter(b => b.netBalance < 0).map(b => ({ ...b }));

  const settlements: Settlement[] = [];

  for (const debtor of debtors) {
    let remainingDebt = Math.abs(debtor.netBalance);

    for (const creditor of creditors) {
      if (remainingDebt <= 0 || creditor.netBalance <= 0) continue;

      const settlementAmount = Math.min(remainingDebt, creditor.netBalance);

      if (settlementAmount < 1) continue; // Skip tiny amounts

      settlements.push({
        id: `${debtor.userId}-${creditor.userId}-${Date.now()}-${settlements.length}`,
        from: debtor.userId,
        to: creditor.userId,
        amount: settlementAmount
      });

      creditor.netBalance -= settlementAmount;
      remainingDebt -= settlementAmount;
    }
  }

  return settlements;
};

const calculateMaxPossibleTransactions = (balances: UserBalance[]): number => {
  const creditors = balances.filter(b => b.netBalance > 0).length;
  const debtors = balances.filter(b => b.netBalance < 0).length;
  
  if (creditors === 0 || debtors === 0) return 0;
  
  return creditors * debtors;
};

export const BillSettlementManager: React.FC<BillSettlementManagerProps> = ({
  tripId,
  tripName,
  onClose,
  visible
}) => {
  const router = useRouter();
  const [settlementData, setSettlementData] = useState<SettlementReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateSettlementReport = (bills: Bill[], tripMembers: TripMember[]): SettlementReport => {
    const balances = calculateUserBalances(bills, tripMembers);
    const settlements = optimiseSettlements(balances);
    const maxTransactions = calculateMaxPossibleTransactions(balances);

    const totalExpensesCents = bills.reduce((sum, bill) =>
      sum + bill.billItems.reduce((itemSum, item) => 
        itemSum + Math.round(item.billItemPrice * 100), 0
      ), 0
    );

    return {
      balances,
      settlements,
      totalExpenses: totalExpensesCents,
      summary: {
        totalTransactions: settlements.length,
        maxTransactionsWithoutOptimisation: maxTransactions,
        optimisationSavings: Math.max(0, maxTransactions - settlements.length)
      }
    };
  };

  const fetchTripBills = async (tripId: string): Promise<Bill[]> => {
    try {
      const tripDoc = await firestore().collection('trips').doc(tripId).get();
      const tripData = tripDoc.data();
      const eventIds = tripData?.eventIds || [];

      if (eventIds.length === 0) {
        return [];
      }

      const billPromises = eventIds.map(async (eventId: string) => {
        const eventDoc = await firestore().collection('events').doc(eventId).get();
        const eventData = eventDoc.data();
        const billIds = eventData?.billIds || [];

        if (billIds.length === 0) {
          return [];
        }

        const billsSnapshot = await firestore()
          .collection('bills')
          .where(firestore.FieldPath.documentId(), 'in', billIds)
          .get();

        return billsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          billDateTime: doc.data().billDateTime?.toDate() || new Date()
        })) as Bill[];
      });

      const billArrays = await Promise.all(billPromises);
      return billArrays.flat();
    } catch (error) {
      throw new Error('Failed to fetch trip bills');
    }
  };

  const fetchTripMembers = async (tripId: string): Promise<TripMember[]> => {
    try {
      const tripDoc = await firestore().collection('trips').doc(tripId).get();
      const tripData = tripDoc.data();

      if (!tripData?.members) {
        throw new Error('No trip members found');
      }

      return tripData.members as TripMember[];
    } catch (error) {
      throw new Error('Failed to fetch trip members');
    }
  };

  const exportSettlementReport = async () => {
    if (!settlementData) return;

    const reportText = `
${tripName} - Settlement Report

SUMMARY:
• Total Expenses: $${(settlementData.totalExpenses / 100).toFixed(2)}
• Settlements Required: ${settlementData.settlements.length}
• Optimisation Savings: ${settlementData.summary.optimisationSavings} fewer transactions

INDIVIDUAL BALANCES:
${settlementData.balances.map(b =>
  `• ${b.userName}: Paid $${(b.totalPaid / 100).toFixed(2)}, Owes $${(b.totalOwed / 100).toFixed(2)}, Net: ${b.netBalance >= 0 ? '+' : ''}$${(b.netBalance / 100).toFixed(2)}`
).join('\n')}

SETTLEMENT INSTRUCTIONS:
${settlementData.settlements.length === 0 ? '• All settled! No payments required.' :
  settlementData.settlements.map(s => {
    const fromUser = settlementData.balances.find(b => b.userId === s.from)?.userName || 'Unknown';
    const toUser = settlementData.balances.find(b => b.userId === s.to)?.userName || 'Unknown';
    return `• ${fromUser} pays ${toUser}: $${(s.amount / 100).toFixed(2)}`;
  }).join('\n')}
    `.trim();

    try {
      await Share.share({
        message: reportText,
        title: `${tripName} Settlement Report`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const loadSettlementData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bills, tripMembers] = await Promise.all([
        fetchTripBills(tripId),
        fetchTripMembers(tripId)
      ]);

      if (bills.length === 0) {
        setError('No bills found for this trip');
        return;
      }

      const settlement = generateSettlementReport(bills, tripMembers);
      setSettlementData(settlement);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to calculate settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadSettlementData();
    }
  }, [visible, tripId]);

  const SettlementRow: React.FC<{ settlement: Settlement }> = ({ settlement }) => {
    const fromUser = settlementData?.balances.find(b => b.userId === settlement.from)?.userName || 'Unknown';
    const toUser = settlementData?.balances.find(b => b.userId === settlement.to)?.userName || 'Unknown';

    return (
      <View style={styles.settlementRow}>
        <View style={styles.settlementInfo}>
          <Text style={styles.settlementText}>
            <Text style={styles.userName}>{fromUser}</Text> pays{' '}
            <Text style={styles.userName}>{toUser}</Text>
          </Text>
        </View>
        <Text style={styles.amount}>${(settlement.amount / 100).toFixed(2)}</Text>
      </View>
    );
  };

  const LoadingComponent = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#0a84ff" />
      <Text style={styles.loadingText}>Calculating settlements...</Text>
    </View>
  );

  const ErrorComponent = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <Text style={styles.errorSubtext}>
        {error === 'No bills found for this trip'
          ? 'Add some bills to this trip before calculating settlements.'
          : 'Please try again or check your connection.'}
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>← Close</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{tripName}</Text>
            <Text style={styles.subtitle}>Settlement Report</Text>
          </View>
          {settlementData ? (
            <TouchableOpacity onPress={exportSettlementReport}>
              <Text style={styles.exportButton}>Export</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <ScrollView style={styles.scrollContainer}>
          {loading ? (
            <LoadingComponent />
          ) : error ? (
            <ErrorComponent />
          ) : settlementData ? (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Trip Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Expenses:</Text>
                  <Text style={styles.summaryValue}>
                    ${(settlementData.totalExpenses / 100).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Settlements Required:</Text>
                  <Text style={styles.summaryValue}>
                    {settlementData.settlements.length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Transactions Saved:</Text>
                  <Text style={[styles.summaryValue, styles.optimisationText]}>
                    {settlementData.summary.optimisationSavings}
                  </Text>
                </View>
                <Text style={styles.optimisationNote}>
                  Optimised from {settlementData.summary.maxTransactionsWithoutOptimisation} possible transactions
                </Text>
              </View>

              <View style={styles.balancesCard}>
                <Text style={styles.sectionTitle}>Individual Balances</Text>
                {settlementData.balances.map(balance => (
                  <View key={balance.userId} style={styles.balanceRow}>
                    <Text style={styles.userName}>{balance.userName}</Text>
                    <View style={styles.balanceDetails}>
                      <Text style={styles.balanceItem}>
                        Paid: ${(balance.totalPaid / 100).toFixed(2)}
                      </Text>
                      <Text style={styles.balanceItem}>
                        Owes: ${(balance.totalOwed / 100).toFixed(2)}
                      </Text>
                      <Text style={[
                        styles.netBalance,
                        balance.netBalance >= 0 ? styles.positive : styles.negative
                      ]}>
                        Net: {balance.netBalance >= 0 ? '+' : ''}${(balance.netBalance / 100).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.settlementsCard}>
                <Text style={styles.sectionTitle}>Settlement Instructions</Text>
                {settlementData.settlements.length === 0 ? (
                  <View style={styles.noSettlementsContainer}>
                    <Text style={styles.noSettlements}>🎉 All settled!</Text>
                    <Text style={styles.noSettlementsSubtext}>No payments required.</Text>
                  </View>
                ) : (
                  settlementData.settlements.map(settlement => (
                    <SettlementRow key={settlement.id} settlement={settlement} />
                  ))
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 0,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 2,
  },
  closeButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  exportButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  summaryCard: {
    backgroundColor: '#1e1e1e',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#aaa',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optimisationText: {
    color: '#4CAF50',
  },
  optimisationNote: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  balancesCard: {
    backgroundColor: '#1e1e1e',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  balanceDetails: {
    alignItems: 'flex-end',
  },
  balanceItem: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  netBalance: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },
  settlementsCard: {
    backgroundColor: '#1e1e1e',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  noSettlementsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSettlements: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  noSettlementsSubtext: {
    fontSize: 16,
    color: '#aaa',
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settlementInfo: {
    flex: 1,
  },
  settlementText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a84ff',
    marginBottom: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#aaa',
  },
  errorText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});

export default BillSettlementManager;

export {
  calculateMaxPossibleTransactions,
  calculateUserBalances,
  optimiseSettlements
};
