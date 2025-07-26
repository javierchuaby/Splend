import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import BillViewScreen from '../bill-view';

jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ billId: 'b1', eventId: 'e1', tripId: 't1' }),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('Bills Splitting Flow', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('shows correct cost per user and distributed paid amounts', async () => {
    (firestore as any).mockReturnValue({
      collection: (col: string) => ({
        doc: () => ({
          get: jest.fn()
            .mockResolvedValueOnce({
              exists: true,
              id: 'b1',
              data: () => ({
                billName: 'Group Bill',
                billEvent: 'Dinner',
                billDateTime: { toDate: () => new Date() },
                billUserIds: ['u1', 'u2'],
                billItems: [
                  { billItemName: 'Pizza', billItemPrice: 20, billItemUserIds: ['u1', 'u2'], costPerUser: 10 },
                  { billItemName: 'Soda', billItemPrice: 6, billItemUserIds: ['u2'], costPerUser: 6 },
                ],
                whoPaid: [
                  { uid: 'u1', amountPaid: 16 },
                  { uid: 'u2', amountPaid: 10 },
                ],
              }),
            })
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({
                members: [
                  { uid: 'u1', username: 'alice', displayName: 'Alice' },
                  { uid: 'u2', username: 'bob', displayName: 'Bob' },
                ],
              }),
            })
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({ username: 'alice', displayName: 'Alice' }),
            })
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({ username: 'bob', displayName: 'Bob' }),
            }),
        }),
      }),
    });
    const { findByText } = render(<BillViewScreen />);
    expect(await findByText(/Pizza/)).toBeTruthy();
    expect(await findByText(/10.00/)).toBeTruthy();
    expect(await findByText(/Soda/)).toBeTruthy();
    expect(await findByText(/6.00/)).toBeTruthy();
    expect(await findByText(/Alice/)).toBeTruthy();
    expect(await findByText(/Bob/)).toBeTruthy();
  });
});