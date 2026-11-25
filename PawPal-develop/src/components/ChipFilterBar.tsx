import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ui } from '../theme';

export function ChipFilterBar({
  options,
  value,
  onChange,
  label,
  disabled = false,
  inset = true,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  inset?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[ui.filterRow, !inset && styles.flush]}
      accessibilityLabel={label}
    >
      {options.map(option => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityLabel={option}
          accessibilityState={{ selected: option === value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option)}
          style={({ pressed }) => [
            ui.chip,
            option === value && ui.chipSelected,
            pressed && ui.pressed,
          ]}
        >
          <Text style={[ui.chipText, option === value && ui.chipTextSelected]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({ flush: { paddingHorizontal: 0 } });
