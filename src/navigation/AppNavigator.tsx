import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ManagerDashboardScreen} from '../screens/ManagerDashboardScreen';
import {ManageGroomersScreen} from '../screens/ManageGroomersScreen';
import {ManagerAccountScreen} from '../screens/ManagerAccountScreen';
import {ReportsScreen} from '../screens/ReportsScreen';
import {PlaceholderManagerScreen} from '../screens/PlaceholderManagerScreen';
import {ROUTES} from './routes';
import {BottomTabBar} from '../components/BottomTabBar';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function ManagerTabBar(props: any) {
  return <BottomTabBar {...props} />;
}

function ManagerTabs() {
  return <Tabs.Navigator
    id="manager-tabs"
    tabBar={ManagerTabBar}
    screenOptions={{headerShown: false}}
  >
    <Tabs.Screen name={ROUTES.OVERVIEW} component={ManagerDashboardScreen} options={{title: 'Tổng quan'}} />
    <Tabs.Screen name={ROUTES.APPOINTMENTS} component={PlaceholderManagerScreen} options={{title: 'Lịch hẹn'}} />
    <Tabs.Screen name={ROUTES.SERVICES} component={PlaceholderManagerScreen} options={{title: 'Dịch vụ'}} />
    <Tabs.Screen name={ROUTES.GROOMERS} component={ManageGroomersScreen} options={{title: 'Nhân viên'}} />
    <Tabs.Screen name={ROUTES.ACCOUNT} component={ManagerAccountScreen} options={{title: 'Tài khoản'}} />
    <Tabs.Screen name={ROUTES.REPORTS} component={ReportsScreen} options={{title: 'Báo cáo', tabBarButton: () => null}} />
  </Tabs.Navigator>;
}

export function AppNavigator() {
  return <Stack.Navigator id="root-stack" screenOptions={{headerShown: false}}>
    <Stack.Screen name="Manager" component={ManagerTabs} />
  </Stack.Navigator>;
}
