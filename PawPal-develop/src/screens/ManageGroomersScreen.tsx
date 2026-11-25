import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroomers } from '../hooks/useGroomers';
import { useImageUpload } from '../hooks/useImageUpload';
import { useToast } from '../context/ToastContext';
import type { Groomer } from '../api/groomerApi';
import { TopBar } from '../components/TopBar';
import { ActionButton } from '../components/ActionButton';
import { SearchBar } from '../components/SearchBar';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { FormField } from '../components/FormField';
import { PhotoPicker } from '../components/PhotoPicker';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';
import { errorMessage } from '../utils/errors';
import { searchText } from '../utils/validators';

export function ManageGroomersScreen() {
  const data = useGroomers();
  const image = useImageUpload();
  const { showSuccess } = useToast();
  const [form, setForm] = useState<Partial<Groomer> | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  async function perform(task: () => Promise<unknown>, close = false) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await task();
      if (!live.current) return;
      if (close) setForm(null);
      showSuccess('Đã cập nhật nhân viên.');
    } catch (reason) {
      if (live.current) setError(errorMessage(reason));
    } finally {
      running.current = false;
      if (live.current) setBusy(false);
    }
  }
  function save() {
    if (!form) return;
    if (!form.name?.trim() || !form.gender?.trim()) {
      setError('Nhập tên và giới tính nhân viên.');
      return;
    }
    if (form.phoneNumber && !/^[+\d(). -]{7,20}$/.test(form.phoneNumber)) {
      setError('Số điện thoại không hợp lệ.');
      return;
    }
    if (
      !Number.isInteger(form.experienceYears) ||
      form.experienceYears! < 0 ||
      form.experienceYears! > 80
    ) {
      setError('Kinh nghiệm từ 0 đến 80 năm.');
      return;
    }
    const value = { ...form, name: form.name.trim() };
    perform(() => (value.gid ? data.update(value) : data.create(value)), true);
  }
  const change = (key: keyof Groomer, value: unknown) =>
    setForm(current => ({ ...current, [key]: value }));
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar
        title="Nhân viên"
        manager
        right={
          <ActionButton
            title="Thêm"
            icon="plus"
            size="small"
            disabled={busy}
            onPress={() => {
              setError('');
              setForm({
                name: '',
                gender: 'Nữ',
                rank: 1,
                title: '',
                experienceYears: 0,
                specialties: '',
                address: '',
                phoneNumber: '',
                imageURL: '',
                description: '',
                acceptingAppointments: true,
              });
            }}
          />
        }
      />
      <FlatList
        data={data.items.filter(item =>
          searchText(`${item.name} ${item.title} ${item.specialties}`).includes(
            searchText(query),
          ),
        )}
        keyExtractor={item => String(item.gid)}
        contentContainerStyle={ui.content}
        refreshing={data.loading}
        onRefresh={data.reload}
        ListHeaderComponent={
          <View style={ui.stack}>
            <Text style={ui.meta}>
              Tạm ngưng sẽ ẩn nhân viên khỏi lượt đặt mới. Các lịch đã phân công
              vẫn hiển thị.
            </Text>
            <SearchBar
              inset={false}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm tên hoặc chuyên môn"
            />
            <DataState
              loading={data.loading}
              error={data.error}
              onRetry={data.reload}
            />
            {error && !form ? (
              <Text style={ui.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !data.loading && !data.error ? (
            <EmptyState message="Không tìm thấy nhân viên." />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={ui.row}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>
                  {item.name
                    .split(' ')
                    .map(part => part[0])
                    .slice(-2)
                    .join('')}
                </Text>
              </View>
              <View style={ui.grow}>
                <Text style={ui.heading}>{item.name}</Text>
                <Text style={ui.meta}>
                  {item.title || 'Chăm sóc thú cưng'} ·{' '}
                  {item.experienceYears || 0} năm kinh nghiệm
                </Text>
                <View style={styles.tags}>
                  {(item.specialties || '')
                    .split(/[,;]+/)
                    .filter(Boolean)
                    .map(tag => (
                      <Text key={tag} style={styles.tag}>
                        {tag.trim()}
                      </Text>
                    ))}
                </View>
              </View>
            </View>
            <View style={ui.between}>
              <Text style={styles.status}>
                {item.acceptingAppointments !== false
                  ? 'Đang nhận lịch'
                  : 'Tạm ngưng'}
              </Text>
              <Text style={ui.meta}>
                {item.upcomingAppointmentCount || 0} lịch sắp tới
              </Text>
            </View>
            <ActionButton
              title={
                item.acceptingAppointments !== false
                  ? 'Tạm ngưng nhận lịch'
                  : 'Mở nhận lịch'
              }
              variant="secondary"
              size="small"
              disabled={busy}
              onPress={() =>
                perform(() =>
                  data.setAccepting(
                    item.gid,
                    item.acceptingAppointments === false,
                  ),
                )
              }
            />
            <View style={ui.row}>
              <View style={ui.grow}>
                <ActionButton
                  title="Sửa thông tin"
                  variant="text"
                  size="small"
                  disabled={busy}
                  onPress={() => {
                    setError('');
                    setForm({ ...item });
                  }}
                />
              </View>
              <ActionButton
                title="Xóa"
                variant="text"
                size="small"
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    'Xóa nhân viên?',
                    `Xóa ${item.name}? Nhân viên có lịch sử sẽ được giữ lại.`,
                    [
                      { text: 'Giữ lại', style: 'cancel' },
                      {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: () => perform(() => data.remove(item.gid)),
                      },
                    ],
                  )
                }
              />
            </View>
          </View>
        )}
      />
      <BottomSheetModal
        visible={!!form}
        title={form?.gid ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        busy={busy || image.uploading}
        onClose={() => setForm(null)}
      >
        {form ? (
          <View style={ui.stack}>
            <FormField
              label="Tên nhân viên"
              value={form.name}
              onChangeText={value => change('name', value)}
              maxLength={50}
              editable={!busy}
            />
            <FormField
              label="Giới tính"
              value={form.gender}
              options={['Nam', 'Nữ', 'Khác']}
              onChangeText={value => change('gender', value)}
              editable={!busy}
            />
            <FormField
              label="Chức danh"
              value={form.title || ''}
              onChangeText={value => change('title', value)}
              maxLength={50}
              editable={!busy}
            />
            <FormField
              label="Số năm kinh nghiệm"
              value={String(form.experienceYears ?? 0)}
              onChangeText={value => change('experienceYears', Number(value))}
              keyboardType="number-pad"
              editable={!busy}
            />
            <FormField
              label="Chuyên môn (ngăn cách bằng dấu phẩy)"
              value={form.specialties || ''}
              onChangeText={value => change('specialties', value)}
              maxLength={500}
              editable={!busy}
            />
            <FormField
              label="Hạng nhân viên"
              value={String(form.rank ?? 1)}
              onChangeText={value => change('rank', Number(value))}
              keyboardType="number-pad"
              editable={!busy}
            />
            <FormField
              label="Số điện thoại"
              value={form.phoneNumber || ''}
              onChangeText={value => change('phoneNumber', value)}
              keyboardType="phone-pad"
              maxLength={20}
              editable={!busy}
            />
            <FormField
              label="Địa chỉ"
              value={form.address || ''}
              onChangeText={value => change('address', value)}
              maxLength={160}
              editable={!busy}
            />
            <FormField
              label="Mô tả"
              value={form.description || ''}
              onChangeText={value => change('description', value)}
              multiline
              maxLength={255}
              editable={!busy}
            />
            <PhotoPicker
              imageURL={form.imageURL || ''}
              uploading={image.uploading}
              error={image.error}
              disabled={busy}
              onChoose={async () => {
                const url = await image.selectImage();
                if (url) change('imageURL', url);
              }}
            />
            {error ? (
              <Text style={ui.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <ActionButton
              title="Lưu nhân viên"
              loading={busy}
              disabled={image.uploading}
              onPress={save}
            />
            <ActionButton
              title="Hủy"
              variant="secondary"
              disabled={busy || image.uploading}
              onPress={() => setForm(null)}
            />
          </View>
        ) : null}
      </BottomSheetModal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  card: { ...ui.card, borderRadius: 15, padding: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...ui.heading, color: colors.tealDark },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  tag: {
    backgroundColor: colors.surface,
    borderRadius: 7,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    color: colors.ink,
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  status: {
    ...ui.meta,
    fontSize: 11,
    fontFamily: fonts.extraBold,
    color: colors.tealDark,
  },
});
