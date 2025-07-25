import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/TripViewScreenStyles';

interface TripViewLoadingStateProps {
  router: ReturnType<typeof useRouter>;
}

export function TripViewLoadingState({ router }: TripViewLoadingStateProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/Home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.loadingTitle}>Loading...</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Loading trip and events...</Text>
      </View>
    </SafeAreaView>
  );
}