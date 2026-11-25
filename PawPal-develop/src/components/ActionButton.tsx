import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, sizes, spacing, typography, ui } from '../theme';
import { fonts } from '../theme/typography';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  icon?: string;
  size?: 'regular' | 'small';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};
export function ActionButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  icon,
  size = 'regular',
  accessibilityLabel,
  style,
  textStyle,
}: Props) {
  const textColor =
    variant === 'primary' || variant === 'danger' ? colors.on : colors.tealDark;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{
        disabled: !!disabled || !!loading,
        busy: !!loading,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === 'small' && styles.small,
        pressed && ui.pressed,
        (disabled || loading) && ui.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : icon ? (
        <Feather
          name={icon}
          color={textColor}
          size={size === 'small' ? 19 : 24}
        />
      ) : null}
      <Text
        style={[
          styles.textLabel,
          size === 'small' && styles.smallLabel,
          { color: textColor },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: {
    minHeight: sizes.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.smallRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: colors.button },
  secondary: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: { backgroundColor: colors.transparent, paddingHorizontal: spacing.sm },
  textLabel: {
    ...typography.body,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'center',
  },
  small: { minHeight: sizes.touch, paddingHorizontal: 14, paddingVertical: 8 },
  smallLabel: { fontSize: 14, lineHeight: 20 },
});
