import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { FormField } from '../components/FormField';
import { ActionButton } from '../components/ActionButton';
import { ui } from '../theme';

export function RegisterScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <SafeAreaView style={ui.screen}>
      <TopBar title="Tạo tài khoản" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
      >
        <Text style={ui.body}>
          Lưu hồ sơ bé cưng và theo dõi các dịch vụ chăm sóc trong cùng một tài
          khoản.
        </Text>
        <FormField
          label="Họ tên"
          value={name}
          onChangeText={setName}
          maxLength={60}
          autoComplete="name"
        />
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormField
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <FormField
          label="Nhập lại mật khẩu"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        {auth.error ? (
          <View style={ui.errorBox}>
            <Text accessibilityRole="alert" style={ui.error}>
              {auth.error}
            </Text>
          </View>
        ) : null}
        <ActionButton
          title="Tạo tài khoản"
          loading={auth.busy}
          disabled={!auth.configured}
          onPress={() => {
            auth.register(name, email, password, confirm);
          }}
        />
        <ActionButton
          title="Quay lại đăng nhập"
          variant="secondary"
          disabled={auth.busy}
          onPress={navigation.goBack}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
