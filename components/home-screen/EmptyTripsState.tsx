import { Text, View } from 'react-native';
import { styles } from '../../styles/HomeScreenStyles';

interface EmptyStateProps {
  tripFilter: 'active' | 'concluded';
}

export function EmptyState({ tripFilter }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No trips yet</Text>
      <Text style={styles.emptyStateSubtext}>
        {tripFilter === 'active'
          ? 'Create your first group trip to get started!'
          : 'You have no concluded trips yet.'}
      </Text>
    </View>
  );
}