import * as firebaseAuth from '@react-native-firebase/auth';
import * as firebaseFirestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import ProfileScreen from './profile';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');

describe('ProfileScreen', () => {
  it('renders greeting and buttons', async () => {
    jest.spyOn(firebaseAuth, 'default').mockReturnValue({
      currentUser: { uid: 'test' },
      signOut: jest.fn(),
    } as any);
    jest.spyOn(firebaseFirestore, 'default').mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({
              displayName: 'Alice',
              username: 'alice',
            }),
          }),
          update: jest.fn(),
        }),
        where: jest.fn(),
      }),
    } as any);

    const { findByText } = render(<ProfileScreen />);
    expect(await findByText(/Good/)).toBeTruthy();
    expect(await findByText(/Change Display Name/)).toBeTruthy();
    expect(await findByText(/Sign Out/)).toBeTruthy();
  });
});