import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { ProfileGreeting } from '../../components/profile-screen/ProfileGreeting';
import { ProfileSettingsButtons } from '../../components/profile-screen/ProfileSettingsButtons';
import { ProfileSettingsModal } from '../../components/profile-screen/ProfileSettingsModal';
import { ProfileSignOutButton } from '../../components/profile-screen/ProfileSignOutButton';
import { useProfileScreenLogic } from '../../hooks/useProfileScreenLogic';
import { styles } from '../../styles/ProfileScreenStyles';

export default function ProfileScreen() {
  const {
    currentUser,
    greeting,
    isModalVisible,
    modalType,
    newValue,
    setNewValue,
    setModalType,
    setIsModalVisible,
    updateUserData,
  } = useProfileScreenLogic();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1e1e1e" barStyle="light-content" />

      <ProfileGreeting currentUser={currentUser} greeting={greeting} />

      <ProfileSettingsButtons
        onPressChangeDisplayName={() => {
          setModalType('displayName');
          setIsModalVisible(true);
        }}
        onPressChangeUsername={() => {
          setModalType('username');
          setIsModalVisible(true);
        }}
        onPressChangePassword={() => {
          setModalType('password');
          setIsModalVisible(true);
        }}
      />

      <ProfileSignOutButton />

      <ProfileSettingsModal
        isModalVisible={isModalVisible}
        modalType={modalType}
        newValue={newValue}
        setNewValue={setNewValue}
        setIsModalVisible={setIsModalVisible}
        onSave={updateUserData}
      />
    </SafeAreaView>
  );
}