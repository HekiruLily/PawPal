import React from 'react';
import {StyleSheet, TextInput} from 'react-native';
import {colors, spacing} from '../theme';

export function SearchBar({value, onChangeText, placeholder = 'Tìm kiếm'}) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
    placeholderTextColor={colors.muted} style={styles.input} returnKeyType="search" />;
}

const styles = StyleSheet.create({
  input: {marginHorizontal: spacing.lg, marginTop: 10, marginBottom: spacing.md, paddingHorizontal: spacing.md,
    height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, color: colors.ink},
});
