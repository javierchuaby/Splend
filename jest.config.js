module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    '**/tests/**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest'
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  globals: {
    'process.env': {
      EXPO_OS: 'ios',
      NODE_ENV: 'test'
    }
  }
};