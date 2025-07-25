import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },

  pageTitleContainer: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },

  pageTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#4c6ef5',
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 18,
    color: '#a0a0ab',
    marginTop: 8,
    fontWeight: '400',
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
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    shadowColor: '#000',
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
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  atSymbol: {
    fontSize: 16,
    color: '#8e8e93',
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
  },

  buttonContainer: {
    gap: 12,
  },

  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },

  createAccountButton: {
    backgroundColor: '#4c6ef5',
  },

  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },

  loader: {
    marginVertical: 32,
  },
  goBackButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  goBackText: {
    fontSize: 16,
    color: '#a0a0ab',
    fontWeight: '500',
  },
});