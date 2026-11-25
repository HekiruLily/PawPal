import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { PetListScreen } from '../screens/PetListScreen';
import { ServiceListScreen } from '../screens/ServiceListScreen';
import { ManageServicesScreen } from '../screens/ManageServicesScreen';
import { ManagerAccountScreen } from '../screens/ManagerAccountScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { AppointmentListScreen } from '../screens/AppointmentListScreen';
import { ManageAppointmentsScreen } from '../screens/ManageAppointmentsScreen';
import { ManagerDashboardScreen } from '../screens/ManagerDashboardScreen';
import { ManageGroomersScreen } from '../screens/ManageGroomersScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ManageUsersScreen } from '../screens/ManageUsersScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { BottomTabBar } from '../components/BottomTabBar';
import { ROUTES } from './routes';
import { colors, ui } from '../theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const tabBar = (props: any) =>
  props.state.routes[props.state.index]?.name === ROUTES.BOOKING ? null : (
    <BottomTabBar {...props} />
  );
function CustomerTabs() {
  return (
    <Tabs.Navigator
      id="customer-tabs"
      tabBar={tabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Tabs.Screen name={ROUTES.SERVICES} component={ServiceListScreen} />
      <Tabs.Screen name={ROUTES.BOOKING} component={BookingScreen} />
      <Tabs.Screen
        name={ROUTES.APPOINTMENTS}
        component={AppointmentListScreen}
      />
      <Tabs.Screen name={ROUTES.PETS} component={PetListScreen} />
    </Tabs.Navigator>
  );
}
function ManagerTabs() {
  return (
    <Tabs.Navigator
      id="manager-tabs"
      tabBar={tabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name={ROUTES.OVERVIEW} component={ManagerDashboardScreen} />
      <Tabs.Screen
        name={ROUTES.APPOINTMENTS}
        component={ManageAppointmentsScreen}
      />
      <Tabs.Screen name={ROUTES.SERVICES} component={ManageServicesScreen} />
      <Tabs.Screen name={ROUTES.GROOMERS} component={ManageGroomersScreen} />
      <Tabs.Screen name={ROUTES.ACCOUNT} component={ManagerAccountScreen} />
    </Tabs.Navigator>
  );
}
export function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={[ui.screen, ui.placeholder]}>
        <ActivityIndicator
          color={colors.button}
          accessibilityLabel="Đang khôi phục tài khoản"
        />
      </View>
    );
  }
  return (
    <Stack.Navigator id="root-stack" screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
          <Stack.Screen
            name={ROUTES.RESET_PASSWORD}
            component={ResetPasswordScreen}
          />
        </>
      ) : (
        <>
          {user.role === 'manager' ? (
            <>
              <Stack.Screen name={ROUTES.MANAGER} component={ManagerTabs} />
              <Stack.Screen name={ROUTES.REPORTS} component={ReportsScreen} />
              <Stack.Screen name={ROUTES.USERS} component={ManageUsersScreen} />
              <Stack.Screen name={ROUTES.FEEDBACK} component={FeedbackScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name={ROUTES.CUSTOMER} component={CustomerTabs} />
              <Stack.Screen
                name={ROUTES.BOOKING_SUCCESS}
                component={BookingSuccessScreen}
              />
              <Stack.Screen
                name={ROUTES.NOTIFICATIONS}
                component={NotificationsScreen}
              />
            </>
          )}
          <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
        </>
      )}
      <Stack.Screen name={ROUTES.INTRO} component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
