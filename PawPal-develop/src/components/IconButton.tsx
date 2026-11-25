import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../theme';
import { fonts } from '../theme/typography';
export function IconButton({
  name,
  label,
  onPress,
  badge,
}: {
  name: string;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Feather name={name} size={21} color={colors.ink} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.count}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  pressed: { backgroundColor: colors.surface },
  badge: {
    position: 'absolute',
    right: 1,
    top: 0,
    backgroundColor: colors.button,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: { fontSize: 10, color: colors.on, fontFamily: fonts.extraBold },
});
