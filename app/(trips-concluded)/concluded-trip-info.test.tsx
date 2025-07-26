import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import ConcludedTripInfoScreen from './concluded-trip-info';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'triptest' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

describe('ConcludedTripInfoScreen', () => {
  const currentUser = { uid: 'user1', username: 'alice', displayName: 'Alice', billIds: [], totalSpent: 100, totalPaid: 100 };

  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser });
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<ConcludedTripInfoScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('shows trip info and ledgers', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => {
            cb({
              exists: true,
              data: () => ({
                tripName: 'Euro Trip',
                members: [{ uid: 'user1', username: 'alice', displayName: 'Alice', totalSpent: 200, totalPaid: 100 }],
                startDate: { toDate: () => new Date('2025-02-01') },
                endDate: { toDate: () => new Date('2025-02-10') },
                createdAt: { toDate: () => new Date('2025-01-01') },
                tripDescription: 'Epic experience',
                isConcluded: true,
                eventIds: [],
              }),
            });
          },
        }),
      }),
    });
    const { findByText } = render(<ConcludedTripInfoScreen />);
    expect(await findByText('Euro Trip')).toBeTruthy();
    expect(await findByText(/Epic experience/)).toBeTruthy();
  });
});