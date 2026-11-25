import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { managerApi } from '../api/managerApi';
import { useApiData } from '../hooks/useApiData';
import { useAppointments } from '../hooks/useAppointments';
import {
  storeDate,
  timeLabel,
  appointmentServices,
  effectiveStatus,
} from '../utils/appointments';
import { formatCurrency } from '../utils/currency';
import { TopBar } from '../components/TopBar';
import { IconButton } from '../components/IconButton';
import { ActionButton } from '../components/ActionButton';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import {
  PeriodFilter,
  MetricGrid,
  ReportCharts,
} from '../components/ReportCharts';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';

export function ManagerDashboardScreen({ navigation }: { navigation: any }) {
  const [period, setPeriod] = useState('7');
  const data = useApiData(() => managerApi.getDashboard(period), period);
  const appointments = useAppointments(true);
  const report = data.data;
  const today = appointments.items
    .filter(
      item =>
        item.startTime.slice(0, 10) === storeDate() &&
        ['pending', 'confirmed', 'completed'].includes(effectiveStatus(item)),
    )
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar
        title="Tổng quan"
        manager
        right={
          <IconButton
            name="bell"
            label="Lịch hẹn cần xử lý"
            badge={report?.pendingAppointments}
            onPress={() =>
              navigation.navigate(ROUTES.APPOINTMENTS, {
                pending: true,
                request: Date.now(),
              })
            }
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={ui.row}>
          <View style={styles.brand}>
            <FontAwesome name="paw" size={19} color={colors.tealDark} />
          </View>
          <Text style={ui.meta}>Quản lý PawPal</Text>
        </View>
        <View style={styles.priority}>
          <Text style={styles.date}>
            Hôm nay · {storeDate().split('-').reverse().join('/')}
          </Text>
          <Text style={ui.title}>Lịch hẹn cần xử lý</Text>
          <View style={ui.row}>
            <View style={styles.pending}>
              <Text style={styles.pendingCount}>
                {report?.pendingAppointments ?? '—'}
              </Text>
              <Text style={styles.pendingLabel}>Chờ xác nhận</Text>
            </View>
            <View style={styles.today}>
              <Text style={styles.todayCount}>
                {appointments.data ? today.length : '—'}
              </Text>
              <Text style={ui.meta}>Lịch hôm nay</Text>
            </View>
          </View>
          <ActionButton
            title="Mở danh sách lịch hẹn"
            size="small"
            onPress={() =>
              navigation.navigate(ROUTES.APPOINTMENTS, {
                pending: false,
                request: Date.now(),
              })
            }
          />
        </View>
        <View style={ui.row}>
          {[
            ['Dịch vụ', ROUTES.SERVICES],
            ['Nhân viên', ROUTES.GROOMERS],
            ['Báo cáo', ROUTES.REPORTS],
          ].map(([label, target]) => (
            <View style={ui.grow} key={target}>
              <ActionButton
                title={label}
                variant="secondary"
                size="small"
                onPress={() => navigation.navigate(target)}
              />
            </View>
          ))}
        </View>
        <View style={ui.between}>
          <Text style={ui.heading}>Lịch hôm nay</Text>
          <ActionButton
            title="Xem tất cả ›"
            variant="text"
            size="small"
            onPress={() =>
              navigation.navigate(ROUTES.APPOINTMENTS, {
                pending: false,
                request: Date.now(),
              })
            }
          />
        </View>
        <DataState
          loading={appointments.loading}
          error={appointments.error}
          onRetry={appointments.reload}
        />
        {today.map(item => (
          <View key={item.aid} style={[styles.compact, ui.row]}>
            <Text numberOfLines={1} style={styles.time}>
              {timeLabel(item.startTime)}
            </Text>
            <View style={ui.grow}>
              <Text style={ui.heading}>{item.petName}</Text>
              <Text style={ui.meta}>{appointmentServices(item)}</Text>
              <Text style={ui.meta}>{item.groomerName}</Text>
            </View>
          </View>
        ))}
        {!appointments.loading && !appointments.error && !today.length ? (
          <EmptyState message="Chưa có lịch hẹn hôm nay." />
        ) : null}
        <Text style={ui.heading}>Hoạt động cửa hàng</Text>
        <PeriodFilter value={period} onChange={setPeriod} />
        <DataState
          loading={data.loading}
          error={data.error}
          onRetry={data.reload}
        />
        <MetricGrid
          items={[
            [
              'Doanh thu hoàn thành',
              report ? formatCurrency(report.revenue) : '—',
            ],
            ['Lịch hoàn thành', report?.statusCounts.completed ?? '—'],
            ['Khách hàng', report?.customerCount ?? '—'],
            ['Thú cưng', report?.petCount ?? '—'],
          ]}
        />
        {report ? <ReportCharts data={report} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { ...ui.content, padding: 15, gap: 10 },
  brand: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priority: {
    borderRadius: 20,
    padding: 15,
    gap: 12,
    backgroundColor: '#FFE28B',
  },
  date: { ...ui.meta, fontSize: 11 },
  pending: {
    flex: 1,
    backgroundColor: colors.button,
    borderRadius: 13,
    padding: 12,
  },
  pendingCount: { fontFamily: fonts.extraBold, fontSize: 29, color: colors.on },
  pendingLabel: { ...ui.meta, color: colors.on, fontSize: 11 },
  today: {
    flex: 1,
    borderRadius: 13,
    padding: 12,
    backgroundColor: colors.card,
  },
  todayCount: { ...ui.heading, fontSize: 29, lineHeight: 35 },
  compact: { ...ui.card, borderRadius: 15, padding: 11 },
  time: { ...ui.heading, color: colors.tealDark, flexShrink: 0 },
});
