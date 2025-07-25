import { StyleSheet } from 'react-native';
import { AppColors } from './AppColors';
import { AppTypography } from './AppTypography';
import { GlobalStyles } from './GlobalStyles';

export const styles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textSecondary,
  },
  displayNameText: {
    fontSize: AppTypography.fontSizePageTitle,
    fontWeight: AppTypography.fontWeightBold,
    color: AppColors.textPrimary,
    marginTop: 8,
  },
  settingsContainer: {
    flex: 2,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  settingsButton: {
    backgroundColor: AppColors.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    fontSize: AppTypography.fontSizeRegular,
    fontWeight: AppTypography.fontWeightMedium,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  signOutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  signOutButton: {
    backgroundColor: AppColors.redError,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: AppTypography.fontSizeRegular,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
  },
  modalContainer: {
    ...GlobalStyles.modalContainer,
  },
  modalHeader: {
    ...GlobalStyles.modalHeader,
  },
  cancelButton: {
    ...GlobalStyles.cancelButton,
  },
  modalTitle: {
    ...GlobalStyles.modalTitle,
  },
  saveButton: {
    ...GlobalStyles.saveButton,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  textInput: {
    ...GlobalStyles.textInput,
  },
});