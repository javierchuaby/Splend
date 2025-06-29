import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TripMember {
  id: string;
  username: string;
  displayName: string;
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

export default function BillViewScreen() {
  const router = useRouter();
  const { billId, eventId, tripId } = useLocalSearchParams();

  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventMembers, setEventMembers] = useState<TripMember[]>([]);

  useEffect(() => {
    if (!billId || !eventId || !tripId) {
      setIsLoading(false);
      return;
    }

    const fetchBillAndMembers = async () => {
      try {
        const billDoc = await firestore().collection('bills').doc(billId as string).get();
        if (!billDoc.exists) {
          setBill(null);
          setIsLoading(false);
          return;
        }

        const billData = billDoc.data();
        const fetchedBill: Bill = {
          id: billDoc.id,
          billName: billData?.billName,
          billEvent: billData?.billEvent,
          billDateTime: billData?.billDateTime.toDate(),
          billUserIds: billData?.billUserIds || [],
          billItems: billData?.billItems || [],
          whoPaid: billData?.whoPaid || [],
        };
        setBill(fetchedBill);

        const tripDoc = await firestore().collection('trips').doc(tripId as string).get();
        if ((tripDoc.exists())) {
          const tripData = tripDoc.data();
          const allTripMembers: any[] = tripData?.members || [];
          const resolvedMembers: TripMember[] = await Promise.all(
            fetchedBill.billUserIds.map(async memberUid => {
              const foundMember = allTripMembers.find((m: any) => m.uid === memberUid);
              if (foundMember) {
                const userDoc = await firestore().collection('users').doc(memberUid).get();
                const userData = userDoc.data();
                return {
                  id: memberUid,
                  username: userData?.username,
                  displayName: userData?.displayName,
                };
              }
              return {
                id: memberUid,
                username: 'unknown',
                displayName: 'Unknown User',
              };
            })
          );
          setEventMembers(resolvedMembers);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching bill or members:', error);
        setBill(null);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to load bill details.');
      }
    };

    fetchBillAndMembers();
  }, [billId, eventId, tripId]);

  const getMemberDisplayName = (uid: string) => {
    return eventMembers.find(member => member.id === uid)?.displayName || 'Unknown User';
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

  const calculateTotalBillAmount = () => {
    return bill?.billItems.reduce((sum, item) => sum + item.billItemPrice, 0) || 0;
  };

  const calculateTotalPaidAmount = () => {
    return bill?.whoPaid.reduce((sum, payer) => sum + payer.amountPaid, 0) || 0;
  };

  const handleGoBack = () => {
    router.push({
      pathname: '/bills',
      params: { eventId: eventId, tripId: tripId },
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.loadingTitle}>Loading Bill...</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Loading bill details...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!bill) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.loadingTitle}>Not Found</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Bill not found.</Text>
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
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.screenTitle}>Bill Details</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{bill.billName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date & Time:</Text>
              <Text style={styles.infoValue}>{formatDateTime(bill.billDateTime)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Items</Text>
            {bill.billItems.length === 0 ? (
              <Text style={styles.noDataText}>No items for this bill.</Text>
            ) : (
              bill.billItems.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <Text style={styles.itemName}>{item.billItemName}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemPrice}>${item.billItemPrice.toFixed(2)}</Text>
                    <Text style={styles.itemUsers}>
                      For:{' '}
                      {item.billItemUserIds
                        .map(uid => getMemberDisplayName(uid))
                        .join(', ')}
                    </Text>
                  </View>
                  <Text style={styles.costPerUser}>
                    Cost per user: ${item.costPerUser.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Bill Amount:</Text>
              <Text style={styles.totalValue}>${calculateTotalBillAmount().toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who Paid?</Text>
            {bill.whoPaid.length === 0 ? (
              <Text style={styles.noDataText}>No one recorded as paid for this bill.</Text>
            ) : (
              bill.whoPaid.map((payer, index) => (
                <View key={index} style={styles.payerCard}>
                  <Text style={styles.payerName}>{getMemberDisplayName(payer.uid)}</Text>
                  <Text style={styles.payerAmount}>Paid: ${payer.amountPaid.toFixed(2)}</Text>
                </View>
              ))
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount Paid:</Text>
              <Text style={styles.totalValue}>${calculateTotalPaidAmount().toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
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
  screenTitle: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#bbb',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'normal',
  },
  noDataText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 10,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    color: '#0a84ff',
    fontWeight: 'bold',
  },
  itemUsers: {
    fontSize: 14,
    color: '#aaa',
    flexShrink: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
  costPerUser: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0a84ff',
  },
  payerCard: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  payerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  payerAmount: {
    fontSize: 16,
    color: '#4cd964',
    fontWeight: 'bold',
  },
});