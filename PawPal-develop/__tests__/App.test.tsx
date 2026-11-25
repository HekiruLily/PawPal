/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('react-native-vector-icons/FontAwesome', () => 'FontAwesome');
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('../src/api/authApi', () => ({
  configureAuthStorage: jest.fn(),
  isFirebaseConfigured: () => false,
  observeAuth: () => {
    throw new Error(
      'Kết nối tài khoản chưa được cấu hình. Xem FIREBASE_SETUP.md.',
    );
  },
}));
jest.mock('../src/api/petApi', () => ({}));
jest.mock('../src/api/serviceApi', () => ({}));
jest.mock('../src/api/profileApi', () => ({}));
jest.mock('../src/services/firebaseService', () => ({
  getFirebase: jest.fn(() => {
    throw new Error('Firebase is not configured');
  }),
}));

test('shows the setup message without credentials or a network request', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(JSON.stringify(tree!.toJSON())).toContain('FIREBASE_SETUP.md');
  await ReactTestRenderer.act(() => tree!.unmount());
});
