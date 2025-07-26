import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TripPackingListScreen from '../trip-packing-list';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'trip01' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

describe('Packing List Flow', () => {
  const mockUser = { uid: 'user123', displayName: 'Alice' };
  const initialItems = [
    { id: '1', name: 'Sunscreen', isChecked: false, createdBy: 'user123', createdAt: new Date() },
    { id: '2', name: 'Toothpaste', isChecked: true, createdBy: 'user456', checkedBy: 'user456', checkedByName: 'Bob', createdAt: new Date() },
  ];

  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: mockUser });
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({ data: () => ({ packingListItems: initialItems }) }),
          update: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });
  });

  it('renders and toggles packing items', async () => {
    const { findByText, getByText } = render(<TripPackingListScreen />);
    expect(await findByText('Sunscreen')).toBeTruthy();
    expect(getByText('Toothpaste')).toBeTruthy();
    fireEvent.press(getByText('Sunscreen'));
    // Ideally assert that checked status is reflected (depends on implementation)
  });

  it('adds a new item', async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined);
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({ data: () => ({ packingListItems: initialItems }) }),
          update: updateMock,
        }),
      }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });

    const { getByText, getByPlaceholderText } = render(<TripPackingListScreen />);
    fireEvent.press(getByText('+ Add'));
    fireEvent.changeText(getByPlaceholderText('New item'), 'Hat');
    fireEvent.press(getByText('Add'));
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
    });
  });

  it('shows empty state when list is empty', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({ data: () => ({ packingListItems: [] }) }),
          update: jest.fn(),
        }),
      }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });
    const { findByText } = render(<TripPackingListScreen />);
    expect(await findByText(/No items in your packing list/)).toBeTruthy();
  });
});