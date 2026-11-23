import React from 'react';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {colors} from '../theme';

const labels: Record<string, string> = {
  Overview: 'Tổng quan',
  Appointments: 'Lịch hẹn',
  Services: 'Dịch vụ',
  Groomers: 'Nhân viên',
  Account: 'Tài khoản',
};

const icons: Record<string, string> = {
  Overview: 'bar-chart-2',
  Appointments: 'calendar',
  Services: 'scissors',
  Groomers: 'users',
  Account: 'user',
};

export function BottomTabBar({state, navigation}: BottomTabBarProps) {
  const visibleRoutes = state.routes.filter(route =>
    ['Overview', 'Appointments', 'Services', 'Groomers', 'Account'].includes(route.name));
  return <SafeAreaView style={styles.safe}>
    <View style={styles.bar}>
      {visibleRoutes.map((route, index) => {
        const focused = state.index === index;
        const color = focused
          ? route.name === 'Account' ? '#98292F' : colors.ink
          : colors.muted;
        const iconBackground = route.name === 'Account' && focused
          ? '#FFDCC1'
          : focused ? '#FFDCC1' : 'transparent';

        return <TouchableOpacity
          key={route.key}
          accessibilityRole="button"
          accessibilityState={focused ? {selected: true} : {}}
          accessibilityLabel={labels[route.name]}
          onPress={() => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          }}
          style={styles.item}
        >
          <View style={[styles.iconWrap, {backgroundColor: iconBackground}]}>
            <Feather name={icons[route.name] as any} size={21} color={color} />
          </View>
          <Text style={[styles.label, {color}]} numberOfLines={1}>{labels[route.name]}</Text>
        </TouchableOpacity>;
      })}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.nav,
  },
  bar: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.nav,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconWrap: {
    width: 52,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
