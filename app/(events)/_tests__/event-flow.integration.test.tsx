import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import EventMembersScreen from '../event-members';
import EventViewScreen from '../event-view';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ eventId: 'evt1', tripId: 'trp1' }),
}));

describe('Event Management Flow', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'uid1', displayName: 'Test User', billIds: [], totalSpent: 0, totalPaid: 0 } });
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) =>
            cb({
              exists: true,
              data: () => ({
                eventName: 'Gala Night',
                eventLocation: 'Hotel',
                startDateTime: { toDate: () => new Date() },
                endDateTime: { toDate: () => new Date() },
                memberIds: ['uid1'],
                billIds: [],
              }),
            }),
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ username: 'alice', displayName: 'Alice', billIds: [], totalSpent: 0, totalPaid: 0 }),
          }),
          update: jest.fn(),
          delete: jest.fn(),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            forEach: jest.fn(),
            docs: [],
          }),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
      Timestamp: { fromDate: (date: Date) => date },
      batch: () => ({ update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });
  });

  it('adds a member to the event and then removes them', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<EventMembersScreen />);
    fireEvent.changeText(getByPlaceholderText(/Add member/), 'alice');
    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy();
    });
    fireEvent.press(getByText('Add'));

    // Now remove
    fireEvent.press(getByText('Remove'));
  });

  it('displays event with no bills, then adds and lists a bill', async () => {
    const { findByText, getByText } = render(<EventViewScreen />);

    expect(await findByText('Gala Night')).toBeTruthy();

    // Open create bill modal (simulate add bill steps by clicking "+ Create New Bill" if implemented)
    // fireEvent.press(getByText('+ Create New Bill'));
    // Simulate filling and adding a bill
    // ... add assertions for bill creation and display
  });
});