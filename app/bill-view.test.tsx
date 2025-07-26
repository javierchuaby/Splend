import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import BillViewScreen from './bill-view';

jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ billId: 'b1', eventId: 'e1', tripId: 't1' }),
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('BillViewScreen', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('renders loading initially', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
    });
    const { getByText } = render(<BillViewScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('shows not found on missing bill', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({ exists: false }),
        }),
      }),
    });
    const { findByText } = render(<BillViewScreen />);
    expect(await findByText(/Bill not found/)).toBeTruthy();
  });

  it('renders bill info when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: (col: string) => ({
        doc: () => ({
          get: jest.fn()
            .mockResolvedValueOnce({
              exists: true,
              id: 'b1',
              data: () => ({
                billName: 'Cafe Bill',
                billEvent: 'Lunch',
                billDateTime: { toDate: () => new Date() },
                billUserIds: ['u1'],
                billItems: [{ billItemName: 'Burger', billItemPrice: 12.2, billItemUserIds: ['u1'], costPerUser: 12.2 }],
                whoPaid: [{ uid: 'u1', amountPaid: 12.2 }],
              }),
            })
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({
                members: [
                  { uid: 'u1', username: 'alice', displayName: 'Alice' },
                ],
              }),
            })
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({
                username: 'alice',
                displayName: 'Alice',
              }),
            }),
        }),
      }),
    });
    const { findByText } = render(<BillViewScreen />);
    expect(await findByText(/Cafe Bill/)).toBeTruthy();
    expect(await findByText(/Burger/)).toBeTruthy();
    expect(await findByText(/Alice/)).toBeTruthy();
  });
});