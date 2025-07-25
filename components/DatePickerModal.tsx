import { Picker } from '@react-native-picker/picker';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/HomeScreenStyles';
import { MonthOption } from '../types/TripTypes';

interface DatePickerModalProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  date: Date;
  setDate: (date: Date) => void;
  onDone: () => void;
  title: string;
  years: number[];
  months: MonthOption[];
  days: number[];
}

export function DatePickerModal({
  isVisible,
  setIsVisible,
  date,
  setDate,
  onDone,
  title,
  years,
  months,
  days,
}: DatePickerModalProps) {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsVisible(false)}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Text style={styles.datePickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.datePickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onDone}>
              <Text style={styles.datePickerDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            <Picker
              style={styles.picker}
              selectedValue={date.getFullYear()}
              onValueChange={(value) => {
                const newDate = new Date(date);
                newDate.setFullYear(value);
                setDate(newDate);
              }}
              dropdownIconColor="#fff"
              itemStyle={{ color: '#fff' }}
            >
              {years.map((year) => (
                <Picker.Item key={year} label={year.toString()} value={year} />
              ))}
            </Picker>

            <Picker
              style={styles.picker}
              selectedValue={date.getMonth()}
              onValueChange={(value) => {
                const newDate = new Date(date);
                newDate.setMonth(value);
                setDate(newDate);
              }}
              dropdownIconColor="#fff"
              itemStyle={{ color: '#fff' }}
            >
              {months.map((month) => (
                <Picker.Item
                  key={month.value}
                  label={month.label}
                  value={month.value}
                />
              ))}
            </Picker>

            <Picker
              style={styles.picker}
              selectedValue={date.getDate()}
              onValueChange={(value) => {
                const newDate = new Date(date);
                newDate.setDate(value);
                setDate(newDate);
              }}
              dropdownIconColor="#fff"
              itemStyle={{ color: '#fff' }}
            >
              {days.map((day) => (
                <Picker.Item key={day} label={day.toString()} value={day} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </Modal>
  );
}