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
    return () => {}; // mock unsubscribe
  })
}));

import { listenToAuthChanges, logoutUser, signInUser } from '../../app/services/authService';

describe('Auth Service', () => {
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
});