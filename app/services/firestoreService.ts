import { getApp } from '@react-native-firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    signOut,
    updateProfile
} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

export interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  tripDescription: string;
  isConcluded: boolean;
  eventIds: string[];
}

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const query = await firestore()
    .collection('users')
    .where('username', '==', username.toLowerCase())
    .get();
  return !query.empty;
};

export const createUserAccount = async (
  email: string,
  password: string,
  displayName: string,
  username: string
) => {
  const app = getApp();
  const auth = getAuth(app);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user) {
    await updateProfile(user, { displayName });
    await firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName,
      username: username.toLowerCase(),
      createdAt: firestore.FieldValue.serverTimestamp()
    });
    await signOut(auth);
  }

  return user;
};

export const searchUsersByQuery = async (query: string, excludeUserIds: string[] = []): Promise<TripMember[]> => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const usersRef = firestore().collection('users');
  let foundUsers: TripMember[] = [];

  const usernameSnapshot = await usersRef
    .where('username', '==', lowerQuery)
    .limit(1)
    .get();

  usernameSnapshot.forEach(doc => {
    const userData = doc.data();
    foundUsers.push({
      id: doc.id,
      username: userData.username,
      displayName: userData.displayName,
      billIds: userData?.billIds || [],
      totalSpent: userData?.totalSpent || 0,
      totalPaid: userData?.totalPaid || 0,
    });
  });

  if (foundUsers.length === 0) {
    const displayNameSnapshot = await usersRef
      .orderBy('displayName')
      .startAt(lowerQuery.charAt(0).toUpperCase() + lowerQuery.slice(1))
      .endAt(lowerQuery.charAt(0).toUpperCase() + lowerQuery.slice(1) + '\uf8ff')
      .get();

    displayNameSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.displayName.toLowerCase().includes(lowerQuery)) {
        foundUsers.push({
          id: doc.id,
          username: userData.username,
          displayName: userData.displayName,
          billIds: userData?.billIds || [],
          totalSpent: userData?.totalSpent || 0,
          totalPaid: userData?.totalPaid || 0,
        });
      }
    });
  }

  return foundUsers.filter(user => !excludeUserIds.includes(user.id));
};

export const createTrip = async (
  tripName: string,
  tripDescription: string,
  startDate: Date,
  endDate: Date,
  members: TripMember[]
) => {
  const allMembers = members.map(member => ({
    uid: member.id,
    username: member.username,
    displayName: member.displayName,
    billIds: [],
    totalSpent: 0,
    totalPaid: 0,
  }));

  const docRef = await firestore().collection('trips').add({
    tripName: tripName.trim(),
    tripDescription: tripDescription.trim(),
    startDate: firestore.Timestamp.fromDate(startDate),
    endDate: firestore.Timestamp.fromDate(endDate),
    members: allMembers,
    eventIds: [],
    createdAt: firestore.FieldValue.serverTimestamp(),
    isConcluded: false,
  });

  return docRef.id;
};

export const listenToUserTrips = (
  userId: string,
  filter: 'active' | 'concluded',
  callback: (trips: Trip[]) => void
) => {
  return firestore()
    .collection('trips')
    .orderBy('startDate')
    .onSnapshot(snapshot => {
      const tripsData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.tripName,
            members: data.members.map((member: any) => ({
              id: member.uid,
              username: member.username,
              displayName: member.displayName,
              billIds: member.billIds || [],
              totalSpent: member.totalSpent || 0,
              totalPaid: member.totalPaid || 0,
            })),
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            createdAt: data.createdAt?.toDate(),
            tripDescription: data.tripDescription,
            isConcluded: data.isConcluded,
            eventIds: data.eventIds || [],
          };
        })
        .filter((trip: Trip) =>
          trip.members.some((member: TripMember) => member.id === userId) &&
          (filter === 'active' ? !trip.isConcluded : trip.isConcluded)
        );

      callback(tripsData);
    });
};