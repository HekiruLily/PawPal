import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointments } from '../hooks/useAppointments';
import { useApiData } from '../hooks/useApiData';
import { groomerApi } from '../api/groomerApi';
import type { Appointment, AppointmentStatus } from '../api/appointmentApi';
import {
  appointmentServices,
  effectiveStatus,
  statusLabels,
  storeDate,
} from '../utils/appointments';
import { searchText } from '../utils/validators';
import { TopBar } from '../components/TopBar';
import { SearchBar } from '../components/SearchBar';
import { FormField } from '../components/FormField';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentDetails } from '../components/AppointmentDetails';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';
import { colors, ui } from '../theme';

export function ManageAppointmentsScreen({ route }: { route: any }) {
  const data = useAppointments(true);
  const staff = useApiData(groomerApi.list);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(
    route.params?.pending ? 'Chờ xác nhận' : 'Tất cả',
  );
  const [today, setToday] = useState(false);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [assigning, setAssigning] = useState<Appointment | null>(null);
  const [gid, setGid] = useState('');
  useEffect(() => {
    if (route.params?.pending !== undefined) {
      setFilter(route.params.pending ? 'Chờ xác nhận' : 'Tất cả');
      setToday(false);
    }
  }, [route.params]);
  const rows = data.items.filter(
    item =>
      (filter === 'Tất cả' || statusLabels[effectiveStatus(item)] === filter) &&
      (!today || item.startTime.slice(0, 10) === storeDate()) &&
      searchText(
        `${item.reference} ${item.petName} ${
          item.customerName
        } ${appointmentServices(item)}`,
      ).includes(searchText(query)),
  );
  function change(item: Appointment, status: AppointmentStatus) {
    Alert.alert(
      `${statusLabels[status]}?`,
      `Lịch ${item.reference || `PP-${item.aid}`} · ${item.petName}`,
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            data.status(item, status, item.groomerId);
          },
        },
      ],
    );
  }
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar title="Lịch hẹn" manager />
      <FlatList
        data={rows}
        keyExtractor={item => String(item.aid)}
        contentContainerStyle={ui.content}
        refreshing={data.loading}
        onRefresh={data.reload}
        ListHeaderComponent={
          <View style={ui.stack}>
            <SearchBar
              inset={false}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm mã lịch, khách hoặc thú cưng"
            />
            <FormField
              label="Trạng thái"
              value={filter}
              onChangeText={setFilter}
              options={['Tất cả', ...Object.values(statusLabels)]}
            />
            <View style={ui.between}>
              <Text style={ui.meta}>
                {data.data ? rows.length : '—'} lịch hẹn
              </Text>
              <View style={ui.row}>
                <Text style={ui.meta}>Hôm nay</Text>
                <Switch
                  value={today}
                  onValueChange={setToday}
                  trackColor={{ true: colors.button }}
                />
              </View>
            </View>
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
              title="Không có lịch phù hợp"
              message="Thử bộ lọc hoặc từ khóa khác."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const status = effectiveStatus(item);
          const future = Date.parse(item.startTime) > Date.now();
          const finished =
            Date.parse(item.startTime) + item.durationMinutes * 60000 <=
            Date.now();
          return (
            <View style={ui.stack}>
              <AppointmentCard
                item={item}
                manager
                onDetail={() => setDetail(item)}
              >
                <View style={ui.wrap}>
                  {status === 'pending' ? (
                    <>
                      <ActionButton
                        size="small"
                        title="Xác nhận"
                        disabled={data.busy}
                        onPress={() => change(item, 'confirmed')}
                      />
                      <ActionButton
                        size="small"
                        title="Từ chối"
                        variant="text"
                        disabled={data.busy}
                        onPress={() => change(item, 'rejected')}
                      />
                    </>
                  ) : null}
                  {status === 'confirmed' ? (
                    <>
                      <ActionButton
                        size="small"
                        title="Hủy lịch"
                        variant="text"
                        disabled={data.busy}
                        onPress={() => change(item, 'cancelled')}
                      />
                      {finished ? (
                        <ActionButton
                          size="small"
                          title="Hoàn thành"
                          disabled={data.busy}
                          onPress={() => change(item, 'completed')}
                        />
                      ) : null}
                    </>
                  ) : null}
                </View>
              </AppointmentCard>
              {future && ['pending', 'confirmed'].includes(status) ? (
                <ActionButton
                  title={`Phân công · ${item.groomerName || 'Chọn nhân viên'}`}
                  variant="secondary"
                  size="small"
                  disabled={data.busy}
                  onPress={() => {
                    setGid(String(item.groomerId || ''));
                    setAssigning(item);
                  }}
                />
              ) : null}
            </View>
          );
        }}
      />
      <AppointmentDetails
        item={data.items.find(item => item.aid === detail?.aid) || null}
        onClose={() => setDetail(null)}
      />
      <BottomSheetModal
        title="Phân công nhân viên"
        visible={!!assigning}
        busy={data.busy}
        onClose={() => setAssigning(null)}
      >
        <DataState
          loading={staff.loading}
          error={staff.error}
          onRetry={staff.reload}
        />
        {(staff.data || [])
          .filter(item => item.acceptingAppointments !== false)
          .map(item => (
            <ActionButton
              key={item.gid}
              title={`${gid === String(item.gid) ? '✓ ' : ''}${item.name} · ${
                item.title || 'Chăm sóc thú cưng'
              }`}
              variant={gid === String(item.gid) ? 'primary' : 'secondary'}
              onPress={() => setGid(String(item.gid))}
            />
          ))}
        <Text style={ui.help}>
          Nhân viên cần phù hợp chuyên môn và còn trống trong toàn bộ thời lượng
          lịch.
        </Text>
        {data.actionError ? (
          <Text style={ui.error}>{data.actionError}</Text>
        ) : null}
        <ActionButton
          title="Lưu phân công"
          loading={data.busy}
          disabled={!gid}
          onPress={async () => {
            if (assigning && (await data.assign(assigning, Number(gid))))
              setAssigning(null);
          }}
        />
        <ActionButton
          title="Đóng"
          variant="text"
          disabled={data.busy}
          onPress={() => setAssigning(null)}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}
