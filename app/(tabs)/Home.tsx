import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DatePickerModal } from '../../components/DatePickerModal';
import { EmptyState } from '../../components/home-screen/EmptyTripsState';
import { HomeHeader } from '../../components/home-screen/HomeHeader';
import { NewTripModal } from '../../components/home-screen/NewTripModal';
import { TripsList } from '../../components/home-screen/TripsList';
import { useHomeScreenLogic } from '../../hooks/useHomeScreenLogic';
import { styles } from '../../styles/HomeScreenStyles';

export default function HomeScreen() {
  const {
    trips,
    isModalVisible,
    setIsModalVisible,
    newTripName,
    setNewTripName,
    newTripDescription,
    setNewTripDescription,
    selectedMembers,
    setSelectedMembers,
    memberSearchQuery,
    setMemberSearchQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    currentUser,
    searchResults,
    isLoadingUsers,
    tempStartDate,
    setTempStartDate,
    tempEndDate,
    setTempEndDate,
    isDropdownVisible,
    setIsDropdownVisible,
    tripFilter,
    setTripFilter,
    createTrip,
    addMember,
    removeMember,
    formatDate,
    generateDateOptions,
    handleStartDateDone,
    handleEndDateDone,
    navigateToTrip,
  } = useHomeScreenLogic();

  const { years, months, days } = generateDateOptions();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e1e1e" barStyle="light-content" />

      <HomeHeader
        tripFilter={tripFilter}
        setTripFilter={setTripFilter}
        isDropdownVisible={isDropdownVisible}
        setIsDropdownVisible={setIsDropdownVisible}
        onNewTripPress={() => {
          setIsModalVisible(true);
          if (currentUser) {
            setSelectedMembers([currentUser]);
          }
        }}
      />

      {trips.length === 0 ? (
        <EmptyState tripFilter={tripFilter} />
      ) : (
        <TripsList trips={trips} navigateToTrip={navigateToTrip} />
      )}

      <NewTripModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        newTripName={newTripName}
        setNewTripName={setNewTripName}
        newTripDescription={newTripDescription}
        setNewTripDescription={setNewTripDescription}
        startDate={startDate}
        endDate={endDate}
        setShowStartDatePicker={setShowStartDatePicker}
        setShowEndDatePicker={setShowEndDatePicker}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        isLoadingUsers={isLoadingUsers}
        searchResults={searchResults}
        addMember={addMember}
        selectedMembers={selectedMembers}
        removeMember={removeMember}
        currentUser={currentUser}
        createTrip={createTrip}
        formatDate={formatDate}
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
  );
}