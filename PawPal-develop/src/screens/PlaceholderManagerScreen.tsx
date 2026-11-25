import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {TopBar} from '../components/TopBar';
import {colors, spacing, typography} from '../theme';

export function PlaceholderManagerScreen({route}: {route?: {name?: string}}) {
  const title = route?.name === 'Appointments' ? 'Lịch hẹn' : 'Dịch vụ';
  return <SafeAreaView style={styles.screen}>
    <TopBar title={title} />
    <View style={styles.content}><Text style={styles.text}>Chưa triển khai trong phạm vi phần của bạn.</Text></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  content: {padding: spacing.lg},
  text: {...typography.body, color: colors.muted},
});
