jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn()
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: '123', email: 'test@example.com' } })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb({ uid: '123' });
    return () => {};
  })
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockDoc = jest.fn();
  const mockGet = jest.fn();
  const mockCollection = jest.fn(() => ({
    doc: mockDoc
  }));
  
  mockDoc.mockReturnValue({ get: mockGet });
  
  const mockFirestore = () => ({
    collection: mockCollection
  });
  
  mockFirestore.mockCollection = mockCollection;
  mockFirestore.mockDoc = mockDoc;
  mockFirestore.mockGet = mockGet;
  
  return mockFirestore;
});

import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
    getCurrentUserData,
    listenToAuthChanges,
    listenToCurrentUser,
    logoutUser,
    signInUser
} from '../../app/services/authService';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signInUser returns user object', async () => {
    const user = await signInUser('test@example.com', 'password');
    expect(user.uid).toBe('123');
    expect(user.email).toBe('test@example.com');
  });

  it('logoutUser resolves without throwing', async () => {
    await expect(logoutUser()).resolves.not.toThrow();
  });

  it('listenToAuthChanges calls callback', () => {
    const cb = jest.fn();
    listenToAuthChanges(cb);
    expect(cb).toHaveBeenCalledWith({ uid: '123' });
  });

  describe('getCurrentUserData', () => {
    it('returns null if no current user', async () => {
      (getAuth as jest.Mock).mockReturnValue({ currentUser: null });

      const result = await getCurrentUserData();
      expect(result).toBeNull();
    });

    it('returns null if user document does not exist', async () => {
      (getAuth as jest.Mock).mockReturnValue({ 
        currentUser: { uid: 'uid123' } 
      });
      
      (firestore as any).mockGet.mockResolvedValue({ 
        exists: () => false 
      });

      const result = await getCurrentUserData();
      expect(result).toBeNull();
    });

    it('returns user data if user document exists', async () => {
      const mockUserData = {
        username: 'testuser',
        displayName: 'Test User',
        billIds: ['bill1', 'bill2'],
        totalSpent: 150,
        totalPaid: 75,
      };

      (getAuth as jest.Mock).mockReturnValue({ 
        currentUser: { uid: 'uid123' } 
      });
      
      (firestore as any).mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      const result = await getCurrentUserData();
      expect(result).toEqual({
        id: 'uid123',
        ...mockUserData
      });
    });

    it('handles missing optional fields with defaults', async () => {
      const mockUserData = {
        username: 'testuser',
        displayName: 'Test User'
      };

      (getAuth as jest.Mock).mockReturnValue({ 
        currentUser: { uid: 'uid123' } 
      });
      
      (firestore as any).mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      const result = await getCurrentUserData();
      expect(result).toEqual({
        id: 'uid123',
        username: 'testuser',
        displayName: 'Test User',
        billIds: [],
        totalSpent: 0,
        totalPaid: 0
      });
    });
  });

  describe('listenToCurrentUser', () => {
    it('calls callback with null if no user signed in', () => {
      (onAuthStateChanged as jest.Mock).mockImplementation((auth, cb) => {
        cb(null);
        return jest.fn();
      });

      const callback = jest.fn();
      const unsubscribe = listenToCurrentUser(callback);
      
      expect(callback).toHaveBeenCalledWith(null);
      expect(typeof unsubscribe).toBe('function');
    });

    it('calls callback with user data if user signed in', async () => {
      const mockUserData = {
        username: 'testuser',
        displayName: 'Test User',
        billIds: [],
        totalSpent: 0,
        totalPaid: 0
      };

      (getAuth as jest.Mock).mockReturnValue({ 
        currentUser: { uid: 'uid123' } 
      });
      
      (firestore as any).mockGet.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      (onAuthStateChanged as jest.Mock).mockImplementation(async (auth, cb) => {
        await cb({ uid: 'uid123' });
        return jest.fn();
      });

      const callback = jest.fn();
      await listenToCurrentUser(callback);
      
      expect(callback).toHaveBeenCalledWith({
        id: 'uid123',
        ...mockUserData
      });
    });

    it('returns unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = listenToCurrentUser(callback);
      
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});