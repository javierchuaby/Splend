import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { TripDescriptionDisplay } from '../../components/trip-description-screen/TripDescriptionDisplay';
import { TripDescriptionEditor } from '../../components/trip-description-screen/TripDescriptionEditor';
import { TripDescriptionHeader } from '../../components/trip-description-screen/TripDescriptionHeader';
import { TripDescriptionLoadingState } from '../../components/trip-description-screen/TripDescriptionLoadingState';
import { useTripDescriptionLogic } from '../../hooks/useTripDescriptionLogic';
import { TripDescriptionScreenStyles as styles } from '../../styles/TripDescriptionScreenStyles';

export default function TripDescriptionScreen() {
  const { tripId } = useLocalSearchParams();
  const {
    description,
    setDescription,
    isLoading,
    isEditing,
    handleSave,
    handleCancel,
    handleEditPress,
    handleBackPress,
    isSaveDisabled,
  } = useTripDescriptionLogic({ tripId });

  if (isLoading) {
    return <TripDescriptionLoadingState />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TripDescriptionHeader
        isEditing={isEditing}
        onBackPress={handleBackPress}
        onCancel={handleCancel}
        onSave={handleSave}
        onEditPress={handleEditPress}
        isSaveDisabled={isSaveDisabled}
      />

      <View style={styles.content}>
        {isEditing ? (
          <TripDescriptionEditor
            description={description}
            onChangeText={setDescription}
          />
        ) : (
          <TripDescriptionDisplay description={description} />
        )}
      </View>
    </SafeAreaView>
  );
}