jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn()
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: 'abc123', email: 'test@example.com' } })
  ),
  updateProfile: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve())
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockGet = jest.fn();
  const mockAdd = jest.fn();
  const mockSet = jest.fn();
  const mockWhere = jest.fn();
  const mockLimit = jest.fn();
  const mockOrderBy = jest.fn();
  const mockStartAt = jest.fn();
  const mockEndAt = jest.fn();
  const mockOnSnapshot = jest.fn();
  const mockDoc = jest.fn();

  // Chain mock methods
  mockWhere.mockReturnValue({ get: mockGet, limit: mockLimit });
  mockLimit.mockReturnValue({ get: mockGet });
  mockOrderBy.mockReturnValue({ 
    onSnapshot: mockOnSnapshot,
    startAt: mockStartAt 
  });
  mockStartAt.mockReturnValue({ endAt: mockEndAt });
  mockEndAt.mockReturnValue({ get: mockGet });
  mockDoc.mockReturnValue({ set: mockSet });

  const mockCollection = jest.fn(() => ({
    where: mockWhere,
    limit: mockLimit,
    orderBy: mockOrderBy,
    startAt: mockStartAt,
    endAt: mockEndAt,
    get: mockGet,
    add: mockAdd,
    doc: mockDoc,
    onSnapshot: mockOnSnapshot
  }));

  const data = {
    collection: mockCollection,
    FieldValue: {
      serverTimestamp: jest.fn(() => 'timestamp')
    },
    Timestamp: {
      fromDate: jest.fn((date) => ({ toDate: () => date }))
    }
  };

  const mockFirestore = () => data;
  mockFirestore.FieldValue = data.FieldValue;
  mockFirestore.Timestamp = data.Timestamp;
  
  // Store references for test access
  mockFirestore.mockGet = mockGet;
  mockFirestore.mockAdd = mockAdd;
  mockFirestore.mockWhere = mockWhere;
  mockFirestore.mockLimit = mockLimit;
  mockFirestore.mockOrderBy = mockOrderBy;
  mockFirestore.mockOnSnapshot = mockOnSnapshot;
  
  return mockFirestore;
});

import firestore from '@react-native-firebase/firestore';
import {
  createTrip,
  createUserAccount,
  isUsernameTaken,
  listenToUserTrips,
  searchUsersByQuery
} from '../../app/services/firestoreService';

