import { BillSettlementManager } from '@/components/BillSettlementManager';
import TripPackingListPreview from '@/components/TripPackingListPreview';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { DateSelectionModal } from '../../components/DateSelectionModal';
import { ManageTripSection } from '../../components/trip-info-screen/ManageTripSection'; // ADD THIS IMPORT
import { TripInfoDescriptionCard } from '../../components/trip-info-screen/TripInfoDescriptionCard';
import { TripInfoDurationSection } from '../../components/trip-info-screen/TripInfoDurationSection';
import { TripInfoErrorState } from '../../components/trip-info-screen/TripInfoErrorState';
import { TripInfoLedgersSection } from '../../components/trip-info-screen/TripInfoLedgersSection';
import { TripInfoLoadingState } from '../../components/trip-info-screen/TripInfoLoadingState';
import { TripInfoMembersCard } from '../../components/trip-info-screen/TripInfoMembersCard';
import { TripInfoScreenHeader } from '../../components/trip-info-screen/TripInfoScreenHeader';
import { useTripInfoLogic } from '../../hooks/useTripInfoLogic';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

export default function TripInfoScreen() {
  const { tripId } = useLocalSearchParams();
  const {
    trip,
    isLoading,
    hasAccess,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    showSettlement,
    setShowSettlement,
    isFromConcludeFlow,
    deleteTrip,
    concludeTrip,
    formatDate,
    calculateDuration,
    navigateToMembers,
    navigateToDescription,
    years,
    months,
    days,
    handleStartDateDone,
    handleEndDateDone,
    groupLedger,
    individualLedger,
    handleSettlementClose,
  } = useTripInfoLogic(tripId as string);

  if (isLoading) {
    return <TripInfoLoadingState />;
  }

  if (!trip || !hasAccess) {
    return <TripInfoErrorState tripId={tripId} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TripInfoScreenHeader/>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.tripTitle}>{trip.name}</Text>

          <TripInfoDescriptionCard
            description={trip.tripDescription}
            onPress={navigateToDescription}
          />

          <TripInfoDurationSection
            startDate={trip.startDate}
            endDate={trip.endDate}
            onStartDatePress={() => {
              setTempStartDate(new Date(trip.startDate));
              setShowStartDatePicker(true);
            }}
            onEndDatePress={() => {
              setTempEndDate(new Date(trip.endDate));
              setShowEndDatePicker(true);
            }}
            formatDate={formatDate}
            calculateDuration={calculateDuration}
          />

          <TripInfoMembersCard members={trip.members} onPress={navigateToMembers} />

          <TripInfoLedgersSection
            groupLedger={groupLedger}
            individualLedger={individualLedger}
            onCalculateSettlementPress={() => {
              setShowSettlement(true);
            }}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Packing List</Text>
            <TripPackingListPreview tripId={tripId as string} />
          </View>

          <ManageTripSection
            onSplitBills={() => {
              setShowSettlement(true);
            }}
            onConcludeTrip={concludeTrip}
            onDeleteTrip={deleteTrip}
            isTripConcluded={trip.isConcluded}
          />
        </View>
      </ScrollView>

      <DateSelectionModal
        isVisible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDone={handleStartDateDone}
        selectedDate={tempStartDate}
        onDateChange={setTempStartDate}
        title="Select Start Date"
        years={years}
        months={months}
        days={days}
      />

      <DateSelectionModal
        isVisible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDone={handleEndDateDone}
        selectedDate={tempEndDate}
        onDateChange={setTempEndDate}
        title="Select End Date"
        years={years}
        months={months}
        days={days}
      />

      <BillSettlementManager
        tripId={tripId as string}
        tripName={trip.name}
        visible={showSettlement}
        onClose={handleSettlementClose}
      />
    </SafeAreaView>
  );
}