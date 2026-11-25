import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointments } from '../hooks/useAppointments';
import type { Appointment } from '../api/appointmentApi';
import {
  canCancel,
  canEdit,
  effectiveStatus,
  statusLabels,
} from '../utils/appointments';
import { TopBar } from '../components/TopBar';
import { ChipFilterBar } from '../components/ChipFilterBar';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentDetails } from '../components/AppointmentDetails';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';
import { ROUTES } from '../navigation/routes';
import { ui } from '../theme';

export function AppointmentListScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const data = useAppointments();
  const [tab, setTab] = useState('Sắp tới');
  const [filter, setFilter] = useState('Tất cả');
  const [detail, setDetail] = useState<Appointment | null>(null);
  useEffect(() => {
    if (route.params?.history !== undefined) {
      setTab(route.params.history ? 'Lịch sử' : 'Sắp tới');
      setFilter('Tất cả');
    }
  }, [route.params]);
  const options =
    tab === 'Sắp tới'
      ? ['Tất cả', 'Chờ xác nhận', 'Đã xác nhận']
      : ['Tất cả', 'Hoàn thành', 'Đã hủy', 'Từ chối', 'Hết hạn'];
  const rows = data.items
    .filter(item => {
      const status = effectiveStatus(item);
      const future =
        ['pending', 'confirmed'].includes(status) &&
        Date.parse(item.startTime) > Date.now();
      return (
        (tab === 'Sắp tới' ? future : !future) &&
        (filter === 'Tất cả' || statusLabels[status] === filter)
      );
    })
    .sort((a, b) =>
      tab === 'Sắp tới'
        ? Date.parse(a.startTime) - Date.parse(b.startTime)
        : Date.parse(b.startTime) - Date.parse(a.startTime),
    );
  function cancel(item: Appointment) {
    Alert.alert(
      'Hủy lịch hẹn?',
      `${item.petName} · Lịch đã hủy sẽ không giữ khung giờ.`,
      [
        { text: 'Giữ lịch', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: () => {
            data.cancel(item);
          },
        },
      ],
    );
  }
  const currentDetail =
    data.items.find(item => item.aid === detail?.aid) || null;
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar title="Lịch hẹn của tôi" />
      <FlatList
        data={rows}
        keyExtractor={item => String(item.aid)}
        contentContainerStyle={ui.content}
        refreshing={data.loading}
        onRefresh={data.reload}
        ListHeaderComponent={
          <View style={ui.stack}>
            <ChipFilterBar
              label="Nhóm lịch hẹn"
              inset={false}
              options={['Sắp tới', 'Lịch sử']}
              value={tab}
              onChange={value => {
                setTab(value);
                setFilter('Tất cả');
              }}
            />
            <ChipFilterBar
              label="Trạng thái lịch hẹn"
              inset={false}
              options={options}
              value={filter}
              onChange={setFilter}
            />
            <DataState
              loading={data.loading}
              error={data.error}
              onRetry={data.reload}
            />
            {data.actionError ? (
              <Text style={ui.error} accessibilityRole="alert">
                {data.actionError}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !data.loading && !data.error ? (
            <EmptyState
              title="Chưa có lịch hẹn"
              message={
                tab === 'Sắp tới'
                  ? 'Đặt lịch chăm sóc để lịch mới hiển thị tại đây.'
                  : 'Các lịch đã kết thúc sẽ được lưu tại đây.'
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <AppointmentCard item={item} onDetail={() => setDetail(item)}>
            {canCancel(item) ? (
              <ActionButton
                title="Hủy lịch"
                size="small"
                variant="text"
                disabled={data.busy}
                onPress={() => cancel(item)}
              />
            ) : null}
          </AppointmentCard>
        )}
      />
      <AppointmentDetails
        item={currentDetail}
        onClose={() => setDetail(null)}
        onEdit={
          currentDetail && canEdit(currentDetail)
            ? () => {
                setDetail(null);
                navigation.navigate(ROUTES.BOOKING, { edit: currentDetail });
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
