import React, { useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { managerApi } from '../api/managerApi';
import { useApiData } from '../hooks/useApiData';
import { useToast } from '../context/ToastContext';
import { TopBar } from '../components/TopBar';
import { IconButton } from '../components/IconButton';
import { ActionButton } from '../components/ActionButton';
import { DataState } from '../components/DataState';
import {
  PeriodFilter,
  MetricGrid,
  HorizontalBars,
  ReportCharts,
} from '../components/ReportCharts';
import { formatCurrency } from '../utils/currency';
import { statusLabels } from '../utils/appointments';
import { reportCsv } from '../utils/reportCsv';
import { ui } from '../theme';

export function ReportsScreen({ navigation }: { navigation: any }) {
  const [period, setPeriod] = useState('7');
  const [preview, setPreview] = useState(false);
  const result = useApiData(() => managerApi.getReports(period), period);
  const { showError } = useToast();
  const data = result.data;
  const csv = data ? reportCsv(data.appointments) : '';
  return (
    <SafeAreaView edges={['top', 'bottom']} style={ui.screen}>
      <TopBar
        title="Báo cáo"
        manager
        right={
          <IconButton
            name="arrow-left"
            label="Quay lại tài khoản"
            onPress={navigation.goBack}
          />
        }
      />
      <ScrollView contentContainerStyle={ui.content}>
        <PeriodFilter value={period} onChange={setPeriod} />
        <Text style={ui.meta}>
          Thống kê theo ngày hẹn tại Việt Nam. Doanh thu chỉ tính lịch hoàn
          thành.
        </Text>
        <DataState
          loading={result.loading}
          error={result.error}
          onRetry={result.reload}
        />
        <MetricGrid
          items={[
            ['Tổng lịch hẹn', data?.totalAppointments ?? '—'],
            ['Hoàn thành', data?.statusCounts.completed ?? '—'],
            ['Doanh thu', data ? formatCurrency(data.revenue) : '—'],
            ['Đã hủy', data?.statusCounts.cancelled ?? '—'],
          ]}
        />
        <ActionButton
          title="Chia sẻ CSV"
          icon="download"
          disabled={!data || result.loading}
          onPress={async () => {
            try {
              await Share.share({
                title: 'PawPal · Báo cáo lịch hẹn.csv',
                message: csv,
              });
            } catch {
              showError('Không thể mở bảng chia sẻ. Vui lòng thử lại.');
            }
          }}
        />
        {data ? (
          <>
            <View style={ui.card}>
              <Text style={ui.heading}>Trạng thái lịch hẹn</Text>
              <HorizontalBars
                values={Object.entries(statusLabels).map(([key, label]) => [
                  label,
                  data.statusCounts[key] || 0,
                ])}
              />
            </View>
            <ReportCharts data={data} />
            <ActionButton
              title={preview ? 'Ẩn dữ liệu CSV' : 'Xem dữ liệu CSV'}
              variant="secondary"
              onPress={() => setPreview(!preview)}
            />
            {preview ? (
              <View style={ui.card}>
                <ScrollView horizontal>
                  <Text selectable style={ui.meta}>
                    {csv}
                  </Text>
                </ScrollView>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
