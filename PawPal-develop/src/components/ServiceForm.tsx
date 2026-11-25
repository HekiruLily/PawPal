import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { ServiceItem, ServiceDraft } from '../api/serviceApi';
import { validateService, FieldErrors } from '../utils/validators';
import { colors, ui } from '../theme';
import { FormField } from './FormField';
import { ChipFilterBar } from './ChipFilterBar';
import { PhotoPicker } from './PhotoPicker';
import { ActionButton } from './ActionButton';
import { formatCurrency, servicePrice } from '../utils/currency';
import { fonts } from '../theme/typography';

export function ServiceForm({
  service,
  busy,
  error,
  uploading,
  uploadError,
  onChooseImage,
  onSubmit,
  pricingOnly = false,
  onToggle,
  onCancel,
  pendingAction,
}: {
  service?: ServiceItem;
  busy: boolean;
  error: string;
  uploading: boolean;
  uploadError: string;
  onChooseImage: () => Promise<string | undefined>;
  onSubmit: (draft: ServiceDraft) => void;
  pricingOnly?: boolean;
  onToggle?: () => void;
  onCancel?: () => void;
  pendingAction?: 'save' | 'toggle';
}) {
  const [draft, setDraft] = useState<ServiceDraft>(
    service
      ? {
          ...service,
          price: String(service.price),
          duration: String(service.duration),
        }
      : {
          name: '',
          category: 'Tắm',
          description: '',
          price: '',
          duration: '',
          imageURL: '',
          active: true,
        },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  function change(key: keyof ServiceDraft, value: string | boolean) {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: '' }));
  }
  async function choose() {
    const url = await onChooseImage();
    if (url) {
      change('imageURL', url);
    }
  }
  function submit() {
    const next = validateService(draft);
    setErrors(next);
    if (!Object.keys(next).length) {
      onSubmit(draft);
    }
  }
  if (pricingOnly && service) {
    const quote = servicePrice({ ...service, price: Number(draft.price) });
    return (
      <View style={styles.pricing}>
        <View style={styles.two}>
          <View style={ui.grow}>
            <FormField
              compact
              label="Giá niêm yết (₫)"
              accessibilityLabel={`Giá niêm yết ${service.name}`}
              value={draft.price}
              onChangeText={value => change('price', value)}
              keyboardType="number-pad"
              maxLength={9}
              editable={!busy}
              error={errors.price}
              style={styles.compactInput}
            />
          </View>
          <View style={ui.grow}>
            <FormField
              compact
              label="Thời lượng (phút)"
              accessibilityLabel={`Thời lượng ${service.name}`}
              value={draft.duration}
              onChangeText={value => change('duration', value)}
              keyboardType="number-pad"
              maxLength={3}
              editable={!busy}
              error={errors.duration}
              style={styles.compactInput}
            />
          </View>
        </View>
        {quote.discount && /^\d+$/.test(draft.price) ? (
          <Text style={styles.promo}>
            Giá ưu đãi hiện tại {formatCurrency(quote.total)}
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={ui.error}>
            {error}
          </Text>
        ) : null}
        <View style={styles.actions}>
          {onToggle ? (
            <ActionButton
              title={service.active ? 'Tạm ngưng' : 'Mở lại'}
              accessibilityLabel={`${service.active ? 'Tạm ngưng' : 'Mở lại'} ${
                service.name
              }`}
              variant="secondary"
              size="small"
              onPress={onToggle}
              disabled={busy}
              loading={busy && pendingAction === 'toggle'}
              style={styles.managerButton}
              textStyle={styles.managerButtonText}
            />
          ) : null}
          <ActionButton
            title="Lưu thay đổi"
            accessibilityLabel={`Lưu thay đổi ${service.name}`}
            size="small"
            onPress={submit}
            disabled={busy}
            loading={busy && pendingAction === 'save'}
            style={styles.managerButton}
            textStyle={styles.managerButtonText}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={ui.stack}>
      <PhotoPicker
        imageURL={draft.imageURL}
        onChoose={choose}
        uploading={uploading}
        disabled={busy}
        error={uploadError}
      />
      <FormField
        label="Tên dịch vụ *"
        value={draft.name}
        onChangeText={value => change('name', value)}
        maxLength={60}
        error={errors.name}
        editable={!busy}
        placeholder="Ví dụ: Tắm và sấy khô"
      />
      <Text style={ui.label}>Loại dịch vụ</Text>
      <ChipFilterBar
        label="Loại dịch vụ"
        options={[
          'Tắm',
          'Cắt tỉa',
          'Móng',
          'Tai',
          'Spa',
          'Sức khỏe',
          'Trọn gói',
        ]}
        value={draft.category}
        onChange={value => change('category', value)}
        disabled={busy}
      />
      <FormField
        label="Giá niêm yết (đồng) *"
        value={draft.price}
        onChangeText={value => change('price', value)}
        keyboardType="number-pad"
        maxLength={9}
        error={errors.price}
        editable={!busy}
        placeholder="Ví dụ: 180000"
      />
      <FormField
        label="Thời lượng (phút) *"
        value={draft.duration}
        onChangeText={value => change('duration', value)}
        keyboardType="number-pad"
        maxLength={3}
        error={errors.duration}
        editable={!busy}
        placeholder="Từ 5 đến 600"
      />
      <FormField
        label="Mô tả dịch vụ"
        value={draft.description}
        onChangeText={value => change('description', value)}
        multiline
        maxLength={500}
        error={errors.description}
        editable={!busy}
        placeholder="Các bước chăm sóc và điều cần lưu ý"
      />
      <View style={ui.between}>
        <View style={ui.grow}>
          <Text style={ui.label}>Đang nhận lịch</Text>
          <Text style={ui.meta}>
            Tạm ngưng sẽ ẩn dịch vụ khỏi lượt đặt mới.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Dịch vụ đang nhận lịch"
          value={draft.active}
          disabled={busy}
          onValueChange={value => change('active', value)}
          trackColor={{ false: colors.line, true: colors.tealLight }}
          thumbColor={draft.active ? colors.tealDark : colors.muted}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      ) : null}
      {onCancel ? (
        <ActionButton
          title="Hủy"
          variant="secondary"
          onPress={onCancel}
          disabled={busy || uploading}
        />
      ) : null}
      <ActionButton
        title={service ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
        onPress={submit}
        loading={busy}
        disabled={uploading}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  pricing: { gap: 7 },
  two: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  compactInput: {
    fontFamily: fonts.regular,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  managerButton: { paddingHorizontal: 9 },
  managerButtonText: { fontSize: 12, lineHeight: 18 },
  promo: { ...ui.meta, fontSize: 11, color: colors.tealDark },
});
