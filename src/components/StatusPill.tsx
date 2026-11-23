import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme';

const palette: Record<string, {background: string; color: string}> = {
  pending: {background: '#FFF3CD', color: '#806000'},
  confirmed: {background: colors.tealLight, color: colors.tealDark},
  completed: {background: colors.mint, color: '#28725A'},
  cancelled: {background: '#FDE7E4', color: colors.danger},
  rejected: {background: '#FDE7E4', color: colors.danger},
};

export function StatusPill({status}: {status: string}) {
  const style = palette[status?.toLowerCase()] || palette.pending;
  return <View style={[styles.pill, {backgroundColor: style.background}]}>
    <Text style={[styles.text, {color: style.color}]}>{status}</Text>
  </View>;
}

const styles = StyleSheet.create({
  pill: {alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5},
  text: {fontSize: 12, fontWeight: '800'},
});
