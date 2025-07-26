import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import EventViewScreen from './event-view';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ eventId: 'evt1', tripId: 'trp1' }),
}));

describe('EventViewScreen', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'uid1', displayName: 'Test User', billIds: [], totalSpent: 0, totalPaid: 0 } });
    jest.clearAllMocks();
  });

  it('renders event basics after Firestore resolves', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) =>
            cb({
              exists: true,
              data: () => ({
                eventName: 'Hiking',
                eventLocation: 'Hill Park',
                startDateTime: { toDate: () => new Date() },
                endDateTime: { toDate: () => new Date() },
                memberIds: ['uid1'],
                billIds: [],
              }),
            }),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            forEach: jest.fn(),
            docs: [{ id: 'bill1', data: () => ({}) }],
          }),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
      Timestamp: { fromDate: (date: Date) => date },
      batch: () => ({ update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });

    const { findByText } = render(<EventViewScreen />);
    expect(await findByText(/Hiking/)).toBeTruthy();
  });

  it('shows empty state if no bills', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) =>
            cb({
              exists: true,
              data: () => ({
                eventName: 'Hiking',
                eventLocation: 'Hill Park',
                startDateTime: { toDate: () => new Date() },
                endDateTime: { toDate: () => new Date() },
                memberIds: ['uid1'],
                billIds: [],
              }),
            }),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
      Timestamp: { fromDate: (date: Date) => date },
      batch: () => ({ update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });
    const { findByText } = render(<EventViewScreen />);
    expect(await findByText(/No bills yet/)).toBeTruthy();
  });
});