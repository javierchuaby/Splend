import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import ConcludedTripViewScreen from './concluded-trip-view';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'zz' }),
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

describe('ConcludedTripViewScreen', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'u1', username: 'alice', displayName: 'Alice' } });
    jest.clearAllMocks();
  });

  it('shows loading initially', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [] }),
      FieldPath: { documentId: () => 'id' },
    });
    const { getByText } = render(<ConcludedTripViewScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('renders concluded trip with events', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ displayName: 'Alice', username: 'alice', billIds: [], totalSpent: 0, totalPaid: 0 }),
          }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              tripName: 'Final Trip',
              members: [{ uid: 'u1', username: 'alice', displayName: 'Alice' }],
              eventIds: ['eid1'],
              startDate: { toDate: () => new Date('2025-04-01') },
              endDate: { toDate: () => new Date('2025-04-01') },
              createdAt: { toDate: () => new Date('2025-01-01') },
              tripDescription: '',
              isConcluded: true,
            }),
          }),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            docs: [
              { id: 'eid1', data: () => ({
                eventName: 'Party',
                eventLocation: {},
                startDateTime: { toDate: () => new Date() },
                endDateTime: { toDate: () => new Date() },
                memberIds: ['u1'],
                billIds: [],
              }) },
            ],
          }),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
    });
    const { findByText } = render(<ConcludedTripViewScreen />);
    expect(await findByText('Party')).toBeTruthy();
  });
});