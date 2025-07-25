import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../../styles/TripInfoScreenStyles';

interface TripInfoLedgersSectionProps {
  groupLedger: number;
  individualLedger: number;
  onCalculateSettlementPress: () => void;
}

export const TripInfoLedgersSection: React.FC<TripInfoLedgersSectionProps> = ({
  groupLedger,
  individualLedger,
  onCalculateSettlementPress,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ledgers</Text>
      <View style={styles.ledgerCard}>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>Group Ledger:</Text>
          <Text style={styles.ledgerValue}>${groupLedger.toFixed(2)}</Text>
        </View>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>Your Ledger:</Text>
          <Text style={styles.ledgerValue}>${individualLedger.toFixed(2)}</Text>
        </View>

        <View style={styles.ledgerSeparator} />

        <TouchableOpacity
          style={styles.settlementButtonCompact}
          onPress={onCalculateSettlementPress}
        >
          <Text style={styles.settlementButtonCompactText}>
            Calculate Bill Settlement
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};