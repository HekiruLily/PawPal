import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

export function SectionHeader({title, actionText, onAction}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {actionText ? <TouchableOpacity onPress={onAction}><Text style={styles.action}>{actionText}</Text></TouchableOpacity> : null}
  </View>;
}

const styles = StyleSheet.create({
  row: {paddingHorizontal: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title: {...typography.heading, color: colors.ink},
  action: {color: colors.teal, fontWeight: '700'},
});
