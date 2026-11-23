import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

export function TopBar({title, right}: {title: string; right?: React.ReactNode}) {
  return <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    {right}
  </View>;
}

const styles = StyleSheet.create({
  header: {
    minHeight: 94,
    paddingTop: 46,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {...typography.title, color: colors.ink},
});
