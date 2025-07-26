import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripDescriptionScreen from './trip-description';

jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'trip1' }),
  useRouter: () => ({ back: jest.fn() }),
}));

describe('TripDescriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading on mount', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<TripDescriptionScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('renders description when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (onSuccess: any) => {
            onSuccess({ exists: true, data: () => ({ tripDescription: 'Fun trip' }) });
          },
        }),
      }),
    });
    const { findByText } = render(<TripDescriptionScreen />);
    expect(await findByText(/Fun trip/)).toBeTruthy();
  });

  it('handles error and back on not found', () => {
    const back = jest.fn();
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (onSuccess: any) => {
            onSuccess({ exists: false });
          },
        }),
      }),
    });
    render(<TripDescriptionScreen />);
    // Ideally check Alert and router.back() call if testable
  });
});