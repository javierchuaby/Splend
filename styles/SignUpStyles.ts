import { StyleSheet } from 'react-native';
import { AppColors } from './AppColors';
import { AppTypography } from './AppTypography';
import { GlobalStyles } from './GlobalStyles';

export const styles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
  },
  pageTitleContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: AppTypography.fontSizePageTitle,
    fontWeight: AppTypography.fontWeightExtraBold,
    color: AppColors.primaryBlue,
    letterSpacing: AppTypography.letterSpacingTight,
  },
  subtitle: {
    fontSize: AppTypography.fontSizeLarge,
    color: AppColors.textSecondary,
    marginTop: 8,
    fontWeight: AppTypography.fontWeightRegular,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    height: 56,
    backgroundColor: AppColors.backgroundPrimary,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.borderSecondary,
    shadowColor: AppColors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: AppColors.backgroundPrimary,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.borderSecondary,
    shadowColor: AppColors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  atSymbol: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textPlaceholder,
    paddingLeft: 20,
  },
  usernameInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    paddingLeft: 5,
    marginBottom: 0,
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textPrimary,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    ...GlobalStyles.baseButton,
  },
  createAccountButton: {
    backgroundColor: AppColors.primaryBlue,
  },
  buttonText: {
    ...GlobalStyles.baseButtonText,
  },
  loader: {
    marginVertical: 32,
  },
  goBackButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  goBackText: {
    fontSize: AppTypography.fontSizeRegular,
    color: AppColors.textSecondary,
    fontWeight: AppTypography.fontWeightMedium,
  },
});