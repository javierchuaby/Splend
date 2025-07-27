import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#ff453a',
  },
  editButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#555',
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
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    textAlignVertical: 'top',
  },
  textBoxScrollView: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  descriptionDisplay: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
  },
});
