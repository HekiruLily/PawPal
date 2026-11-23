import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

export function EmptyState({message = 'Chưa có dữ liệu'}) {
  return <View style={styles.empty}><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  empty: {padding: spacing.xl, alignItems: 'center'},
  text: {...typography.body, color: colors.muted},
});
