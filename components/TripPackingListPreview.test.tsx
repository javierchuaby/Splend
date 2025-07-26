import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripPackingListPreview from './TripPackingListPreview';

jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('TripPackingListPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner', () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: jest.fn(),
        }),
      }),
    });
    const { toJSON } = render(<TripPackingListPreview tripId="tripA" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders two packing items and more label', () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({
            data: () => ({
              packingListItems: [
                { id: '1', name: 'Camera', isChecked: false },
                { id: '2', name: 'Charger', isChecked: false },
                { id: '3', name: 'Hat', isChecked: false }
              ],
            }),
          }),
        }),
      }),
    });
    const { getByText } = render(<TripPackingListPreview tripId="tripA" />);
    expect(getByText(/Camera/)).toBeTruthy();
    expect(getByText(/Charger/)).toBeTruthy();
    expect(getByText(/\+1 more/)).toBeTruthy();
  });
});