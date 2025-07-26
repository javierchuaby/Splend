import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripInfoScreen from './trip-info';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 't1' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

describe('TripInfoScreen', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({
      currentUser: { uid: 'user1' },
    });
    jest.clearAllMocks();
  });

  it('renders loading', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<TripInfoScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('renders trip info when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (onSuccess: any) => {
            onSuccess({
              exists: true,
              data: () => ({
                tripName: 'Beach Trip',
                members: [{ uid: 'user1', username: 'alice', displayName: 'Alice' }],
                startDate: { toDate: () => new Date() },
                endDate: { toDate: () => new Date() },
                createdAt: { toDate: () => new Date() },
                tripDescription: 'Golden sand',
              }),
            });
          },
        }),
      }),
    });
    const { findByText } = render(<TripInfoScreen />);
    expect(await findByText('Beach Trip')).toBeTruthy();
  });
});