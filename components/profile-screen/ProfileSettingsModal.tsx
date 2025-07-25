import React from 'react';
import {
    Modal,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { styles } from '../../styles/ProfileScreenStyles';

interface ProfileSettingsModalProps {
  isModalVisible: boolean;
  modalType: 'displayName' | 'username' | 'password' | null;
  newValue: string;
  setNewValue: (value: string) => void;
  setIsModalVisible: (visible: boolean) => void;
  onSave: () => void;
}

export function ProfileSettingsModal({
  isModalVisible,
  modalType,
  newValue,
  setNewValue,
  setIsModalVisible,
  onSave,
}: ProfileSettingsModalProps) {
  const getModalTitle = () => {
    switch (modalType) {
      case 'displayName':
        return 'Change Display Name';
      case 'username':
        return 'Change Username';
      case 'password':
        return 'Change Password';
      default:
        return '';
    }
  };

  const getPlaceholder = () => {
    switch (modalType) {
      case 'displayName':
        return 'Enter new display name';
      case 'username':
        return 'Enter new username';
      case 'password':
        return 'Enter new password';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{getModalTitle()}</Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.textInput}
            value={newValue}
            onChangeText={setNewValue}
            placeholder={getPlaceholder()}
            placeholderTextColor="#777"
            secureTextEntry={modalType === 'password'}
            keyboardAppearance="dark"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}