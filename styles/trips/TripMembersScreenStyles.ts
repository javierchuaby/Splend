import { StyleSheet } from 'react-native';
import { AppColors } from '../AppColors';
import { AppTypography } from '../AppTypography';
import { GlobalStyles } from '../GlobalStyles'; // For common styles like container, textInput, searchResults etc.

export const TripMembersScreenStyles = StyleSheet.create({
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
    backgroundColor: AppColors.backgroundSecondary,
  },
  backButton: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textHyperlink,
  },
  headerTitle: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addMemberSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: AppTypography.fontSizeLarge,
    fontWeight: AppTypography.fontWeightSemiBold,
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  searchInput: {
    ...GlobalStyles.textInput, // Reusing global input styles
    marginBottom: 8,
    backgroundColor: AppColors.backgroundCard, // Specific background for search
    borderColor: AppColors.borderPrimary,
    color: AppColors.textPrimary,
  },
  searchResults: {
    ...GlobalStyles.searchResults, // Reusing global search results container
    maxHeight: 200, // Specific max height
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButtonText: {
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textHyperlink,
    fontWeight: AppTypography.fontWeightMedium,
  },
  noResultsText: {
    ...GlobalStyles.noResultsText, // Reusing global no results text
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textDarkGrey,
  },
  loadingText: {
    ...GlobalStyles.loadingText, // Reusing global loading text
    fontSize: AppTypography.fontSizeMedium,
    color: AppColors.textSecondary,
  },
  membersSection: {
    flex: 1,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundCard,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: AppColors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  memberUsername: {
    flexShrink: 1,
    overflow: 'hidden',
    fontSize: AppTypography.fontSizeMedium + 1, // 15
    color: AppColors.textPrimary,
    fontWeight: AppTypography.fontWeightMedium,
  },
  // Specific style for bolding display name within memberUsername
  memberDisplayNameBold: {
    fontWeight: AppTypography.fontWeightBold,
  },
  removeButton: {
    backgroundColor: AppColors.redError + '30', // Semi-transparent red
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: AppColors.redError,
    fontSize: AppTypography.fontSizeSmall,
    fontWeight: AppTypography.fontWeightMedium,
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
});