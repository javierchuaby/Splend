import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import EventMembersScreen from './event-members';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ eventId: 'evt1', tripId: 'trp1' }),
}));

describe('EventMembersScreen', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'uid1' } });
    jest.clearAllMocks();
  });

  it('shows loading indicator on initial mount', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<EventMembersScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('renders members when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: (id: string) => ({
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              eventName: 'Birthday Party',
              memberIds: ['uid1', 'uid2'],
              billIds: [],
              startDateTime: { toDate: () => new Date() },
              endDateTime: { toDate: () => new Date() },
              eventLocation: {},
            }),
          }),
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ displayName: 'Alice', username: 'alice', billIds: [], totalSpent: 0, totalPaid: 0 }),
          }),
        }),
      }),
    });
    const { findByText } = render(<EventMembersScreen />);
    expect(await findByText(/Alice/)).toBeTruthy();
  });

  it('triggers search and add member', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              eventName: 'Birthday Party',
              memberIds: ['uid1'],
              billIds: [],
              startDateTime: { toDate: () => new Date() },
              endDateTime: { toDate: () => new Date() },
              eventLocation: {},
            }),
          }),
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ displayName: 'Bob', username: 'bob', billIds: [], totalSpent: 0, totalPaid: 0 }),
          }),
          update: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      FieldValue: { arrayUnion: jest.fn() },
    });

    const { getByPlaceholderText, getByText } = render(<EventMembersScreen />);
    fireEvent.changeText(getByPlaceholderText(/Add member/), 'bob');
    await waitFor(() => {
      expect(getByText('Bob')).toBeTruthy();
    });
    fireEvent.press(getByText('Add'));
  });
});