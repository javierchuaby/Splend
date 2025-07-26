import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import { Share } from 'react-native';
import { BillSettlementManager } from './BillSettlementManager';

jest.mock('@react-native-firebase/firestore');
jest.spyOn(Share, 'share').mockImplementation(jest.fn());

describe('BillSettlementManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading initially', () => {
    const { getByText } = render(
      <BillSettlementManager tripId="t1" tripName="Trip One" visible={true} />
    );
    expect(getByText(/Calculating settlements/i)).toBeTruthy();
  });

  it('shows error for no bills', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({ data: () => ({ eventIds: [] }) }),
        }),
      }),
    });
    const { findByText } = render(
      <BillSettlementManager tripId="t1" tripName="Trip One" visible={true} />
    );
    expect(await findByText(/No bills found for this trip/)).toBeTruthy();
  });

  it('shows generated balances and settlements', async () => {
    // Mock a successful fetch: 2 members, 1 bill, paid and owed logic
    (firestore as any).mockReturnValue({
      collection: (col: string) => ({
        doc: () => ({
          get: jest.fn().mockResolvedValueOnce({
            data: () => ({
              eventIds: ['e1'],
              members: [
                { uid: 'u1', displayName: 'Alice', username: 'alice' },
                { uid: 'u2', displayName: 'Bob', username: 'bob' },
              ],
            }),
          })
            .mockResolvedValueOnce({
              data: () => ({
                billIds: ['b1'],
              }),
            })
            .mockResolvedValueOnce({
              data: () => ({
                billName: 'Lunch',
                billEvent: 'Eat',
                billDateTime: { toDate: () => new Date() },
                billUserIds: ['u1', 'u2'],
                billItems: [
                  { billItemName: 'Burger', billItemPrice: 20, billItemUserIds: ['u1', 'u2'], costPerUser: 10 }
                ],
                whoPaid: [{ uid: 'u1', amountPaid: 20 }]
              })
            }),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            docs: [
              { id: 'b1', data: () => ({
                billName: 'Lunch',
                billEvent: 'Eat',
                billDateTime: { toDate: () => new Date() },
                billUserIds: ['u1', 'u2'],
                billItems: [
                  { billItemName: 'Burger', billItemPrice: 20, billItemUserIds: ['u1', 'u2'], costPerUser: 10 }
                ],
                whoPaid: [{ uid: 'u1', amountPaid: 20 }]
              })}
            ]
          }),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
    });

    const { findByText } = render(
      <BillSettlementManager tripId="t1" tripName="Trip One" visible={true} />
    );
    expect(await findByText(/Alice/)).toBeTruthy();
    expect(await findByText(/Bob/)).toBeTruthy();
    expect(await findByText(/Net/)).toBeTruthy();
  });
});