import * as firebaseAuth from '@react-native-firebase/auth';
import * as firebaseFirestore from '@react-native-firebase/firestore';
import { render, waitFor } from '@testing-library/react-native';
import CalendarScreen from './calendar';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');

describe('CalendarScreen', () => {
  it('renders loading indicator initially', () => {
    const { getByTestId } = render(<CalendarScreen />);
    expect(getByTestId('ActivityIndicator')).toBeTruthy();
  });

  it('displays no events when user has none', async () => {
    jest.spyOn(firebaseAuth, 'default').mockReturnValue({
      currentUser: { uid: 'testuid' },
    } as any);

    jest.spyOn(firebaseFirestore, 'default').mockReturnValue({
      collection: () => ({
        where: () => ({
          onSnapshot: (success: any) =>
            success({ docs: [] }) || (() => {}),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
    } as any);

    const { findByText } = render(<CalendarScreen />);
    await waitFor(() => expect(findByText(/No events/)).toBeTruthy());
  });
});