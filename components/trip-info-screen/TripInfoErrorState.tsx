import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

interface TripInfoErrorStateProps {
  tripId: string | string[];
}

export const TripInfoErrorState: React.FC<TripInfoErrorStateProps> = ({
  tripId,
}) => {
  const router = useRouter();
  const handleManagePress = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/(tabs)/Home', 
            });
          }}
        >
          <Text style={styles.backButton}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Error</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Trip not found or you don't have access.
        </Text>
      </View>
    </SafeAreaView>
  );
};