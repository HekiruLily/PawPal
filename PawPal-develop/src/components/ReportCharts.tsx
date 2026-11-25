import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReportData } from '../api/managerApi';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';
import { formatCurrency } from '../utils/currency';
import { ChipFilterBar } from './ChipFilterBar';
export function PeriodFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const labels = { '7': '7 ngày', '30': '30 ngày', all: 'Tất cả' };
  return (
    <ChipFilterBar
      label="Khoảng thời gian thống kê"
      inset={false}
      options={Object.values(labels)}
      value={labels[value]}
      onChange={label =>
        onChange(Object.keys(labels).find(key => labels[key] === label)!)
      }
    />
  );
}
export function MetricGrid({ items }: { items: [string, string | number][] }) {
  return (
    <View style={styles.grid}>
      {items.map(([label, value]) => (
        <View key={label} style={styles.metric}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}
export function HorizontalBars({ values }: { values: [string, number][] }) {
  const max = Math.max(1, ...values.map(([, value]) => value));
  return (
    <View style={styles.bars}>
      {values.map(([name, value]) => (
        <View key={name} style={styles.barRow}>
          <View style={ui.between}>
            <Text style={styles.label}>{name}</Text>
            <Text style={styles.count}>{value}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(value / max) * 100}%` }]} />
          </View>
        </View>
      ))}
      {!values.length ? (
        <Text style={ui.meta}>Chưa có dữ liệu trong khoảng này.</Text>
      ) : null}
    </View>
  );
}
export function ReportCharts({ data }: { data: ReportData }) {
  const max = Math.max(1, ...data.daily.map(day => day.appointments));
  return (
    <>
      <View style={styles.card}>
        <Text style={ui.heading}>Lịch hẹn theo ngày</Text>
        <Text style={ui.meta}>Lịch đang mở và đã hoàn thành</Text>
        <ScrollView horizontal contentContainerStyle={styles.daily}>
          {data.daily.map(day => (
            <View key={day.date} style={styles.column}>
              <Text style={styles.count}>{day.appointments}</Text>
              <View style={styles.verticalTrack}>
                <View
                  style={[
                    styles.verticalFill,
                    { height: `${(day.appointments / max) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.axis}>
                {day.date.slice(8)}/{day.date.slice(5, 7)}
              </Text>
            </View>
          ))}
        </ScrollView>
        {!data.daily.length ? (
          <Text style={ui.meta}>Chưa có lịch trong khoảng này.</Text>
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={ui.heading}>Doanh thu theo ngày</Text>
        {data.daily
          .filter(day => day.revenue > 0)
          .map(day => (
            <View style={ui.between} key={day.date}>
              <Text style={ui.meta}>
                {day.date.split('-').reverse().join('/')}
              </Text>
              <Text style={styles.count}>{formatCurrency(day.revenue)}</Text>
            </View>
          ))}
        {!data.daily.some(day => day.revenue > 0) ? (
          <Text style={ui.meta}>Chưa có doanh thu từ lịch hoàn thành.</Text>
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={ui.heading}>Dịch vụ phổ biến</Text>
        <HorizontalBars
          values={Object.entries(data.serviceCounts).sort(
            (a, b) => b[1] - a[1],
          )}
        />
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: {
    width: '48.5%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 12,
    gap: 7,
  },
  label: { ...ui.meta, fontSize: 11, flexShrink: 1 },
  value: { ...ui.heading, fontSize: 17 },
  card: { ...ui.card, borderRadius: 15, padding: 12 },
  count: { ...ui.body, fontSize: 12, fontFamily: fonts.extraBold },
  bars: { gap: 10 },
  barRow: { gap: 5 },
  track: {
    height: 7,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  fill: { height: 7, backgroundColor: colors.coral, borderRadius: 5 },
  daily: { gap: 10, paddingTop: 9 },
  column: { width: 35, gap: 5, alignItems: 'center' },
  verticalTrack: {
    height: 85,
    width: 19,
    borderRadius: 5,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalFill: {
    backgroundColor: colors.coral,
    width: '100%',
    borderRadius: 5,
  },
  axis: { ...ui.meta, fontSize: 9 },
});
