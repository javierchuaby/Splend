import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import ConcludedTripMembersScreen from './concluded-trip-members';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'tripx' }),
  useRouter: () => ({ back: jest.fn() }),
}));

describe('ConcludedTripMembersScreen', () => {
  const currentUser = { uid: 'u1', username: 'alice', displayName: 'Alice' };

  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser });
    jest.clearAllMocks();
  });

  it('renders loading spinner before member data loads', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<ConcludedTripMembersScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('lists trip members', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ displayName: 'Alice', username: 'alice' }) }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              tripName: 'Trip Three',
              members: [
                { uid: 'u1', username: 'alice', displayName: 'Alice' },
                { uid: 'u2', username: 'bob', displayName: 'Bob' }
              ],
              startDate: { toDate: () => new Date('2025-03-01') },
              endDate: { toDate: () => new Date('2025-03-10') },
              createdAt: { toDate: () => new Date('2025-01-01') },
              tripDescription: '',
              isConcluded: true,
              eventIds: [],
            }),
          }),
        }),
      }),
    });
    const { findByText } = render(<ConcludedTripMembersScreen />);
    expect(await findByText('Alice')).toBeTruthy();
    expect(await findByText('Bob')).toBeTruthy();
  });
});