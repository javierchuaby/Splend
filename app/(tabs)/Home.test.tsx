import { fireEvent, render } from '@testing-library/react-native';
import HomeScreen from './Home';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('HomeScreen', () => {
  it('renders create new trip button', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('+ New Trip')).toBeTruthy();
  });

  it('shows modal on clicking new trip', () => {
    const { getByText, getByLabelText } = render(<HomeScreen />);
    fireEvent.press(getByText('+ New Trip'));
    expect(getByLabelText('New Trip Modal')).toBeTruthy();
  });
});