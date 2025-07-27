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
  const data = {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ empty: false }))
      })),
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve())
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'timestamp')
    }
  };

  const mockFirestore = () => data;
  mockFirestore.FieldValue = data.FieldValue; // <-- this line is key

  return mockFirestore;
});

import { createUserAccount, isUsernameTaken } from '../../app/services/firestoreService';

describe('Firestore Service - Sign Up', () => {
  it('isUsernameTaken returns true if username exists', async () => {
    const exists = await isUsernameTaken('testuser');
    expect(exists).toBe(true);
  });

  it('createUserAccount creates and signs out user', async () => {
    const user = await createUserAccount('test@example.com', 'pass123', 'Test User', 'testuser');
    expect(user.uid).toBe('abc123');
    expect(user.email).toBe('test@example.com');
  });
});