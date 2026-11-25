import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { colors, ui } from '../theme';

export function DataState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading)
    return (
      <ActivityIndicator
        style={ui.loader}
        color={colors.button}
        accessibilityLabel="Đang tải dữ liệu"
      />
    );
  if (!error) return null;
  return (
    <View style={ui.errorBox}>
      <Text accessibilityRole="alert" style={ui.error}>
        {error}
      </Text>
      <ActionButton
        title="Thử lại"
        variant="secondary"
        size="small"
        onPress={onRetry}
      />
    </View>
  );
}
