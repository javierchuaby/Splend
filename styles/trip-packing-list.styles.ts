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
    backgroundColor: '#121212',
  },
  backButton: {
    fontSize: 16,
    color: '#0a84ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 50,
  },
  addButton: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  packingCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  packingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lastPackingItem: {
    borderBottomWidth: 0,
  },
  packingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxChecked: {
    backgroundColor: '#0a84ff',
    borderColor: '#0a84ff',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  checkedByText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#0a84ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalAdd: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  modalContent: {
    padding: 20,
  },
  textInput: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
});
