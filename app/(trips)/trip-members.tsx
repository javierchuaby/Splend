import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { AddMemberSection } from '../../components/trip-members-screen/AddMemberSection';
import { CurrentMembersList } from '../../components/trip-members-screen/CurrentMembersList';
import { TripMembersErrorState } from '../../components/trip-members-screen/TripMembersErrorState';
import { TripMembersLoadingState } from '../../components/trip-members-screen/TripMembersLoadingState';
import { TripMembersScreenHeader } from '../../components/trip-members-screen/TripMembersScreenHeader';
import { useTripMembersLogic } from '../../hooks/useTripMembersLogic';
import { TripMembersScreenStyles as styles } from '../../styles/TripMembersScreenStyles';

export default function TripMembersScreen() {
  const { tripId } = useLocalSearchParams();
  const {
    isLoadingTrip,
    hasAccess,
    handleBackPress,
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoadingUsers,
    addMember,
    orderedMembers,
    currentUser,
    removeMember,
  } = useTripMembersLogic({ tripId });

  if (isLoadingTrip) {
    return <TripMembersLoadingState />;
  }

  if (!hasAccess) {
    return <TripMembersErrorState />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TripMembersScreenHeader onBackPress={handleBackPress} />
      <View style={styles.content}>
        <AddMemberSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          isLoadingUsers={isLoadingUsers}
          onAddMember={addMember}
        />
        <CurrentMembersList
          orderedMembers={orderedMembers}
          currentUserUid={currentUser ? currentUser.id : null}
          onRemoveMember={removeMember}
        />
      </View>
    </SafeAreaView>
  );
}