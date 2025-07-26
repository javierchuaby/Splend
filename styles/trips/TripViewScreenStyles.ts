import { StyleSheet } from 'react-native';
import { AppColors } from '../AppColors';
import { AppTypography } from '../AppTypography';
import { GlobalStyles } from '../GlobalStyles';

export const styles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    backgroundColor: AppColors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColors.backgroundSecondary,
  },
  backButton: {
    fontSize: AppTypography.fontSizeLarge,
    color: AppColors.textHyperlink,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightBold,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  tripSubtitle: {
    fontSize: AppTypography.fontSizeSmall,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  loadingTitle: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightBold,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  placeholder: {
    width: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: AppTypography.fontSizeLarge,
    color: AppColors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: AppTypography.fontSizeTitle,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textLight,
    textAlign: 'center',
  },
  eventsList: {
    padding: 20,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: AppColors.backgroundCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  eventDates: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  eventMembersCount: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textLight,
    marginBottom: 4,
  },
  eventMembersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  eventMemberName: {
    fontSize: AppTypography.fontSizeSmall,
    color: AppColors.textDarkGrey,
  },
  createEventSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.backgroundSecondary,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  createEventButton: {
    backgroundColor: AppColors.accentBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createEventButtonText: {
    color: AppColors.textPrimary,
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
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
  createButton: {
    ...GlobalStyles.saveButton,
  },
  modalContent: {
    ...GlobalStyles.modalContent,
  },
  inputSection: {
    ...GlobalStyles.inputSection,
  },
  inputLabel: {
    ...GlobalStyles.inputLabel,
  },
  textInput: {
    ...GlobalStyles.textInput,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.borderPrimary,
    borderRadius: 8,
    padding: 12,
    backgroundColor: AppColors.backgroundPrimary,
  },
  dateButtonText: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  searchResults: {
    ...GlobalStyles.searchResults,
  },
  searchResultItem: {
    ...GlobalStyles.searchResultItem,
  },
  searchResultText: {
    ...GlobalStyles.searchResultText,
  },
  usernameText: {
    ...GlobalStyles.usernameText,
  },
  noResultsText: {
    ...GlobalStyles.noResultsText,
  },
  loadingText: {
    ...GlobalStyles.loadingText,
  },
  selectedMembers: {
    ...GlobalStyles.selectedMembers,
  },
  selectedMembersTitle: {
    ...GlobalStyles.selectedMembersTitle,
  },
  selectedMemberItem: {
    ...GlobalStyles.selectedMemberItem,
  },
  selectedMemberText: {
    ...GlobalStyles.selectedMemberText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  removeMemberButton: {
    ...GlobalStyles.removeMemberButton,
  },
  datePickerOverlay: {
    ...GlobalStyles.datePickerOverlay,
  },
  datePickerContainer: {
    ...GlobalStyles.datePickerContainer,
  },
  datePickerHeader: {
    ...GlobalStyles.datePickerHeader,
  },
  datePickerCancel: {
    ...GlobalStyles.datePickerCancel,
  },
  datePickerTitle: {
    ...GlobalStyles.datePickerTitle,
  },
  datePickerDone: {
    ...GlobalStyles.datePickerDone,
  },
  pickerRow: {
    ...GlobalStyles.pickerRow,
  },
  picker: {
    ...GlobalStyles.picker,
  },
});