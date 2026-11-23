import React from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native';
import {TopBar} from '../components/TopBar';
import {useManagerStats} from '../hooks/useManagerStats';
import {colors, spacing} from '../theme';
import {StatSummaryCard} from '../components/StatSummaryCard';

export function ManagerDashboardScreen() {
  const {data, loading} = useManagerStats();
  return <SafeAreaView style={styles.screen}>
    <TopBar title="Tổng quan" />
    {loading ? <ActivityIndicator color={colors.teal} /> : <View style={styles.grid}>
      <StatSummaryCard label="Tổng lịch hẹn" value={data?.totalAppointments ?? 0} />
      <StatSummaryCard label="Doanh thu" value={`${data?.revenue ?? 0} đ`} />
      <StatSummaryCard label="Chờ xác nhận" value={data?.pendingAppointments ?? 0} />
      <StatSummaryCard label="Khách hàng" value={data?.customerCount ?? 0} />
    </View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  grid: {padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
});
