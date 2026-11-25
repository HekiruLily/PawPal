import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

export function StatSummaryCard({label, value}: {label: string; value: React.ReactNode}) {
  return <View style={styles.card}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 112,
    padding: spacing.md,
    borderRadius: spacing.radius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  value: {...typography.title, color: colors.tealDark},
  label: {marginTop: spacing.sm, color: colors.muted},
});
