import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { DatePickerModal } from '../../components/DatePickerModal';
import { CreateEventSection } from '../../components/trip-view-screen/CreateEventSection';
import { EmptyEventsState } from '../../components/trip-view-screen/EmptyEventsState';
import { EventsList } from '../../components/trip-view-screen/EventsList';
import { NewEventModal } from '../../components/trip-view-screen/NewEventModal';
import { TripViewErrorState } from '../../components/trip-view-screen/TripViewErrorState';
import { TripViewHeader } from '../../components/trip-view-screen/TripViewHeader';
import { TripViewLoadingState } from '../../components/trip-view-screen/TripViewLoadingState';
import { useTripViewLogic } from '../../hooks/useTripViewLogic';
import { styles } from '../../styles/TripViewScreenStyles';

export default function TripViewScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();

  const {
    trip,
    currentUser,
    hasAccess,
    isLoading,
    events,
    isModalVisible,
    setIsModalVisible,
    newEventName,
    setNewEventName,
    newEventLocation,
    setNewEventLocation,
    newEventStartDate,
    setNewEventStartDate,
    newEventEndDate,
    setNewEventEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    selectedEventMembers,
    setSelectedEventMembers,
    memberSearchQuery,
    setMemberSearchQuery,
    searchResults,
    isLoadingUsers,
    navigateToInfo,
    createEvent,
    addEventMember,
    removeEventMember,
    formatDate,
    formatDateTime,
    generateDateOptions,
    handleStartDateDone,
    handleEndDateDone,
    navigateToEvent,
  } = useTripViewLogic(tripId as string); // Pass tripId to the hook

  const { years, months, days } = generateDateOptions();

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <TripViewLoadingState router={router} />
      </>
    );
  }

  if (!trip || !hasAccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <TripViewErrorState router={router} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#121212" barStyle="light-content" />

        <TripViewHeader
          tripName={trip.name}
          onBackPress={() => router.back()} // Navigate back to Home
          onInfoPress={navigateToInfo}
        />

        {events.length === 0 ? (
          <EmptyEventsState />
        ) : (
          <EventsList
            events={events}
            tripMembers={trip.members}
            formatDateTime={formatDateTime}
            navigateToEvent={navigateToEvent}
          />
        )}

        <CreateEventSection
          onCreateEventPress={() => {
            setIsModalVisible(true);
            if (currentUser && !selectedEventMembers.some(m => m.id === currentUser.id)) {
              setSelectedEventMembers([currentUser]);
            } else if (currentUser && selectedEventMembers.length === 0) {
              setSelectedEventMembers([currentUser]);
            }
          }}
        />

        <NewEventModal
          isModalVisible={isModalVisible}
          setIsModalVisible={setIsModalVisible}
          newEventName={newEventName}
          setNewEventName={setNewEventName}
          newEventLocation={newEventLocation}
          setNewEventLocation={setNewEventLocation}
          newEventStartDate={newEventStartDate}
          newEventEndDate={newEventEndDate}
          setShowStartDatePicker={setShowStartDatePicker}
          setShowEndDatePicker={setShowEndDatePicker}
          memberSearchQuery={memberSearchQuery}
          setMemberSearchQuery={setMemberSearchQuery}
          isLoadingUsers={isLoadingUsers}
          searchResults={searchResults}
          addEventMember={addEventMember}
          selectedEventMembers={selectedEventMembers}
          removeEventMember={removeEventMember}
          currentUser={currentUser}
          createEvent={createEvent}
          formatDateTime={formatDateTime}
        />

        <DatePickerModal
          isVisible={showStartDatePicker}
          setIsVisible={setShowStartDatePicker}
          date={tempStartDate}
          setDate={setTempStartDate}
          onDone={handleStartDateDone}
          title="Select Start Date"
          years={years}
          months={months}
          days={days}
        />

        <DatePickerModal
          isVisible={showEndDatePicker}
          setIsVisible={setShowEndDatePicker}
          date={tempEndDate}
          setDate={setTempEndDate}
          onDone={handleEndDateDone}
          title="Select End Date"
          years={years}
          months={months}
          days={days}
        />
      </SafeAreaView>
    </>
  );
}