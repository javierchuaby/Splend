
import { StyleSheet } from 'react-native';
import { AppColors } from './AppColors';
import { AppTypography } from './AppTypography';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundPrimary, // Use color variable
  },
  // Generic section padding/margin
  sectionPadding: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // Common modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderPrimary,
  },
  modalTitle: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
  },
  cancelButton: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
  },
  saveButton: { // or createButton in some contexts
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
    fontWeight: AppTypography.fontWeightSemiBold,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Common input styles
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: AppTypography.fontSizeRegular,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: AppColors.borderPrimary,
    borderRadius: 8,
    padding: 12,
    fontSize: AppTypography.fontSizeRegular,
    backgroundColor: AppColors.backgroundPrimary, // Or AppColors.backgroundInput
    color: AppColors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Common button styles (base)
  baseButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  baseButtonText: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
  },
  // Common date picker modal styles (already a component, but styles can be global)
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: AppColors.backgroundPrimary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderPrimary,
  },
  datePickerCancel: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
  },
  datePickerTitle: {
    fontSize: AppTypography.fontSizeRegular,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
  },
  datePickerDone: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
    fontWeight: AppTypography.fontWeightSemiBold,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
    backgroundColor: AppColors.backgroundPrimary,
  },
  picker: {
    flex: 1,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.backgroundPrimary,
  },
  // Common search results styles
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: AppColors.borderPrimary,
    borderRadius: 8,
    backgroundColor: AppColors.backgroundPrimary,
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderPrimary,
  },
  searchResultText: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textPrimary,
  },
  usernameText: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textDarkGrey,
  },
  noResultsText: {
    padding: 12,
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textDarkGrey,
    textAlign: 'center',
  },
  loadingText: {
    padding: 12,
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  selectedMembers: {
    marginTop: 16,
  },
  selectedMembersTitle: {
    fontSize: AppTypography.fontSizeMedium,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textLight,
    marginBottom: 8,
  },
  selectedMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.dropdownBackground,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedMemberText: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textPrimary,
  },
  removeMemberButton: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.redError,
    fontWeight: AppTypography.fontWeightBold,
    paddingHorizontal: 2,
  },
});