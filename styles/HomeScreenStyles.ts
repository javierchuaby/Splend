// refactored_styles.ts
import { StyleSheet } from 'react-native';
import { AppColors } from './AppColors';
import { AppTypography } from './AppTypography';
import { GlobalStyles } from './GlobalStyles';

export const styles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
  },
  pageTitleContainer: {
    paddingTop: 0,
    paddingBottom: 2,
    backgroundColor: AppColors.backgroundPrimary,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: AppTypography.fontSizePageTitle,
    fontWeight: AppTypography.fontWeightBold,
    color: AppColors.accentBlue,
  },
  header: {
    ...GlobalStyles.modalHeader,
    backgroundColor: AppColors.backgroundPrimary,
    borderBottomColor: AppColors.borderPrimary,
    zIndex: 10,
  },
  headerLeft: {
    position: 'relative',
  },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: AppTypography.fontSizeTitle,
    fontWeight: AppTypography.fontWeightBold,
    color: AppColors.textPrimary,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: AppColors.dropdownBackground,
    borderRadius: 8,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    width: 150,
    marginTop: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dropdownBorder,
  },
  dropdownItemText: {
    color: AppColors.textPrimary,
    fontSize: AppTypography.fontSizeRegular,
  },
  newTripButton: {
    backgroundColor: AppColors.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newTripButtonText: {
    color: AppColors.textPrimary,
    fontWeight: AppTypography.fontWeightSemiBold,
    fontSize: AppTypography.fontSizeRegular,
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
  tripsList: {
    padding: 20,
  },
  tripCard: {
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
  tripName: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  tripDates: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  tripMembers: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textLight,
    marginBottom: 4,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: AppTypography.fontSizeSmall,
    color: AppColors.textDarkGrey,
  },
  modalContainer: {
    ...GlobalStyles.modalContainer,
    backgroundColor: AppColors.backgroundSecondary,
  },
  modalHeader: {
    ...GlobalStyles.modalHeader,
    borderBottomColor: AppColors.borderPrimary,
  },
  cancelButton: {
    ...GlobalStyles.cancelButton,
  },
  modalTitle: {
    ...GlobalStyles.modalTitle,
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
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
  textArea: {
    ...GlobalStyles.textArea,
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
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 0,
  },
  signOutWelcomeText: {
    color: AppColors.textPrimary,
    fontSize: AppTypography.fontSizeMedium,
    marginBottom: 0,
  },
  signOutContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  signOutButton: {
    backgroundColor: AppColors.backgroundPrimary,
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: AppColors.textPrimary,
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingBottom: 50,
  },
});