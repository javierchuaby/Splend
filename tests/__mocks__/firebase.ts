export const mockUser = {
  uid: 'testUid',
  email: 'user@splend.dev',
  displayName: 'Splendy Test',
  username: 'splenduser',
};

export const mockAuth = {
  currentUser: mockUser,
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockUser }),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockUser }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(),
};

export const mockFirestoreDoc = (data = {}) => ({
  get: jest.fn().mockResolvedValue({ exists: true, data: () => data }),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  onSnapshot: jest.fn((cb) => cb({ exists: true, data: () => data })),
});

export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => mockFirestoreDoc()),
    where: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    })),
    orderBy: jest.fn(() => ({
      onSnapshot: jest.fn(),
    })),
  })),
  FieldValue: { arrayUnion: jest.fn(), arrayRemove: jest.fn(), serverTimestamp: jest.fn() },
  FieldPath: { documentId: jest.fn() },
  Timestamp: { fromDate: jest.fn((date: Date) => date) },
  batch: jest.fn(() => ({
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
};