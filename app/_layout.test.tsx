import auth from '@react-native-firebase/auth';
import { render } from '@testing-library/react-native';
import RootLayout from './_layout';

jest.mock('@react-native-firebase/auth');
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSegments: jest.fn(),
}));

describe('RootLayout', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({
      onAuthStateChanged: jest.fn((cb) => { cb(null); return jest.fn(); }),
    });
    jest.clearAllMocks();
  });

  it('renders layout without crash', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });
});