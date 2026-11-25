import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

export type GroomerItem = {
  gid: number;
  name?: string;
  gender?: string;
  rank?: number;
  phoneNumber?: string;
  description?: string;
  address?: string;
  title?: string;
  experienceYears?: number;
  specialties?: string;
  acceptingAppointments?: boolean;
  upcomingAppointmentCount?: number;
};

export const GroomerCard = memo(function GroomerCardView({item}: {item: GroomerItem}) {
  return <View style={styles.card}>
    <View style={styles.avatar}><Text style={styles.avatarText}>{item.name?.slice(0, 1) || '?'}</Text></View>
    <View style={styles.info}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.meta}>{item.gender || 'Chưa cập nhật'} · Hạng {item.rank ?? '-'}</Text>
      <Text style={styles.meta}>{item.phoneNumber || 'Chưa có số điện thoại'}</Text>
    </View>
  </View>;
});

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm, borderRadius: spacing.radius, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line},
  avatar: {width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealLight},
  avatarText: {...typography.heading, color: colors.tealDark},
  info: {marginLeft: spacing.md, flex: 1},
  name: {fontWeight: '800', color: colors.ink},
  meta: {marginTop: 3, color: colors.muted, fontSize: 13},
});
