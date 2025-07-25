import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { TripInfoScreenStyles as styles } from '../styles/TripInfoScreenStyles';
import { MonthOption } from '../types/TripTypes'; // Import MonthOption

interface DateSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDone: () => void;
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
  title: string;
  years: number[];
  months: MonthOption[];
  days: number[];
}

export const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
  isVisible,
  onClose,
  onDone,
  selectedDate,
  onDateChange,
  title,
  years,
  months,
  days,
}) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <TouchableOpacity onPress={onClose}>
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
              selectedValue={selectedDate.getFullYear()}
              onValueChange={value => {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(value);
                onDateChange(newDate);
              }}
              dropdownIconColor="#fff"
              itemStyle={{ color: '#fff' }}
            >
              {years.map(year => (
                <Picker.Item key={year} label={year.toString()} value={year} />
              ))}
            </Picker>

            <Picker
              style={styles.picker}
              selectedValue={selectedDate.getMonth()}
              onValueChange={value => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(value);
                onDateChange(newDate);
              }}
              dropdownIconColor="#fff"
              itemStyle={{ color: '#fff' }}
            >
              {months.map(month => (
                <Picker.Item
                  key={month.value}
                  label={month.label}
                  value={month.value}
                />
              ))}
            </Picker>

            <Picker
              style={styles.picker}
              selectedValue={selectedDate.getDate()}
              onValueChange={value => {
                const newDate = new Date(selectedDate);
                newDate.setDate(value);
                onDateChange(newDate);
              }}
              dropdownIconColor="#fff"
              itemStyle={{ color: '#fff' }}
            >
              {days.map(day => (
                <Picker.Item key={day} label={day.toString()} value={day} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </Modal>
  );
};