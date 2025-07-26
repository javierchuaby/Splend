import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Index from './index';

jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

describe('Index (Sign-In) Screen', () => {
  beforeEach(() => {
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    jest.clearAllMocks();
  });

  it('renders sign-in UI', () => {
    const { getByText, getByPlaceholderText } = render(<Index />);
    expect(getByText(/Sign In/)).toBeTruthy();
    expect(getByPlaceholderText(/Email/)).toBeTruthy();
    expect(getByPlaceholderText(/Password/)).toBeTruthy();
  });

  it('calls signInWithEmailAndPassword on submit', async () => {
    const { getByText, getByPlaceholderText } = render(<Index />);
    fireEvent.changeText(getByPlaceholderText(/Email/), 'test@mail.com');
    fireEvent.changeText(getByPlaceholderText(/Password/), 'password');
    fireEvent.press(getByText(/Sign In/));
    await waitFor(() => expect(signInWithEmailAndPassword).toHaveBeenCalled());
  });
});