describe('Firestore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Existing tests
  describe('Sign Up', () => {
    it('isUsernameTaken returns true if username exists', async () => {
      (firestore as any).mockGet.mockResolvedValue({ empty: false });
      
      const exists = await isUsernameTaken('testuser');
      expect(exists).toBe(true);
    });

    it('createUserAccount creates and signs out user', async () => {
      const user = await createUserAccount('test@example.com', 'pass123', 'Test User', 'testuser');
      expect(user.uid).toBe('abc123');
      expect(user.email).toBe('test@example.com');
    });
  });

  // New tests for refactored functionality
  describe('searchUsersByQuery', () => {
    it('returns empty array if query is empty', async () => {
      const results = await searchUsersByQuery('');
      expect(results).toEqual([]);
      
      const results2 = await searchUsersByQuery('   ');
      expect(results2).toEqual([]);
    });

    it('returns users from exact username search', async () => {
      const mockUser = {
        username: 'alice',
        displayName: 'Alice Smith',
        billIds: ['bill1'],
        totalSpent: 50,
        totalPaid: 25
      };

      // Mock exact username match
      (firestore as any).mockGet.mockResolvedValueOnce({
        forEach: (cb: any) => cb({
          id: 'user1',
          data: () => mockUser
        })
      });

      const results = await searchUsersByQuery('alice');
      expect(results).toEqual([{
        id: 'user1',
        ...mockUser
      }]);
    });

    it('searches by display name when no exact username match', async () => {
      const mockUsers = [
        {
          id: 'user1',
          data: () => ({
            username: 'alice123',
            displayName: 'Alice Smith',
            billIds: [],
            totalSpent: 0,
            totalPaid: 0
          })
        },
        {
          id: 'user2', 
          data: () => ({
            username: 'bob456',
            displayName: 'Alice Johnson',
            billIds: [],
            totalSpent: 0,
            totalPaid: 0
          })
        }
      ];

      // Mock no exact username match
      (firestore as any).mockGet.mockResolvedValueOnce({
        forEach: () => {} // Empty result
      });

      // Mock display name search
      (firestore as any).mockGet.mockResolvedValueOnce({
        forEach: (cb: any) => mockUsers.forEach(cb)
      });

      const results = await searchUsersByQuery('Alice');
      expect(results).toHaveLength(2);
      expect(results[0].displayName).toContain('Alice');
      expect(results[1].displayName).toContain('Alice');
    });

    it('excludes specified user IDs', async () => {
      const mockUser = {
        username: 'alice',
        displayName: 'Alice Smith',
        billIds: [],
        totalSpent: 0,
        totalPaid: 0
      };

      (firestore as any).mockGet.mockResolvedValueOnce({
        forEach: (cb: any) => cb({
          id: 'excluded-user',
          data: () => mockUser
        })
      });

      const results = await searchUsersByQuery('alice', ['excluded-user']);
      expect(results).toEqual([]);
    });

    it('handles missing optional user fields with defaults', async () => {
      const mockUser = {
        username: 'alice',
        displayName: 'Alice Smith'
        // Missing billIds, totalSpent, totalPaid
      };

      (firestore as any).mockGet.mockResolvedValueOnce({
        forEach: (cb: any) => cb({
          id: 'user1',
          data: () => mockUser
        })
      });

      const results = await searchUsersByQuery('alice');
      expect(results[0]).toEqual({
        id: 'user1',
        username: 'alice',
        displayName: 'Alice Smith',
        billIds: [],
        totalSpent: 0,
        totalPaid: 0
      });
    });
  });

  describe('createTrip', () => {
    it('creates trip document and returns id', async () => {
      (firestore as any).mockAdd.mockResolvedValue({ id: 'trip123' });

      const members = [
        {
          id: 'user1',
          username: 'alice',
          displayName: 'Alice',
          billIds: [],
          totalSpent: 0,
          totalPaid: 0
        }
      ];

      const tripId = await createTrip(
        'Beach Trip',
        'Fun in the sun',
        new Date('2023-07-01'),
        new Date('2023-07-03'),
        members
      );

      expect(tripId).toBe('trip123');
      expect((firestore as any).mockAdd).toHaveBeenCalledWith({
        tripName: 'Beach Trip',
        tripDescription: 'Fun in the sun',
        startDate: expect.any(Object),
        endDate: expect.any(Object),
        members: [{
          uid: 'user1',
          username: 'alice',
          displayName: 'Alice',
          billIds: [],
          totalSpent: 0,
          totalPaid: 0
        }],
        eventIds: [],
        createdAt: 'timestamp',
        isConcluded: false
      });
    });

    it('trims trip name and description', async () => {
      (firestore as any).mockAdd.mockResolvedValue({ id: 'trip123' });

      await createTrip(
        '  Beach Trip  ',
        '  Fun in the sun  ',
        new Date(),
        new Date(),
        []
      );

      expect((firestore as any).mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          tripName: 'Beach Trip',
          tripDescription: 'Fun in the sun'
        })
      );
    });
  });

  describe('listenToUserTrips', () => {
    it('calls callback with filtered active trips for user', () => {
      const mockTrips = [
        {
          id: 'trip1',
          data: () => ({
            tripName: 'Active Trip',
            members: [{ uid: 'user1', username: 'alice', displayName: 'Alice' }],
            startDate: { toDate: () => new Date('2023-07-01') },
            endDate: { toDate: () => new Date('2023-07-03') },
            createdAt: { toDate: () => new Date('2023-06-01') },
            tripDescription: 'Fun trip',
            isConcluded: false,
            eventIds: []
          })
        },
        {
          id: 'trip2',
          data: () => ({
            tripName: 'Concluded Trip',
            members: [{ uid: 'user1', username: 'alice', displayName: 'Alice' }],
            startDate: { toDate: () => new Date('2023-06-01') },
            endDate: { toDate: () => new Date('2023-06-03') },
            createdAt: { toDate: () => new Date('2023-05-01') },
            tripDescription: 'Past trip',
            isConcluded: true,
            eventIds: []
          })
        }
      ];

      const mockUnsubscribe = jest.fn();
      (firestore as any).mockOnSnapshot.mockImplementation((cb: any) => {
        cb({ docs: mockTrips });
        return mockUnsubscribe;
      });

      const callback = jest.fn();
      const unsubscribe = listenToUserTrips('user1', 'active', callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'trip1',
          name: 'Active Trip',
          isConcluded: false
        })
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('filters for concluded trips when requested', () => {
      const mockTrips = [
        {
          id: 'trip1',
          data: () => ({
            tripName: 'Active Trip',
            members: [{ uid: 'user1' }],
            startDate: { toDate: () => new Date() },
            endDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            tripDescription: '',
            isConcluded: false,
            eventIds: []
          })
        },
        {
          id: 'trip2',
          data: () => ({
            tripName: 'Concluded Trip',
            members: [{ uid: 'user1' }],
            startDate: { toDate: () => new Date() },
            endDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            tripDescription: '',
            isConcluded: true,
            eventIds: []
          })
        }
      ];

      (firestore as any).mockOnSnapshot.mockImplementation((cb: any) => {
        cb({ docs: mockTrips });
        return jest.fn();
      });

      const callback = jest.fn();
      listenToUserTrips('user1', 'concluded', callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'trip2',
          name: 'Concluded Trip',
          isConcluded: true
        })
      ]);
    });

    it('only returns trips where user is a member', () => {
      const mockTrips = [
        {
          id: 'trip1',
          data: () => ({
            tripName: 'My Trip',
            members: [{ uid: 'user1' }],
            startDate: { toDate: () => new Date() },
            endDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            tripDescription: '',
            isConcluded: false,
            eventIds: []
          })
        },
        {
          id: 'trip2',
          data: () => ({
            tripName: 'Other Trip',
            members: [{ uid: 'user2' }],
            startDate: { toDate: () => new Date() },
            endDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            tripDescription: '',
            isConcluded: false,
            eventIds: []
          })
        }
      ];

      (firestore as any).mockOnSnapshot.mockImplementation((cb: any) => {
        cb({ docs: mockTrips });
        return jest.fn();
      });

      const callback = jest.fn();
      listenToUserTrips('user1', 'active', callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'trip1',
          name: 'My Trip'
        })
      ]);
      expect(callback).not.toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'trip2' })
        ])
      );
    });
  });
});