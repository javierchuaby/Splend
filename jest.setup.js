import 'react-native-gesture-handler/jestSetup';

// Set up environment variables
process.env.EXPO_OS = 'ios';
process.env.NODE_ENV = 'test';

// Mock React Native components with proper function components
jest.mock('react-native', () => {
  const React = require('react');
  
  const mockComponent = (name) => {
    const Component = React.forwardRef((props, ref) => {
      return React.createElement(name, { ...props, ref });
    });
    Component.displayName = name;
    return Component;
  };

  return {
    // Core UI Components
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    ScrollView: mockComponent('ScrollView'),
    FlatList: mockComponent('FlatList'),
    SectionList: mockComponent('SectionList'),
    TextInput: mockComponent('TextInput'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    Image: mockComponent('Image'),
    Modal: mockComponent('Modal'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    SafeAreaView: mockComponent('SafeAreaView'),
    StatusBar: mockComponent('StatusBar'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    RefreshControl: mockComponent('RefreshControl'),
    
    // APIs
    Alert: {
      alert: jest.fn()
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812
      }))
    },
    StyleSheet: {
      create: jest.fn(styles => styles),
      hairlineWidth: 1,
      absoluteFill: {},
      absoluteFillObject: {},
      // Critical: Add flatten function for @testing-library/react-native
      flatten: jest.fn((styles) => {
        if (!styles) return undefined;
        if (Array.isArray(styles)) {
          return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
        }
        return styles;
      })
    },
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn(obj => obj.ios)
    },
    PixelRatio: {
      get: jest.fn(() => 2)
    },
    
    // Animated
    Animated: {
      View: mockComponent('Animated.View'),
      Text: mockComponent('Animated.Text'),
      ScrollView: mockComponent('Animated.ScrollView'),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        interpolate: jest.fn(() => ({ setValue: jest.fn() }))
      })),
      timing: jest.fn(() => ({
        start: jest.fn()
      })),
      spring: jest.fn(() => ({
        start: jest.fn()
      })),
      decay: jest.fn(() => ({
        start: jest.fn()
      }))
    }
  };
});

// Mock Picker component with proper structure
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  
  const MockPicker = React.forwardRef((props, ref) => {
    return React.createElement('Picker', { ...props, ref });
  });
  MockPicker.displayName = 'Picker';
  
  const MockPickerItem = React.forwardRef((props, ref) => {
    return React.createElement('Picker.Item', { ...props, ref });
  });
  MockPickerItem.displayName = 'Picker.Item';
  
  MockPicker.Item = MockPickerItem;
  
  return {
    Picker: MockPicker
  };
});

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  
  const iconLibraries = [
    'AntDesign',
    'Entypo', 
    'EvilIcons',
    'Feather',
    'FontAwesome',
    'FontAwesome5',
    'Fontisto',
    'Foundation',
    'Ionicons',
    'MaterialCommunityIcons',
    'MaterialIcons',
    'Octicons',
    'SimpleLineIcons',
    'Zocial'
  ];

  const mockIcon = (name) => {
    const MockIcon = React.forwardRef((props, ref) => {
      return React.createElement(name, { ...props, ref });
    });
    MockIcon.displayName = name;
    return MockIcon;
  };

  const mocks = {};
  iconLibraries.forEach(iconName => {
    mocks[iconName] = mockIcon(iconName);
  });

  return mocks;
});

// Mock Firebase services (existing mocks)
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({
    name: 'mock-app',
    options: {}
  })),
  initializeApp: jest.fn(),
  __esModule: true,
  default: jest.fn(() => ({
    name: 'mock-app',
    options: {}
  }))
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null
  })),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: '123', email: 'test@example.com' } })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(null);
    return () => {}; // mock unsubscribe
  }),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({ user: { uid: 'abc123', email: 'test@example.com' } })
  ),
  updateProfile: jest.fn(() => Promise.resolve()),
  __esModule: true,
  default: jest.fn()
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockGet = jest.fn();
  const mockAdd = jest.fn();
  const mockSet = jest.fn();
  const mockWhere = jest.fn();
  const mockLimit = jest.fn();
  const mockOrderBy = jest.fn();
  const mockStartAt = jest.fn();
  const mockEndAt = jest.fn();
  const mockOnSnapshot = jest.fn();
  const mockDoc = jest.fn();

  // Chain mock methods
  mockWhere.mockReturnValue({ get: mockGet, limit: mockLimit });
  mockLimit.mockReturnValue({ get: mockGet });
  mockOrderBy.mockReturnValue({ 
    onSnapshot: mockOnSnapshot,
    startAt: mockStartAt 
  });
  mockStartAt.mockReturnValue({ endAt: mockEndAt });
  mockEndAt.mockReturnValue({ get: mockGet });
  mockDoc.mockReturnValue({ set: mockSet });

  const mockCollection = jest.fn(() => ({
    where: mockWhere,
    limit: mockLimit,
    orderBy: mockOrderBy,
    startAt: mockStartAt,
    endAt: mockEndAt,
    get: mockGet,
    add: mockAdd,
    doc: mockDoc,
    onSnapshot: mockOnSnapshot
  }));

  const mockFirestore = jest.fn(() => ({
    collection: mockCollection
  }));

  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => 'timestamp')
  };
  
  mockFirestore.Timestamp = {
    fromDate: jest.fn((date) => ({ toDate: () => date }))
  };

  // Store references for test access
  mockFirestore.mockGet = mockGet;
  mockFirestore.mockAdd = mockAdd;
  mockFirestore.mockWhere = mockWhere;
  mockFirestore.mockLimit = mockLimit;
  mockFirestore.mockOrderBy = mockOrderBy;
  mockFirestore.mockOnSnapshot = mockOnSnapshot;

  return mockFirestore;
});

// Mock Expo router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: {
    Screen: jest.fn()
  }
}));

// Mock Expo constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {}
  }
}));

// Suppress console warnings for cleaner test output
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('The global process.env.EXPO_OS is not defined') ||
      args[0]?.includes?.('Unknown option "moduleNameMapping"') ||
      args[0]?.includes?.('EXNativeModulesProxy')) {
    return;
  }
  originalWarn(...args);
};