import React, {useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useToast} from '../context/ToastContext';
import {colors, spacing, typography} from '../theme';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {login} = useAuth();
  const {showError, setBusy} = useToast();
  const submit = async () => {
    if (!username.trim() || !password) return showError('Vui lòng nhập tài khoản và mật khẩu.');
    setBusy(true);
    try { await login(username.trim(), password, 'manager'); }
    catch (error) { showError(error.message); }
    finally { setBusy(false); }
  };
  return <View style={styles.container}>
    <Text style={styles.brand}>PawPal</Text><Text style={styles.subtitle}>Nắng Mật Ong</Text>
    <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Tên đăng nhập" />
    <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry />
    <Button title="Đăng nhập" color={colors.teal} onPress={submit} />
  </View>;
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg},
  brand: {...typography.title, color: colors.tealDark, textAlign: 'center'}, subtitle: {textAlign: 'center', color: colors.muted, marginBottom: spacing.xl},
  input: {height: 50, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: spacing.md, marginBottom: spacing.md},
});
