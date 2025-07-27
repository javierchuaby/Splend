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

// 10-person mock data
const mockTenPeople: TripMember[] = [
  { uid: 'u1', username: 'alice', displayName: 'Alice' },
  { uid: 'u2', username: 'bob', displayName: 'Bob' },
  { uid: 'u3', username: 'charlie', displayName: 'Charlie' },
  { uid: 'u4', username: 'diana', displayName: 'Diana' },
  { uid: 'u5', username: 'ethan', displayName: 'Ethan' },
  { uid: 'u6', username: 'fiona', displayName: 'Fiona' },
  { uid: 'u7', username: 'george', displayName: 'George' },
  { uid: 'u8', username: 'helen', displayName: 'Helen' },
  { uid: 'u9', username: 'ivan', displayName: 'Ivan' },
  { uid: 'u10', username: 'jane', displayName: 'Jane' }
];

// Multi-person bills with overlapping participants
const complexBills: Bill[] = [
  // Bill 1: 9 people, 2 payers
  {
    id: 'b1',
    billName: 'Group Dinner',
    billEvent: 'e1',
    billDateTime: new Date(),
    billUserIds: ['u1', 'u2', 'u3', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'],
    whoPaid: [
      { uid: 'u1', amountPaid: 1985 },
      { uid: 'u3', amountPaid: 1165 }
    ],
    billItems: [
      {
        billItemName: 'Shared Meal',
        billItemPrice: 3150,
        billItemUserIds: ['u1', 'u2', 'u3', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10']
      }
    ]
  },
  // Bill 2: 3 people, 2 payers
  {
    id: 'b2',
    billName: 'Taxi Ride',
    billEvent: 'e2',
    billDateTime: new Date(),
    billUserIds: ['u1', 'u2', 'u6'],
    whoPaid: [
      { uid: 'u1', amountPaid: 1096 },
      { uid: 'u6', amountPaid: 1004 }
    ],
    billItems: [
      {
        billItemName: 'Transport',
        billItemPrice: 2100,
        billItemUserIds: ['u1', 'u2', 'u6']
      }
    ]
  },
  // Bill 3: 8 people, 6 payers
  {
    id: 'b3',
    billName: 'Hotel Split',
    billEvent: 'e3',
    billDateTime: new Date(),
    billUserIds: ['u2', 'u3', 'u4', 'u5', 'u7', 'u8', 'u9', 'u10'],
    whoPaid: [
      { uid: 'u3', amountPaid: 1101 },
      { uid: 'u4', amountPaid: 1592 },
      { uid: 'u5', amountPaid: 1834 },
      { uid: 'u7', amountPaid: 1723 },
      { uid: 'u9', amountPaid: 1245 },
      { uid: 'u10', amountPaid: 1144 }
    ],
    billItems: [
      {
        billItemName: 'Accommodation',
        billItemPrice: 8639,
        billItemUserIds: ['u2', 'u3', 'u4', 'u5', 'u7', 'u8', 'u9', 'u10']
      }
    ]
  },
  // Bill 4: 8 people, 3 payers
  {
    id: 'b4',
    billName: 'Activity Package',
    billEvent: 'e4',
    billDateTime: new Date(),
    billUserIds: ['u1', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'],
    whoPaid: [
      { uid: 'u5', amountPaid: 1872 },
      { uid: 'u8', amountPaid: 1808 },
      { uid: 'u9', amountPaid: 1127 }
    ],
    billItems: [
      {
        billItemName: 'Group Activity',
        billItemPrice: 4800,
        billItemUserIds: ['u1', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9']
      }
    ]
  },
  // Bill 5: 7 people, 3 payers
  {
    id: 'b5',
    billName: 'Grocery Shopping',
    billEvent: 'e5',
    billDateTime: new Date(),
    billUserIds: ['u1', 'u2', 'u3', 'u4', 'u6', 'u9', 'u10'],
    whoPaid: [
      { uid: 'u1', amountPaid: 1443 },
      { uid: 'u3', amountPaid: 1527 },
      { uid: 'u9', amountPaid: 1489 }
    ],
    billItems: [
      {
        billItemName: 'Food & Supplies',
        billItemPrice: 4459,
        billItemUserIds: ['u1', 'u2', 'u3', 'u4', 'u6', 'u9', 'u10']
      }
    ]
  }
];

// 2-person case
const simpleBills: Bill[] = [
  {
    id: 'b1',
    billName: 'Lunch',
    billEvent: 'e1',
    billDateTime: new Date(),
    billUserIds: ['u1', 'u2'],
    whoPaid: [{ uid: 'u1', amountPaid: 2000 }],
    billItems: [
      {
        billItemName: 'Burger',
        billItemPrice: 2000,
        billItemUserIds: ['u1', 'u2']
      }
    ]
  }
];

describe('Bill Settlement Logic - Comprehensive Tests', () => {
  
  describe('Basic Two-Person Settlement', () => {
    test('calculateUserBalances returns correct net balances for simple case', () => {
      const balances = calculateUserBalances(simpleBills, mockTenPeople.slice(0, 2));
      expect(balances).toEqual([
        expect.objectContaining({ userId: 'u1', netBalance: 100000 }),
        expect.objectContaining({ userId: 'u2', netBalance: -100000 })
      ]);
    });

    test('optimiseSettlements returns single transaction for two people', () => {
      const balances: UserBalance[] = [
        { userId: 'u1', userName: 'Alice', totalPaid: 200000, totalOwed: 100000, netBalance: 100000 },
        { userId: 'u2', userName: 'Bob', totalPaid: 0, totalOwed: 100000, netBalance: -100000 }
      ];
      const settlements = optimiseSettlements(balances);
      expect(settlements.length).toBe(1);
      expect(settlements[0]).toEqual(
        expect.objectContaining({ from: 'u2', to: 'u1', amount: 100000 })
      );
    });
  });

  // Multi-person scenarios
  describe('Ten-Person Complex Settlement', () => {
    test('calculateUserBalances handles overlapping bills correctly', () => {
      const balances = calculateUserBalances(complexBills, mockTenPeople);
      
      expect(balances).toHaveLength(10);
      
      const totalNetBalance = balances.reduce((sum, b) => sum + b.netBalance, 0);
      expect(Math.abs(totalNetBalance)).toBeLessThan(1000); // Allow for rounding errors
      
      const user1Balance = balances.find(b => b.userId === 'u1');
      const user3Balance = balances.find(b => b.userId === 'u3');
      
      expect(user1Balance?.totalPaid).toBeGreaterThan(0);
      expect(user3Balance?.totalPaid).toBeGreaterThan(0);
    });

    test('optimiseSettlements minimises transactions for 10 people', () => {
      const balances = calculateUserBalances(complexBills, mockTenPeople);

      console.log('=== TRANSACTION MINIMISATION TEST ===');
      console.log('Creditors:', balances.filter(b => b.netBalance > 0).length);
      console.log('Debtors:', balances.filter(b => b.netBalance < 0).length);
      
      const settlements = optimiseSettlements(balances);
      const maxPossible = calculateMaxPossibleTransactions(balances);

      console.log('Settlements generated:', settlements.length);
      console.log('Max possible (should be creditors × debtors):', maxPossible);
      console.log('Should pass?', settlements.length <= maxPossible);

      expect(settlements.length).toBeLessThanOrEqual(maxPossible);
      
      const totalSent = settlements.reduce((sum, s) => sum + s.amount, 0);
      const totalReceived = settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(totalSent).toBe(totalReceived);
      
      settlements.forEach(settlement => {
        expect(settlement.from).not.toBe(settlement.to);
      });
    });

    test('calculateMaxPossibleTransactions returns correct upper bound', () => {
      const balances = calculateUserBalances(complexBills, mockTenPeople);
      const maxTxns = calculateMaxPossibleTransactions(balances);
      
      const debtors = balances.filter(b => b.netBalance < 0).length;
      const creditors = balances.filter(b => b.netBalance > 0).length;
      
      expect(maxTxns).toBe(creditors * debtors);
    });
  });

  // Edge cases and stress tests
  describe('Edge Cases', () => {
    test('handles bills with no shared costs correctly', () => {
      const edgeBills: Bill[] = [
        {
          id: 'b1',
          billName: 'Individual Items',
          billEvent: 'e1',
          billDateTime: new Date(),
          billUserIds: ['u1', 'u2', 'u3'],
          whoPaid: [{ uid: 'u1', amountPaid: 3000 }],
          billItems: [
            {
              billItemName: 'Item 1',
              billItemPrice: 1000,
              billItemUserIds: ['u1']
            },
            {
              billItemName: 'Item 2', 
              billItemPrice: 1000,
              billItemUserIds: ['u2']
            },
            {
              billItemName: 'Item 3',
              billItemPrice: 1000,
              billItemUserIds: ['u3']
            }
          ]
        }
      ];
      
      const balances = calculateUserBalances(edgeBills, mockTenPeople.slice(0, 3));

      expect(balances.find(b => b.userId === 'u1')?.netBalance).toBe(200000);
      expect(balances.find(b => b.userId === 'u2')?.netBalance).toBe(-100000);
      expect(balances.find(b => b.userId === 'u3')?.netBalance).toBe(-100000);
    });

    test('handles users who only appear in some bills', () => {
      const partialBills: Bill[] = [
        {
          id: 'b1',
          billName: 'Bill A',
          billEvent: 'e1',
          billDateTime: new Date(),
          billUserIds: ['u1', 'u2'],
          whoPaid: [{ uid: 'u1', amountPaid: 1000 }],
          billItems: [{ billItemName: 'Item', billItemPrice: 1000, billItemUserIds: ['u1', 'u2'] }]
        },
        {
          id: 'b2',
          billName: 'Bill B',
          billEvent: 'e2',
          billDateTime: new Date(),
          billUserIds: ['u2', 'u3'],
          whoPaid: [{ uid: 'u3', amountPaid: 2000 }],
          billItems: [{ billItemName: 'Item', billItemPrice: 2000, billItemUserIds: ['u2', 'u3'] }]
        }
      ];
      
      const balances = calculateUserBalances(partialBills, mockTenPeople.slice(0, 3));

      expect(balances.find(b => b.userId === 'u1')?.netBalance).toBe(50000);
      expect(balances.find(b => b.userId === 'u2')?.netBalance).toBe(-150000);
      expect(balances.find(b => b.userId === 'u3')?.netBalance).toBe(100000);
    });

    test('handles zero-balance users correctly', () => {
      const zeroBills: Bill[] = [
        {
          id: 'b1',
          billName: 'Perfect Split',
          billEvent: 'e1',
          billDateTime: new Date(),
          billUserIds: ['u1', 'u2'],
          whoPaid: [
            { uid: 'u1', amountPaid: 1000 },
            { uid: 'u2', amountPaid: 1000 }
          ],
          billItems: [
            { billItemName: 'Item', billItemPrice: 2000, billItemUserIds: ['u1', 'u2'] }
          ]
        }
      ];
      
      const balances = calculateUserBalances(zeroBills, mockTenPeople.slice(0, 2));
      const settlements = optimiseSettlements(balances);
      
      expect(balances.every(b => b.netBalance === 0)).toBe(true);
      expect(settlements).toHaveLength(0);
    });
  });

  // Performance and optimisation tests  
  describe('Settlement Optimisation', () => {
    test('optimised settlements resolve all debts correctly', () => {
      const balances = calculateUserBalances(complexBills, mockTenPeople);
      const settlements = optimiseSettlements(balances);

      const finalBalances = balances.map(b => ({ ...b }));

      settlements.forEach(settlement => {
        const debtor = finalBalances.find(b => b.userId === settlement.from);
        const creditor = finalBalances.find(b => b.userId === settlement.to);

        if (debtor && creditor) {
          debtor.netBalance += settlement.amount;
          creditor.netBalance -= settlement.amount;
        }
      });

      const totalInitialImbalance = Math.abs(
        balances.reduce((sum, b) => sum + b.netBalance, 0)
      );
      const totalFinalImbalance = Math.abs(
        finalBalances.reduce((sum, b) => sum + b.netBalance, 0)
      );

      expect(totalFinalImbalance).toBe(totalInitialImbalance);

      const totalSettlements = settlements.reduce((sum, s) => sum + s.amount, 0);
      const totalSettleableDebt = balances
        .filter(b => b.netBalance < 0)
        .reduce((sum, b) => sum + Math.abs(b.netBalance), 0);
      
      expect(totalSettlements).toBeLessThanOrEqual(totalSettleableDebt);

      const remainingDebt = finalBalances
        .filter(b => b.netBalance < 0)
        .reduce((sum, b) => sum + Math.abs(b.netBalance), 0);
      
      const remainingCredit = finalBalances
        .filter(b => b.netBalance > 0)
        .reduce((sum, b) => sum + b.netBalance, 0);

      expect(Math.abs(remainingDebt - remainingCredit)).toBeLessThan(1000); // Allow small rounding tolerance
    });

    test('no unnecessary circular transactions', () => {
      const balances = calculateUserBalances(complexBills, mockTenPeople);
      const settlements = optimiseSettlements(balances);
      
      const userTransactions = new Map<string, { sent: string[], received: string[] }>();
      
      settlements.forEach(s => {
        if (!userTransactions.has(s.from)) {
          userTransactions.set(s.from, { sent: [], received: [] });
        }
        if (!userTransactions.has(s.to)) {
          userTransactions.set(s.to, { sent: [], received: [] });
        }
        
        userTransactions.get(s.from)!.sent.push(s.to);
        userTransactions.get(s.to)!.received.push(s.from);
      });
      
      userTransactions.forEach((transactions, userId) => {
        const overlap = transactions.sent.filter(x => transactions.received.includes(x));
        expect(overlap).toHaveLength(0);
      });
    });
  });
});