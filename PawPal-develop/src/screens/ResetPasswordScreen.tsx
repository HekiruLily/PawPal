import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/TopBar';
import { FormField } from '../components/FormField';
import { ActionButton } from '../components/ActionButton';
import { ui } from '../theme';

export function ResetPasswordScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  async function send() {
    if (await auth.resetPassword(email)) {
      setSent(true);
    }
  }
  return (
    <SafeAreaView style={ui.screen}>
      <TopBar title="Quên mật khẩu" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
      >
        <Text style={ui.body}>
          Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.
        </Text>
        <FormField
          label="Email"
          value={email}
          onChangeText={value => {
            setEmail(value);
            setSent(false);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {sent ? (
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            Nếu email có tài khoản, liên kết khôi phục đã được gửi. Hãy kiểm tra
            cả thư mục thư rác.
          </Text>
        ) : null}
        {auth.error ? (
          <View style={ui.errorBox}>
            <Text style={ui.error}>{auth.error}</Text>
          </View>
        ) : null}
        <ActionButton
          title="Gửi liên kết khôi phục"
          onPress={send}
          loading={auth.busy}
          disabled={!auth.configured || sent}
        />
        <ActionButton
          title="Quay lại đăng nhập"
          variant="secondary"
          onPress={navigation.goBack}
          disabled={auth.busy}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
