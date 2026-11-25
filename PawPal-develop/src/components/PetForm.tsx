import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Pet, PetDraft } from '../api/petApi';
import { validatePet, FieldErrors } from '../utils/validators';
import { ui } from '../theme';
import { FormField } from './FormField';
import { PhotoPicker } from './PhotoPicker';
import { ActionButton } from './ActionButton';

export function PetForm({
  pet,
  busy,
  error,
  uploading,
  uploadError,
  onChooseImage,
  onSubmit,
  onCancel,
}: {
  pet?: Pet;
  busy: boolean;
  error: string;
  uploading: boolean;
  uploadError: string;
  onChooseImage: () => Promise<string | undefined>;
  onSubmit: (draft: PetDraft) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<PetDraft>(
    pet
      ? { ...pet, age: String(pet.age) }
      : {
          name: '',
          species: 'Chó',
          breed: '',
          age: '',
          size: 'Vừa',
          gender: 'Cái',
          notes: '',
          imageURL: '',
        },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPhoto, setShowPhoto] = useState(!!pet?.imageURL);
  function change(key: keyof PetDraft, value: string) {
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
    const next = validatePet(draft);
    setErrors(next);
    if (!Object.keys(next).length) {
      onSubmit(draft);
    }
  }
  return (
    <View style={styles.form}>
      <FormField
        label="Tên thú cưng"
        value={draft.name}
        onChangeText={value => change('name', value)}
        maxLength={40}
        editable={!busy}
        error={errors.name}
        placeholder="Ví dụ: Bơ"
      />
      <View style={styles.two}>
        <View style={ui.grow}>
          <FormField
            label="Loài"
            options={['Chó', 'Mèo', 'Khác']}
            value={draft.species}
            onChangeText={value => change('species', value)}
            editable={!busy}
          />
        </View>
        <View style={ui.grow}>
          <FormField
            label="Tuổi"
            value={draft.age}
            onChangeText={value => change('age', value)}
            keyboardType="number-pad"
            editable={!busy}
            error={errors.age}
            placeholder="Từ 0 đến 30"
            maxLength={2}
          />
        </View>
      </View>
      <FormField
        label="Giống (không bắt buộc)"
        value={draft.breed}
        onChangeText={value => change('breed', value)}
        maxLength={40}
        editable={!busy}
        error={errors.breed}
        placeholder="Ví dụ: Golden Retriever"
      />
      <View style={styles.two}>
        <View style={ui.grow}>
          <FormField
            label="Kích cỡ"
            options={['Nhỏ', 'Vừa', 'Lớn']}
            value={draft.size}
            onChangeText={value => change('size', value)}
            editable={!busy}
          />
        </View>
        <View style={ui.grow}>
          <FormField
            label="Giới tính"
            options={['Cái', 'Đực', 'Không rõ']}
            value={draft.gender}
            onChangeText={value => change('gender', value)}
            editable={!busy}
          />
        </View>
      </View>
      <FormField
        label="Ghi chú chăm sóc"
        value={draft.notes}
        onChangeText={value => change('notes', value)}
        maxLength={300}
        multiline
        editable={!busy}
        error={errors.notes}
        placeholder="Điều cần lưu ý khi chăm sóc bé"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showPhoto }}
        onPress={() => setShowPhoto(value => !value)}
        disabled={busy || uploading}
        style={styles.photoToggle}
      >
        <Text style={ui.meta}>
          {showPhoto ? 'Ẩn tùy chọn ảnh' : 'Thêm ảnh hồ sơ (không bắt buộc)'}
        </Text>
      </Pressable>
      {showPhoto ? (
        <PhotoPicker
          imageURL={draft.imageURL}
          onChoose={choose}
          uploading={uploading}
          disabled={busy}
          error={uploadError}
        />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      ) : null}
      <View style={styles.two}>
        {onCancel ? (
          <ActionButton
            title="Hủy"
            variant="secondary"
            onPress={onCancel}
            disabled={busy || uploading}
            style={ui.grow}
          />
        ) : null}
        <ActionButton
          title={pet ? 'Lưu' : 'Thêm'}
          onPress={submit}
          loading={busy}
          disabled={uploading}
          style={ui.grow}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  form: { gap: 14 },
  two: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  photoToggle: { minHeight: 44, justifyContent: 'center' },
});
