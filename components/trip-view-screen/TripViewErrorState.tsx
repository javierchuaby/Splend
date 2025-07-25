
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/TripViewScreenStyles';

interface TripViewErrorStateProps {
  router: ReturnType<typeof useRouter>;
}

export function TripViewErrorState({ router }: TripViewErrorStateProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/Home')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.loadingTitle}>Not Found</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Trip not found or you don't have access.
        </Text>
      </View>
    </SafeAreaView>
  );
}