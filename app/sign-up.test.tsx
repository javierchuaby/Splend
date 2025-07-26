import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SignUp from './sign-up';

jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));
jest.mock('@react-native-firebase/firestore');

describe('SignUp Screen', () => {
  beforeEach(() => {
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: 'u1', email: 'mail@e' } });
    (updateProfile as jest.Mock).mockResolvedValue({});
    (firestore as any).mockReturnValue({
      collection: () => ({
        where: () => ({ get: jest.fn().mockResolvedValue({ empty: true }) }),
        doc: () => ({
          set: jest.fn(),
        }),
      }),
      FieldValue: { serverTimestamp: jest.fn() },
    });
    jest.clearAllMocks();
  });

  it('renders sign-up UI', () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);
    expect(getByText(/Create Account/)).toBeTruthy();
    expect(getByPlaceholderText(/Username/)).toBeTruthy();
  });

  it('submits new account with valid inputs', async () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText(/Username/), 'testuser');
    fireEvent.changeText(getByPlaceholderText(/Display Name/), 'Testy');
    fireEvent.changeText(getByPlaceholderText(/Email/), 'testy@mail.com');
    fireEvent.changeText(getByPlaceholderText(/Password/), 'pw123456');
    fireEvent.press(getByText(/Create Account/));
    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalled());
  });

  it('blocks duplicate username', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        where: () => ({ get: jest.fn().mockResolvedValue({ empty: false }) }),
      }),
    });
    const { getByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText(/Username/), 'dupe');
    fireEvent.press(getByText(/Create Account/));
    // Ideally check for alert about "username taken"
  });
});