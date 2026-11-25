import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, sizes, ui } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function BottomSheetModal({
  visible,
  title,
  onClose,
  busy = false,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [present, setPresent] = useState(visible);
  const [panelHeight, setPanelHeight] = useState(0);
  const { height } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;
  const scrim = useRef(new Animated.Value(0)).current;
  const content = useRef({ title, children });
  if (visible) content.current = { title, children };
  useEffect(() => {
    if (visible && !present) {
      setPresent(true);
      return;
    }
    if (!present) return;
    const animation = Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 1 : 0,
        duration: reduced ? 0 : 280,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scrim, {
        toValue: visible ? 1 : 0,
        duration: reduced ? 0 : 220,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished && !visible) setPresent(false);
    });
    return () => animation.stop();
  }, [visible, present, reduced, slide, scrim]);
  function close() {
    if (!busy) onClose();
  }
  return (
    <Modal
      visible={present}
      transparent
      animationType="none"
      statusBarTranslucent={false}
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.scrim, { opacity: scrim }]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Đóng hộp thoại"
          disabled={busy || !visible}
          onPress={close}
        />
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [(panelHeight || height) * 1.02, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView edges={['bottom']} style={styles.shrink}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text
                accessibilityRole="header"
                style={[ui.heading, styles.title, ui.grow]}
              >
                {content.current.title}
              </Text>
            </View>
            <ScrollView
              style={styles.shrink}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.body}
            >
              {content.current.children}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 20, lineHeight: 26 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  shrink: { flexShrink: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  panel: {
    maxHeight: '88%',
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
    width: '100%',
    maxWidth: sizes.pageMax,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
  },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 34, gap: 14 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 9,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
});
