import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {TopBar} from '../components/TopBar';
import {colors, spacing, typography} from '../theme';

export function ManagerAccountScreen() {
  const navigation = useNavigation<any>();
  return <SafeAreaView style={styles.screen}>
    <TopBar title="Tài khoản" />
    <View style={styles.profile}>
      <View style={styles.avatar}><Text style={styles.avatarIcon}>♙</Text></View>
      <View style={styles.profileText}>
        <Text style={styles.name}>Quản lý cửa hàng</Text>
        <Text style={styles.email}>manager@pawpal.demo</Text>
      </View>
    </View>
    <View style={styles.menu}>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Reports')}>
        <Text style={styles.rowIcon}>⌁</Text>
        <Text style={styles.rowText}>Báo cáo và xuất CSV</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row}>
        <Text style={styles.rowIcon}>↪</Text>
        <Text style={styles.rowText}>Đăng xuất</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  profile: {
    marginHorizontal: spacing.lg,
    marginTop: 4,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: spacing.radius,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealLight,
  },
  avatarIcon: {fontSize: 30, color: colors.tealDark},
  profileText: {marginLeft: spacing.md},
  name: {...typography.heading, color: colors.ink},
  email: {marginTop: 2, color: colors.muted},
  menu: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: spacing.radius,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  row: {
    minHeight: 68,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {width: 32, color: colors.danger, fontSize: 21},
  rowText: {flex: 1, color: colors.ink, fontWeight: '700'},
  chevron: {color: colors.ink, fontSize: 28},
});
