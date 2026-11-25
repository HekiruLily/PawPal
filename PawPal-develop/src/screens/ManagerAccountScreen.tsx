import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { ActionButton } from '../components/ActionButton';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';
export function ManagerAccountScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar title="Tài khoản" manager />
      <ScrollView contentContainerStyle={ui.content}>
        <View style={[ui.card, ui.row]}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>
              {auth.user?.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={ui.grow}>
            <Text style={ui.heading}>{auth.user?.name}</Text>
            <Text style={ui.meta}>{auth.user?.email}</Text>
          </View>
        </View>
        <ActionButton
          title="Báo cáo thống kê"
          icon="bar-chart-2"
          variant="secondary"
          onPress={() => navigation.navigate(ROUTES.REPORTS)}
        />
        <ActionButton
          title="Hồ sơ của tôi"
          icon="user"
          variant="secondary"
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
        />
        <ActionButton
          title="Quản lý khách hàng"
          icon="users"
          variant="secondary"
          onPress={() => navigation.navigate(ROUTES.USERS)}
        />
        <ActionButton
          title="Phản hồi khách hàng"
          icon="message-circle"
          variant="secondary"
          onPress={() => navigation.navigate(ROUTES.FEEDBACK)}
        />
        <ActionButton
          title="Xem giới thiệu"
          variant="text"
          onPress={() => navigation.navigate(ROUTES.INTRO)}
        />
        {auth.error ? <Text style={ui.error}>{auth.error}</Text> : null}
        <ActionButton
          title="Đăng xuất"
          icon="log-out"
          variant="secondary"
          loading={auth.busy}
          onPress={auth.logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    color: colors.tealDark,
  },
});
