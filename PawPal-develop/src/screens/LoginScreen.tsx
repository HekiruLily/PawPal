import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { FormField } from '../components/FormField';
import { ActionButton } from '../components/ActionButton';
import { AuthHero } from '../components/AuthHero';
import { ROUTES } from '../navigation/routes';
import { ui } from '../theme';

export function LoginScreen({
  navigation,
}: {
  navigation: { navigate: (name: string) => void };
}) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  return (
    <SafeAreaView style={ui.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
      >
        <AuthHero />
        <View style={ui.card}>
          <Text accessibilityRole="header" style={ui.title}>
            Đăng nhập
          </Text>
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
            secureTextEntry={!showPassword}
            autoComplete="current-password"
          />
          <ActionButton
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            variant="text"
            size="small"
            onPress={() => setShowPassword(!showPassword)}
          />
          {auth.error ? (
            <View style={ui.errorBox}>
              <Text accessibilityRole="alert" style={ui.error}>
                {auth.error}
              </Text>
            </View>
          ) : null}
          <ActionButton
            title="Đăng nhập"
            loading={auth.busy}
            disabled={!auth.configured}
            onPress={() => {
              auth.login(email, password);
            }}
          />
        </View>
        <ActionButton
          title="Quên mật khẩu?"
          variant="text"
          disabled={auth.busy}
          onPress={() => navigation.navigate(ROUTES.RESET_PASSWORD)}
        />
        <ActionButton
          title="Tạo tài khoản mới"
          variant="secondary"
          disabled={auth.busy}
          onPress={() => navigation.navigate(ROUTES.REGISTER)}
        />
        <ActionButton
          title="Xem giới thiệu"
          variant="text"
          onPress={() => navigation.navigate(ROUTES.INTRO)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
