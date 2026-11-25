import React from 'react';
import { Image, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, sizes, ui } from '../theme';
import { ActionButton } from './ActionButton';

export function PhotoPicker({
  imageURL,
  onChoose,
  uploading,
  disabled,
  error,
}: {
  imageURL: string;
  onChoose: () => void;
  uploading: boolean;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <View style={ui.stack}>
      <View style={ui.row}>
        {imageURL ? (
          <Image
            accessibilityLabel="Ảnh đã chọn"
            source={{ uri: imageURL }}
            style={ui.photo}
          />
        ) : (
          <View style={[ui.photo, ui.placeholder]}>
            <Feather name="image" size={sizes.icon} color={colors.muted} />
          </View>
        )}
        <View style={ui.grow}>
          <ActionButton
            title={imageURL ? 'Đổi ảnh' : 'Chọn ảnh'}
            variant="secondary"
            onPress={onChoose}
            loading={uploading}
            disabled={disabled}
          />
          <Text style={ui.help}>Ảnh không bắt buộc · tối đa 5 MB</Text>
        </View>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
