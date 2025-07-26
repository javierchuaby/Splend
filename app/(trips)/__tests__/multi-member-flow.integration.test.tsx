import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TripMembersScreen from '../trip-members';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'trip12' }),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('Multi-member Management Flow', () => {
  const mockUser = { uid: 'user1', username: 'alice', displayName: 'Alice' };
  const member1 = { uid: 'user2', username: 'bob', displayName: 'Bob', billIds: [], totalSpent: 0, totalPaid: 0 };
  const member2 = { uid: 'user3', username: 'chloe', displayName: 'Chloe', billIds: [], totalSpent: 0, totalPaid: 0 };
  const firestoreTrip = {
    id: 'trip12',
    tripName: 'Test Trip',
    startDate: { toDate: () => new Date() },
    endDate: { toDate: () => new Date() },
    createdAt: { toDate: () => new Date() },
    members: [mockUser, member1, member2],
    tripDescription: '',
    isConcluded: false,
    eventIds: [],
  };

  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: mockUser });
    (firestore as any).mockReturnValue({
      collection: (colName: string) => ({
        doc: (id?: string) => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => colName === 'users'
              ? id === 'user1'
                ? mockUser
                : id === 'user2'
                  ? member1
                  : member2
              : {},
          }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              ...firestoreTrip,
              members: [mockUser, member1, member2],
            }),
          }),
          update: jest.fn().mockResolvedValue(undefined),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            forEach: jest.fn(),
          }),
        }),
      }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });
  });

  it('renders all trip members', async () => {
    const { findByText } = render(<TripMembersScreen />);
    expect(await findByText('Current Members (3)')).toBeTruthy();
    expect(await findByText('Alice')).toBeTruthy();
    expect(await findByText('Bob')).toBeTruthy();
    expect(await findByText('Chloe')).toBeTruthy();
  });

  it('searches for a new user to add', async () => {
    // Simulate searching for "david"
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ username: 'david', displayName: 'David', billIds: [], totalSpent: 0, totalPaid: 0 }),
          }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              ...firestoreTrip,
              members: [mockUser, member1, member2],
            }),
          }),
          update: jest.fn(),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            forEach: jest.fn((cb: any) => cb({ id: 'user4', data: () => ({ username: 'david', displayName: 'David' }) })),
          }),
        }),
      }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });

    const { getByPlaceholderText, findByText } = render(<TripMembersScreen />);
    fireEvent.changeText(getByPlaceholderText(/Add member/), 'david');
    expect(await findByText('David')).toBeTruthy();
  });

  it('removes a member and reflects change', async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined);
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => member1 }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              ...firestoreTrip,
              members: [mockUser, member1, member2],
            }),
          }),
          update: updateMock,
        }),
      }),
      FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn() },
    });
    const { findByText, getAllByText } = render(<TripMembersScreen />);
    const removeButtons = await waitFor(() => getAllByText('Remove'));
    fireEvent.press(removeButtons[0]);
    expect(updateMock).toHaveBeenCalled();
  });
});