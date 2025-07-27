jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: jest.fn(),
}));

import { describe, expect, test } from '@jest/globals';

import type {
  Bill,
  TripMember,
  UserBalance
} from '../../components/BillSettlementManager';

import {
  calculateMaxPossibleTransactions,
  calculateUserBalances,
  optimiseSettlements
} from '../../components/BillSettlementManager';

const mockTripMembers: TripMember[] = [
  { uid: 'u1', username: 'alice', displayName: 'Alice' },
  { uid: 'u2', username: 'bob', displayName: 'Bob' }
];

const mockBills: Bill[] = [
  {
    id: 'b1',
    billName: 'Lunch',
    billEvent: 'e1',
    billDateTime: new Date(),
    billUserIds: ['u1', 'u2'],
    whoPaid: [{ uid: 'u1', amountPaid: 20 }],
    billItems: [
      {
        billItemName: 'Burger',
        billItemPrice: 20,
        billItemUserIds: ['u1', 'u2']
      }
    ]
  }
];

describe('Bill Settlement Logic', () => {
  test('calculateUserBalances returns correct net balances', () => {
    const balances = calculateUserBalances(mockBills, mockTripMembers);
    expect(balances).toEqual([
      expect.objectContaining({ userId: 'u1', netBalance: 1000 }),
      expect.objectContaining({ userId: 'u2', netBalance: -1000 })
    ]);
  });

  test('optimiseSettlements returns correct transactions', () => {
    const balances: UserBalance[] = [
      { userId: 'u1', userName: 'Alice', totalPaid: 2000, totalOwed: 1000, netBalance: 1000 },
      { userId: 'u2', userName: 'Bob', totalPaid: 0, totalOwed: 1000, netBalance: -1000 }
    ];
    const settlements = optimiseSettlements(balances);
    expect(settlements.length).toBe(1);
    expect(settlements[0]).toEqual(
      expect.objectContaining({ from: 'u2', to: 'u1', amount: 1000 })
    );
  });

  test('calculateMaxPossibleTransactions returns correct count', () => {
    const balances: UserBalance[] = [
      { userId: 'u1', userName: 'Alice', totalPaid: 2000, totalOwed: 1000, netBalance: 1000 },
      { userId: 'u2', userName: 'Bob', totalPaid: 0, totalOwed: 1000, netBalance: -1000 }
    ];
    const maxTxns = calculateMaxPossibleTransactions(balances);
    expect(maxTxns).toBe(1);
  });
});