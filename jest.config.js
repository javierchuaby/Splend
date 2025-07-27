module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?|@unimodules|unimodules|@react-native-community|@react-native-firebase)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};