import React, { useEffect, useRef } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors } from '../theme';
import { fonts } from '../theme/typography';
import { useReducedMotion } from '../hooks/useReducedMotion';

const labels: Record<string, string> = {
  Home: 'Trang chủ',
  Booking: 'Đặt lịch',
  Pets: 'Thú cưng',
  Overview: 'Tổng quan',
  Appointments: 'Lịch hẹn',
  Services: 'Dịch vụ',
  Groomers: 'Nhân viên',
  Account: 'Tài khoản',
};
const icons: Record<string, string> = {
  Home: 'home',
  Booking: 'plus',
  Overview: 'bar-chart-2',
  Appointments: 'calendar',
  Services: 'scissors',
  Groomers: 'users',
  Account: 'user',
};

function TabItem({
  name,
  focused,
  reduced,
  onPress,
  onLongPress,
}: {
  name: string;
  focused: boolean;
  reduced: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const selection = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const booking = name === 'Booking';
  useEffect(() => {
    const animation = Animated.timing(selection, {
      toValue: focused ? 1 : 0,
      duration: reduced ? 0 : 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, selection]);
  const color = booking ? colors.on : focused ? colors.navMark : colors.muted;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={labels[name]}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, booking && styles.booking]}>
        {!booking ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { opacity: selection }]}
          />
        ) : null}
        {name === 'Pets' ? (
          <FontAwesome name="paw" size={19} color={color} />
        ) : (
          <Feather name={icons[name]} size={19} color={color} />
        )}
      </View>
      <Text
        style={[
          styles.label,
          (focused || booking) && styles.activeLabel,
          { color: booking || focused ? colors.tealDark : colors.muted },
        ]}
        numberOfLines={1}
      >
        {labels[name]}
      </Text>
    </Pressable>
  );
}

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const reduced = useReducedMotion();
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        {state.routes
          .filter(route => labels[route.name])
          .map(route => {
            const focused = state.routes[state.index]?.key === route.key;
            return (
              <TabItem
                key={route.key}
                name={route.name}
                focused={focused}
                reduced={reduced}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
                onLongPress={() =>
                  navigation.emit({ type: 'tabLongPress', target: route.key })
                }
              />
            );
          })}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { backgroundColor: colors.nav },
  bar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.nav,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 47,
    paddingTop: 4,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 42,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.navActive,
  },
  booking: { width: 37, borderRadius: 10, backgroundColor: colors.button },
  label: { fontSize: 11, lineHeight: 15, fontFamily: fonts.semibold },
  activeLabel: { fontFamily: fonts.extraBold },
  pressed: { opacity: 0.85 },
});
