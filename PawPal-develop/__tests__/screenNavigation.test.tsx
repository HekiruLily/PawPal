import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from '../src/navigation/AppNavigator';
import { ToastProvider } from '../src/context/ToastContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from '../src/screens/HomeScreen';
import { BookingScreen } from '../src/screens/BookingScreen';
import { ServiceListScreen } from '../src/screens/ServiceListScreen';
import { PetListScreen } from '../src/screens/PetListScreen';
import { AppointmentListScreen } from '../src/screens/AppointmentListScreen';
import { ManagerDashboardScreen } from '../src/screens/ManagerDashboardScreen';
import { ManageAppointmentsScreen } from '../src/screens/ManageAppointmentsScreen';
import { ManageServicesScreen } from '../src/screens/ManageServicesScreen';
import { ManageGroomersScreen } from '../src/screens/ManageGroomersScreen';
import { ManagerAccountScreen } from '../src/screens/ManagerAccountScreen';
import { ReportsScreen } from '../src/screens/ReportsScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { ChipFilterBar } from '../src/components/ChipFilterBar';
import { FormField } from '../src/components/FormField';
jest.setTimeout(20000);
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('react-native-vector-icons/FontAwesome', () => 'FontAwesome');
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../src/services/firebaseService', () => ({
  getFirebase: jest.fn(),
}));
jest.mock('../src/api/petApi', () => ({
  observePets: (next: Function) => {
    next([
      {
        id: '-pet',
        name: 'Bơ',
        species: 'Chó',
        breed: '',
        age: 2,
        size: 'Vừa',
        gender: 'Cái',
        notes: '',
        imageURL: '',
      },
    ]);
    return jest.fn();
  },
}));
jest.mock('../src/api/serviceApi', () => ({
  observeServices: (next: Function) => {
    next([
      {
        id: '-service',
        name: 'Tắm & sấy khô',
        category: 'Tắm',
        price: 180000,
        duration: 60,
        description: '',
        active: true,
        imageURL: '',
        revision: 0,
      },
    ]);
    return jest.fn();
  },
}));
jest.mock('../src/api/profileApi', () => ({
  observeProfile: (next: Function) => {
    next({
      name: 'Anh Thư',
      email: 'customer@pawpal.test',
      phoneNumber: '0912345678',
      address: '',
    });
    return jest.fn();
  },
}));
jest.mock('../src/hooks/useApiData', () => ({
  useApiData: () => ({
    data: null,
    error: 'Đang chờ kết nối dữ liệu',
    loading: false,
    reload: jest.fn(),
  }),
}));
const mockAuth = {
  user: {
    uid: 'customer',
    name: 'Anh Thư',
    email: 'customer@pawpal.test',
    role: 'customer',
  },
  loading: false,
  configured: true,
  error: '',
  logout: jest.fn(),
};
let tree: TestRenderer.ReactTestRenderer;
async function render() {
  await act(async () => {
    tree = TestRenderer.create(
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>,
    );
  });
}
async function press(label: string) {
  const button = tree.root.findAll(
    node =>
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
  expect(button).toBeDefined();
  await act(async () => button.props.onPress());
}
afterEach(async () => {
  if (tree) await act(() => tree.unmount());
});

test('customer reaches all five tabs, exits booking, and opens profile', async () => {
  mockAuth.user.role = 'customer';
  await render();
  expect(tree.root.findAllByType(HomeScreen)).toHaveLength(1);
  await press('Lịch sử');
  expect(
    tree.root.findByType(AppointmentListScreen).findAllByType(ChipFilterBar)[0]
      .props.value,
  ).toBe('Lịch sử');
  await press('Trang chủ');
  await press('Xem lịch ›');
  expect(
    tree.root.findByType(AppointmentListScreen).findAllByType(ChipFilterBar)[0]
      .props.value,
  ).toBe('Sắp tới');
  await press('Dịch vụ');
  expect(tree.root.findAllByType(ServiceListScreen)).toHaveLength(1);
  await press('Lịch hẹn');
  expect(tree.root.findAllByType(AppointmentListScreen)).toHaveLength(1);
  await press('Thú cưng');
  expect(tree.root.findAllByType(PetListScreen)).toHaveLength(1);
  await press('Đặt lịch');
  expect(tree.root.findAllByType(BookingScreen)).toHaveLength(1);
  expect(
    tree.root.findAll(
      node =>
        node.props.accessibilityLabel === 'Trang chủ' &&
        typeof node.props.onPress === 'function',
    ),
  ).toHaveLength(0);
  await press('Đóng đặt lịch');
  await press('Hồ sơ của tôi');
  expect(tree.root.findAllByType(ProfileScreen)).toHaveLength(1);
});
test('manager reaches five working tabs and the reports screen', async () => {
  mockAuth.user.role = 'manager';
  await render();
  expect(tree.root.findAllByType(ManagerDashboardScreen)).toHaveLength(1);
  await press('Lịch hẹn cần xử lý');
  expect(
    tree.root.findByType(ManageAppointmentsScreen).findByType(FormField).props
      .value,
  ).toBe('Chờ xác nhận');
  await press('Tổng quan');
  await press('Xem tất cả ›');
  expect(
    tree.root.findByType(ManageAppointmentsScreen).findByType(FormField).props
      .value,
  ).toBe('Tất cả');
  await press('Lịch hẹn');
  expect(tree.root.findAllByType(ManageAppointmentsScreen)).toHaveLength(1);
  await press('Dịch vụ');
  expect(tree.root.findAllByType(ManageServicesScreen)).toHaveLength(1);
  await press('Nhân viên');
  expect(tree.root.findAllByType(ManageGroomersScreen)).toHaveLength(1);
  await press('Tài khoản');
  expect(tree.root.findAllByType(ManagerAccountScreen)).toHaveLength(1);
  await press('Báo cáo thống kê');
  expect(tree.root.findAllByType(ReportsScreen)).toHaveLength(1);
});
