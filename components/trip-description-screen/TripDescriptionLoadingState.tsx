import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { TripDescriptionScreenStyles as styles } from '../../styles/TripDescriptionScreenStyles';
import { TripDescriptionHeader } from './TripDescriptionHeader';

export const TripDescriptionLoadingState: React.FC = () => {
  // Dummy functions for header, as buttons are not interactive in loading state
  const dummyFn = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <TripDescriptionHeader
        isEditing={false}
        onBackPress={dummyFn}
        onCancel={dummyFn}
        onSave={dummyFn}
        onEditPress={dummyFn}
        isSaveDisabled={true}
      />
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading description...</Text>
      </View>
    </SafeAreaView>
  );
};