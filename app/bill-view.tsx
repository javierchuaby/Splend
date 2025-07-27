import firestore from '@react-native-firebase/firestore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../styles/BillViewScreenStyles';

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
        if (tripDoc.exists()) {
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
    // router.replace({
    //   pathname: '/event-view',
    //   params: { eventId: eventId, tripId: tripId },
    // });
    router.back();
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