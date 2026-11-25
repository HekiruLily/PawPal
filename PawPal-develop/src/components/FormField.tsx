import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, ui } from '../theme';

export function FormField({
  label,
  error,
  options,
  compact,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  options?: string[];
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={ui.field}>
      <Text style={[ui.label, compact && styles.compactLabel]}>{label}</Text>
      {options ? (
        <>
          <Pressable
            accessibilityRole="combobox"
            accessibilityLabel={label}
            accessibilityValue={{ text: props.value || '' }}
            accessibilityState={{
              expanded,
              disabled: props.editable === false,
            }}
            disabled={props.editable === false}
            onPress={() => setExpanded(value => !value)}
            style={[
              ui.input,
              styles.select,
              expanded && styles.focused,
              error && ui.inputError,
            ]}
          >
            <Text style={ui.body}>{props.value}</Text>
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.ink}
            />
          </Pressable>
          {expanded ? (
            <View style={styles.options}>
              {options.map(option => (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityLabel={option}
                  accessibilityState={{ checked: option === props.value }}
                  disabled={props.editable === false}
                  onPress={() => {
                    props.onChangeText?.(option);
                    setExpanded(false);
                  }}
                  style={styles.option}
                >
                  <Text style={ui.body}>{option}</Text>
                  {option === props.value ? (
                    <Feather name="check" size={18} color={colors.tealDark} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          {...props}
          onFocus={event => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[
            ui.input,
            props.multiline && ui.multiline,
            focused && styles.focused,
            error && ui.inputError,
            props.style,
          ]}
        />
      )}
      {error ? (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  focused: {
    borderColor: colors.teal,
    outlineColor: colors.teal,
    outlineWidth: 1,
    outlineStyle: 'solid',
  },
  compactLabel: { fontSize: 12, lineHeight: 18 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  options: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
