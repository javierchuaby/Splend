import { StyleSheet } from 'react-native';
import { AppColors } from './AppColors';
import { AppTypography } from './AppTypography';
import { GlobalStyles } from './GlobalStyles';

export const TripDescriptionScreenStyles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderPrimary,
    backgroundColor: AppColors.backgroundSecondary,
  },
  headerTitle: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
  },
  backButton: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
  },
  cancelButton: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.redError,
  },
  editButton: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
    fontWeight: AppTypography.fontWeightSemiBold,
  },
  saveButton: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
    fontWeight: AppTypography.fontWeightSemiBold,
  },
  saveButtonDisabled: {
    color: AppColors.textLight,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  textArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.borderPrimary,
    borderRadius: 8,
    padding: 12,
    fontSize: AppTypography.fontSizeRegular,
    backgroundColor: AppColors.backgroundCard,
    color: AppColors.textPrimary,
    textAlignVertical: 'top',
  },
  textBoxScrollView: {
    flex: 1,
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderPrimary,
    padding: 12,
  },
  descriptionDisplay: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textPrimary,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textSecondary,
  },
});