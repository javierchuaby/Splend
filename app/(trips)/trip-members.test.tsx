import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripMembersScreen from './trip-members';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 't1' }),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('TripMembersScreen', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'user1' } });
    jest.clearAllMocks();
  });

  it('shows loading initially', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<TripMembersScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('shows members when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => {
            cb({
              exists: true,
              data: () => ({
                tripName: 'Test',
                members: [{ uid: 'user1', username: 'alice', displayName: 'Alice' }],
                startDate: { toDate: () => new Date() },
                endDate: { toDate: () => new Date() },
                createdAt: { toDate: () => new Date() },
              }),
            });
          },
        }),
      }),
    });
    const { findByText } = render(<TripMembersScreen />);
    expect(await findByText('Current Members (1)')).toBeTruthy();
  });
});