import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors} from '../theme';
import {getReportData} from '../api/managerApi';

type ReportAppointment = {
  aid?: number;
  status?: string;
  totalprice?: number;
  finishTime?: string;
  startTime?: string;
  serviceType?: {name?: string};
};

export function ReportsScreen() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [appointments, setAppointments] = useState<ReportAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    let active = true;
    getReportData(new Date().getFullYear())
      .then(result => { if (active) setAppointments(result.appointments); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const cutoff = period === '7' ? 7 : period === '30' ? 30 : null;
  const rows = appointments.filter(item => {
    if (!cutoff) return true;
    const date = item.finishTime ? new Date(item.finishTime) : item.startTime ? new Date(item.startTime) : null;
    if (!date || Number.isNaN(date.getTime())) return true;
    const age = (Date.now() - date.getTime()) / 86400000;
    return age >= 0 && age <= cutoff;
  });
  const statusCount = (status: string) => rows.filter(item => item.status?.toLowerCase() === status).length;
  const revenue = rows.reduce((sum, item) => sum + (item.status?.toLowerCase() === 'completed' ? Number(item.totalprice || 0) : 0), 0);
  const values = {
    total: rows.length,
    completed: statusCount('completed'),
    revenue,
    cancelled: statusCount('cancelled'),
  };
  const statusRows = [
    ['Chờ xác nhận', statusCount('pending')],
    ['Đã xác nhận', statusCount('confirmed')],
    ['Hoàn thành', statusCount('completed')],
    ['Đã hủy', statusCount('cancelled')],
    ['Từ chối', statusCount('rejected')],
    ['Hết hạn', statusCount('expired')],
  ];
  const serviceCount = new Map<string, number>();
  rows.forEach(item => {
    const name = item.serviceType?.name || 'Dịch vụ';
    serviceCount.set(name, (serviceCount.get(name) || 0) + 1);
  });
  const services = Array.from(serviceCount.entries()).sort((a, b) => b[1] - a[1]);
  const maxService = Math.max(1, ...services.map(([, count]) => count));
  const csvText = [
    'Tieu de,Gia tri',
    `Tong lich hen,${values.total}`,
    `Hoan thanh,${values.completed}`,
    `Doanh thu,${values.revenue}`,
    `Da huy,${values.cancelled}`,
    '',
    'Trang thai,So luong',
    ...statusRows.map(([label, value]) => `${label},${value}`),
    '',
    'Dich vu,So luong',
    ...services.map(([name, value]) => `${name},${value}`),
  ].join('\n');
  const exportCsv = async () => {
    try {
      await Share.share({
        title: 'Bao cao thong ke',
        message: csvText,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể chia sẻ báo cáo.');
    }
  };
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
      <Text style={styles.headerTitle}>Báo cáo</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator color={colors.button} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.chips}>
        {([['7', '7 ngày'], ['30', '30 ngày'], ['all', 'Tất cả']] as const).map(([value, label]) =>
          <TouchableOpacity key={value} style={[styles.chip, period === value && styles.chipActive]} onPress={() => setPeriod(value)}>
            <Text style={[styles.chipText, period === value && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>)}
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statLabel}>Tổng lịch hẹn</Text><Text style={styles.statValue}>{values.total}</Text></View>
        <View style={[styles.stat, styles.statHighlight]}><Text style={styles.statLabel}>Hoàn thành</Text><Text style={styles.statValue}>{values.completed}</Text></View>
        <View style={styles.stat}><Text style={styles.statLabel}>Doanh thu ghi nhận</Text><Text style={styles.statValue}>{values.revenue.toLocaleString('vi-VN')} đ</Text></View>
        <View style={[styles.stat, styles.statHighlight]}><Text style={styles.statLabel}>Đã hủy</Text><Text style={styles.statValue}>{values.cancelled}</Text></View>
      </View>
      <TouchableOpacity style={styles.exportButton} onPress={exportCsv}><Text style={styles.exportText}>↓  Chia sẻ báo cáo CSV</Text></TouchableOpacity>
      <Text style={styles.sectionTitle}>Phân bố trạng thái</Text>
      <View style={styles.card}>
        {statusRows.map(([label, value]) => <View style={styles.row} key={String(label)}>
          <Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text>
        </View>)}
      </View>
      <Text style={styles.sectionTitle}>Dịch vụ phổ biến</Text>
      <View style={styles.card}>
        {services.length ? services.map(([name, value]) => <View key={name}>
          <View style={styles.row}><Text style={styles.rowLabel}>{name}</Text><Text style={styles.rowValue}>{value}</Text></View>
          <View style={styles.progress}><View style={[styles.progressFill, {width: `${100 * value / maxService}%`}]} /></View>
        </View>) : <Text style={styles.rowLabel}>Chưa có dữ liệu trong kỳ này.</Text>}
      </View>
      <TouchableOpacity style={styles.preview} onPress={() => setPreviewVisible(true)}><Text style={styles.previewText}>▶ Xem trước nội dung CSV</Text></TouchableOpacity>
    </ScrollView>
    <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewModal}>
          <Text style={styles.previewTitle}>Nội dung CSV</Text>
          <ScrollView style={styles.previewScroll}>
            <Text selectable style={styles.previewCsv}>{csvText}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewVisible(false)}>
            <Text style={styles.previewCloseText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  error: {marginBottom: 10, color: colors.danger, fontWeight: '700'},
  header: {height: 104, paddingTop: 36, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12},
  headerTitle: {marginLeft: 10, color: colors.ink, fontSize: 24, fontWeight: '800'},
  back: {width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'},
  backText: {fontSize: 34, lineHeight: 36, color: colors.ink},
  content: {paddingHorizontal: 15, paddingBottom: 110},
  chips: {flexDirection: 'row', gap: 8, marginBottom: 12},
  chip: {height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'},
  chipActive: {backgroundColor: colors.button, borderColor: colors.button},
  chipText: {color: colors.ink, fontWeight: '800'},
  chipTextActive: {color: '#FFFFFF'},
  stats: {flexDirection: 'row', flexWrap: 'wrap', gap: 7},
  stat: {width: '48.5%', minHeight: 76, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF'},
  statHighlight: {backgroundColor: '#FFF6DC'},
  statLabel: {color: colors.muted, fontSize: 12},
  statValue: {marginTop: 4, color: colors.ink, fontSize: 17, fontWeight: '800'},
  exportButton: {height: 52, marginTop: 12, borderRadius: 13, backgroundColor: '#B94040', alignItems: 'center', justifyContent: 'center'},
  exportText: {color: '#FFFFFF', fontWeight: '800', fontSize: 16},
  sectionTitle: {marginTop: 16, marginBottom: 7, color: colors.ink, fontSize: 17, fontWeight: '800'},
  card: {padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF'},
  row: {minHeight: 43, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: '#EDF2F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  rowLabel: {color: colors.ink, fontSize: 14},
  rowValue: {color: colors.ink, fontWeight: '800'},
  progress: {height: 5, marginTop: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden'},
  progressFill: {height: '100%', backgroundColor: colors.teal},
  preview: {height: 44, marginTop: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', justifyContent: 'center'},
  previewText: {color: '#983D36', fontWeight: '800'},
  previewOverlay: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(56,40,29,0.28)'},
  previewModal: {width: '100%', maxHeight: '70%', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF'},
  previewTitle: {marginBottom: 10, color: colors.ink, fontSize: 18, fontWeight: '800'},
  previewScroll: {maxHeight: 420},
  previewCsv: {color: colors.ink, lineHeight: 22, fontFamily: 'monospace'},
  previewClose: {height: 44, marginTop: 10, borderRadius: 12, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center'},
  previewCloseText: {color: '#FFFFFF', fontWeight: '800'},
});
