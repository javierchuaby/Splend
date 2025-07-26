import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripViewScreen from './trip-view';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 't1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('TripViewScreen', () => {
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
    const { getByText } = render(<TripViewScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('renders trip and events when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: async (cb: any) => {
            await cb({
              exists: true,
              data: () => ({
                tripName: 'Test trip',
                members: [{ uid: 'user1', username: 'alice', displayName: 'Alice' }],
                eventIds: [],
                startDate: { toDate: () => new Date() },
                endDate: { toDate: () => new Date() },
                createdAt: { toDate: () => new Date() },
              }),
            });
          },
        }),
        where: () => ({
          get: async () => ({
            docs: [],
          }),
        }),
      }),
    });
    const { findByText } = render(<TripViewScreen />);
    expect(await findByText(/Test trip/)).toBeTruthy();
  });
});