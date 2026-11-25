import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, ui } from '../theme';

export function EmptyState({
  message = 'Chưa có dữ liệu',
  title,
}: {
  message?: string;
  title?: string;
}) {
  return (
    <View style={styles.empty}>
      {title ? <Text style={ui.heading}>{title}</Text> : null}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 22,
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: spacing.radius,
    backgroundColor: colors.card,
  },
  text: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
