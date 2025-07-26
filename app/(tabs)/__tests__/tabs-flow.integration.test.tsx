import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../Home';

jest.mock('@react-native-firebase/auth', () => ({
  default: {
    currentUser: { uid: 'testid' },
  },
}));
jest.mock('@react-native-firebase/firestore', () => ({
  default: {
    collection: () => ({
      orderBy: () => ({
        onSnapshot: (cb: any) =>
          cb({ docs: [] }) || (() => {}),
      }),
      doc: () => ({
        get: async () => ({
          exists: true,
          data: () => ({
            username: 'testuser',
            displayName: 'Test User',
          }),
        }),
      }),
    }),
    Timestamp: { fromDate: jest.fn() },
    FieldValue: { serverTimestamp: jest.fn() },
  },
}));

describe('Tabs Integration Flow', () => {
  it('renders Home and opens New Trip modal', async () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('+ New Trip'));
    await waitFor(() => getByText('Create'));
    expect(getByText('Create')).toBeTruthy();
  });
});