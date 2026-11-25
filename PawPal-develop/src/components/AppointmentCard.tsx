import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Appointment } from '../api/appointmentApi';
import {
  appointmentServices,
  dateLabel,
  effectiveStatus,
  timeLabel,
} from '../utils/appointments';
import { formatCurrency } from '../utils/currency';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';
import { StatusPill } from './StatusPill';
import { ActionButton } from './ActionButton';

export function AppointmentCard({
  item,
  manager = false,
  onDetail,
  children,
}: {
  item: Appointment;
  manager?: boolean;
  onDetail: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={[ui.card, styles.card]}>
      <View style={ui.between}>
        <Text style={styles.date}>
          {dateLabel(item.startTime)} · {timeLabel(item.startTime)}
        </Text>
        <StatusPill status={effectiveStatus(item)} />
      </View>
      <View style={[ui.row, styles.main]}>
        <Image
          source={
            item.petImageURL
              ? { uri: item.petImageURL }
              : require('../../assets/images/golden.jpg')
          }
          style={manager ? styles.smallPhoto : ui.photo}
          accessibilityLabel={item.petName}
        />
        <View style={ui.grow}>
          <Text style={ui.heading}>
            {item.petName}
            {manager && item.customerName ? ` · ${item.customerName}` : ''}
          </Text>
          <Text style={ui.meta}>{appointmentServices(item)}</Text>
          <Text style={ui.meta}>
            {item.groomerName || 'Đang phân công'} ·{' '}
            {formatCurrency(item.totalPrice)}
          </Text>
          {manager ? (
            <Text style={styles.reference}>
              {item.reference || `PP-${item.aid}`} · {item.durationMinutes} phút
            </Text>
          ) : null}
        </View>
      </View>
      <View style={ui.row}>
        <ActionButton
          size="small"
          variant="secondary"
          title="Chi tiết"
          onPress={onDetail}
        />
        <View style={ui.grow}>{children}</View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, gap: 10 },
  date: {
    flex: 1,
    fontSize: 12,
    color: colors.ink,
    fontFamily: fonts.extraBold,
  },
  main: { alignItems: 'flex-start', gap: 11 },
  smallPhoto: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  reference: { ...ui.meta, fontSize: 11, marginTop: 3 },
});
