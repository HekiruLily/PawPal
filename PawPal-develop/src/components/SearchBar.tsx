import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { colors, spacing, ui } from '../theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm',
  inset = true,
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      accessibilityLabel="Tìm dịch vụ"
      placeholderTextColor={colors.muted}
      style={[styles.input, !inset && styles.flush]}
      returnKeyType="search"
    />
  );
}

const styles = StyleSheet.create({
  flush: { marginHorizontal: 0, marginTop: 0 },
  input: {
    ...ui.body,
    marginHorizontal: spacing.lg,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    color: colors.ink,
  },
});
