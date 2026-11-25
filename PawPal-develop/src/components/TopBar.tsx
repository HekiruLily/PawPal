import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export function TopBar({
  title,
  right,
  manager = false,
}: {
  title: string;
  right?: React.ReactNode;
  manager?: boolean;
}) {
  return (
    <View style={[styles.header, manager && styles.manager]}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  manager: { backgroundColor: colors.nav },
  header: {
    minHeight: 64,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  title: { ...typography.title, color: colors.ink, flex: 1 },
});
