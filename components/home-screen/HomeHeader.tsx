import { MaterialIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/HomeScreenStyles';

interface HomeHeaderProps {
  tripFilter: 'active' | 'concluded';
  setTripFilter: (filter: 'active' | 'concluded') => void;
  isDropdownVisible: boolean;
  setIsDropdownVisible: (isVisible: boolean) => void;
  onNewTripPress: () => void;
}

export function HomeHeader({
  tripFilter,
  setTripFilter,
  isDropdownVisible,
  setIsDropdownVisible,
  onNewTripPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.titleButton}
          onPress={() => setIsDropdownVisible(!isDropdownVisible)}
        >
          <Text style={styles.title}>
            {tripFilter === 'active' ? 'My Trips' : 'Concluded'}
          </Text>
          <MaterialIcons
            name={isDropdownVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#fff"
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>
        {isDropdownVisible && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setTripFilter('active');
                setIsDropdownVisible(false);
              }}
            >
              <Text style={styles.dropdownItemText}>My Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setTripFilter('concluded');
                setIsDropdownVisible(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Concluded</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.newTripButton} onPress={onNewTripPress}>
        <Text style={styles.newTripButtonText}>+ New Trip</Text>
      </TouchableOpacity>
    </View>
  );
}