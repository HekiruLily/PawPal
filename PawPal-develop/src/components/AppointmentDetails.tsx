import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Appointment } from '../api/appointmentApi';
import {
  appointmentServices,
  dateLabel,
  effectiveStatus,
  timeLabel,
} from '../utils/appointments';
import { formatCurrency } from '../utils/currency';
import { ui } from '../theme';
import { BottomSheetModal } from './BottomSheetModal';
import { StatusPill } from './StatusPill';
import { ActionButton } from './ActionButton';

export function AppointmentSummary({ item }: { item: Appointment }) {
  const rows = [
    ['Thú cưng', item.petName],
    ['Dịch vụ', appointmentServices(item)],
    ['Ngày giờ', `${dateLabel(item.startTime)} · ${timeLabel(item.startTime)}`],
    ['Nhân viên', item.groomerName || 'Cửa hàng phân công'],
    ['Thời lượng', `${item.durationMinutes} phút`],
    ['Giảm giá', formatCurrency(item.discount || 0)],
    ['Tổng tiền', formatCurrency(item.totalPrice)],
  ];
  return (
    <View style={ui.stack}>
      <StatusPill status={effectiveStatus(item)} />
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}
export function AppointmentDetails({
  item,
  onClose,
  onEdit,
}: {
  item: Appointment | null;
  onClose: () => void;
  onEdit?: () => void;
}) {
  return (
    <BottomSheetModal
      visible={!!item}
      title={`Lịch ${item?.reference || `PP-${item?.aid}`}`}
      onClose={onClose}
    >
      {item ? <AppointmentSummary item={item} /> : null}
      {onEdit ? (
        <ActionButton
          title="Sửa lịch hẹn"
          variant="secondary"
          onPress={onEdit}
        />
      ) : null}
      <ActionButton title="Đóng" onPress={onClose} />
    </BottomSheetModal>
  );
}
const styles = StyleSheet.create({
  row: { ...ui.row, alignItems: 'flex-start' },
  label: { ...ui.meta, width: 88 },
  value: { ...ui.body, ...ui.grow, textAlign: 'right' },
});
