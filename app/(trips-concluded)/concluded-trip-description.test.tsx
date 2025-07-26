import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import ConcludedTripDescriptionScreen from './concluded-trip-description';

jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'triptest' }),
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
}));
jest.spyOn(global, 'alert').mockImplementation(() => {});

describe('ConcludedTripDescriptionScreen', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('renders loading initially', () => {
    (firestore as any).mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    });
    const { getByText } = render(<ConcludedTripDescriptionScreen />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('shows description when loaded', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({ isConcluded: true, tripDescription: 'Trip is over.' }),
          }),
        }),
      }),
    });
    const { findByText } = render(<ConcludedTripDescriptionScreen />);
    expect(await findByText(/Trip is over/)).toBeTruthy();
  });

  it('handles not-found trip', () => {
    const back = jest.fn();
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({ exists: false }),
        }),
      }),
    });
    render(<ConcludedTripDescriptionScreen />);
    // Would check Alert and router.back
  });
});