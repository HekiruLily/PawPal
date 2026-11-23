import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import {colors, spacing} from '../theme';

const ToastContext = createContext(null);

export function ToastProvider({children}) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'error') => {
    setToast({message, type});
    opacity.setValue(0);
    Animated.timing(opacity, {toValue: 1, duration: 180, useNativeDriver: true}).start();
    setTimeout(() => {
      Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}).start(() => setToast(null));
    }, 2600);
  }, [opacity]);
  const value = useMemo(() => ({
    busy,
    showError: (message: string) => showToast(message, 'error'),
    showSuccess: (message: string) => showToast(message, 'success'),
    setBusy,
  }), [busy, showToast]);
  return <ToastContext.Provider value={value}>
    {children}
    {toast ? <Animated.View pointerEvents="none" style={[
      styles.toast,
      toast.type === 'success' ? styles.success : styles.error,
      {opacity},
    ]}>
      <Text style={styles.toastText}>{toast.type === 'success' ? '✓  ' : '!  '}{toast.message}</Text>
    </Animated.View> : null}
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: 54,
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  success: {backgroundColor: '#246345'},
  error: {backgroundColor: colors.danger},
  toastText: {color: '#FFFFFF', fontWeight: '800', textAlign: 'center'},
});
