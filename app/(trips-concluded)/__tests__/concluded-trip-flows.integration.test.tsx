import { render } from '@testing-library/react-native';
import ConcludedTripInfoScreen from '../concluded-trip-info';
import ConcludedTripMembersScreen from '../concluded-trip-members';
import ConcludedTripViewScreen from '../concluded-trip-view';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'integration' }),
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

describe('Concluded Trip Screens Integration', () => {
  beforeEach(() => {
    (auth as any).mockReturnValue({ currentUser: { uid: 'current', username: 'chris', displayName: 'Chris' } });
    jest.clearAllMocks();
  });

  it('concluded trip view loads trip and events, then nav to info', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ displayName: 'Chris', username: 'chris' }) }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              tripName: 'Retrospective',
              members: [{ uid: 'current', username: 'chris', displayName: 'Chris' }],
              eventIds: ['e1'],
              startDate: { toDate: () => new Date() },
              endDate: { toDate: () => new Date() },
              createdAt: { toDate: () => new Date() },
              tripDescription: 'Summary here.',
              isConcluded: true,
            }),
          }),
        }),
        where: () => ({
          get: jest.fn().mockResolvedValue({
            docs: [
              { id: 'e1', data: () => ({
                eventName: 'Recap',
                eventLocation: {},
                startDateTime: { toDate: () => new Date() },
                endDateTime: { toDate: () => new Date() },
                memberIds: ['current'],
                billIds: [],
              }) },
            ],
          }),
        }),
      }),
      FieldPath: { documentId: () => 'id' },
    });
    const { findByText } = render(<ConcludedTripViewScreen />);
    expect(await findByText('Retrospective')).toBeTruthy();
    expect(await findByText('Recap')).toBeTruthy();
  });

  it('concluded trip info shows members and ledgers', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              tripName: 'Retrospective',
              members: [{ uid: 'current', username: 'chris', displayName: 'Chris', totalSpent: 120, totalPaid: 100 }],
              startDate: { toDate: () => new Date() },
              endDate: { toDate: () => new Date() },
              createdAt: { toDate: () => new Date() },
              tripDescription: '',
              isConcluded: true,
              eventIds: [],
            }),
          }),
        }),
      }),
    });
    const { findByText } = render(<ConcludedTripInfoScreen />);
    expect(await findByText('Retrospective')).toBeTruthy();
    expect(await findByText('120.00')).toBeTruthy();
  });

  it('concluded trip members shows all members', async () => {
    (firestore as any).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ displayName: 'Chris', username: 'chris' }) }),
          onSnapshot: (cb: any) => cb({
            exists: true,
            data: () => ({
              tripName: 'Recap Tour',
              members: [
                { uid: 'current', username: 'chris', displayName: 'Chris' },
                { uid: 'uid2', username: 'claire', displayName: 'Claire' }
              ],
              startDate: { toDate: () => new Date() },
              endDate: { toDate: () => new Date() },
              createdAt: { toDate: () => new Date() },
              tripDescription: '',
              isConcluded: true,
              eventIds: [],
            }),
          }),
        }),
      }),
    });
    const { findByText } = render(<ConcludedTripMembersScreen />);
    expect(await findByText('Chris')).toBeTruthy();
    expect(await findByText('Claire')).toBeTruthy();
  });
});