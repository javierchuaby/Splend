module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  moduleNameMapper: {
    '^@react-native-firebase/auth$': '<rootDir>/tests/__mocks__/firebase.ts',
    '^@react-native-firebase/firestore$': '<rootDir>/tests/__mocks__/firebase.ts',
    '^@/(.*)$': '<rootDir>/app/$1',
    '^components/(.*)$': '<rootDir>/components/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};