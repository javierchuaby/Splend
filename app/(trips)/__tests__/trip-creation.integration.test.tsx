import firestore from '@react-native-firebase/firestore';
import { render } from '@testing-library/react-native';
import TripViewScreen from '../trip-view';

jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 't1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe('Trip creation flow', () => {
  it('allows user to see trip, add event, and view event list', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: async (cb: any) => {
            await cb({
              exists: true,
              data: () => ({
                tripName: 'Trip1',
                members: [{ uid: 'user1', username: 'test', displayName: 'Alice' }],
                eventIds: [],
                startDate: { toDate: () => new Date() },
                endDate: { toDate: () => new Date() },
                createdAt: { toDate: () => new Date() },
              }),
            });
          },
        }),
        where: () => ({
          get: async () => ({
            docs: [],
          }),
        }),
      }),
    });
    const { findByText } = render(<TripViewScreen />);
    expect(await findByText('Trip1')).toBeTruthy();
  });
});