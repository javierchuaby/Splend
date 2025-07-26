import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripPackingListScreen from './trip-packing-list';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 't1' }),
  useRouter: () => ({ back: jest.fn() }),
}));

describe('TripPackingListScreen', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'user1' } });
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<TripPackingListScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('displays packing items', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => {
            cb({
              data: () => ({
                packingListItems: [
                  { id: '1', name: 'Toothbrush', isChecked: false },
                ],
              }),
            });
          },
        }),
      }),
    });
    const { findByText } = render(<TripPackingListScreen />);
    expect(await findByText(/Toothbrush/)).toBeTruthy();
  });
});