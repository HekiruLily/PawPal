import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { TopBar } from '../components/TopBar';
import { IconButton } from '../components/IconButton';
import { FormField } from '../components/FormField';
import { ActionButton } from '../components/ActionButton';
import { DataState } from '../components/DataState';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';

export function ProfileScreen({ navigation }: { navigation: any }) {
  const data = useProfile();
  const auth = useAuth();
  const { showSuccess } = useToast();
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  useEffect(() => {
    if (data.profile) setDraft(data.profile);
  }, [data.profile]);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={ui.screen}>
      <TopBar
        title="Hồ sơ của tôi"
        right={
          <IconButton name="x" label="Đóng hồ sơ" onPress={navigation.goBack} />
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.content}
      >
        <View style={[ui.card, ui.row]}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>
              {(draft.name || auth.user?.name || '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={ui.grow}>
            <Text style={ui.heading}>{draft.name || auth.user?.name}</Text>
            <Text style={ui.meta}>{auth.user?.email}</Text>
          </View>
        </View>
        <DataState
          loading={data.loading}
          error={data.error}
          onRetry={data.retry}
        />
        <FormField
          label="Họ tên"
          value={draft.name}
          maxLength={60}
          editable={!data.busy && !!data.profile}
          onChangeText={name => setDraft(value => ({ ...value, name }))}
        />
        <FormField
          label="Số điện thoại"
          value={draft.phoneNumber}
          maxLength={20}
          keyboardType="phone-pad"
          editable={!data.busy && !!data.profile}
          onChangeText={phoneNumber =>
            setDraft(value => ({ ...value, phoneNumber }))
          }
        />
        <FormField
          label="Địa chỉ"
          value={draft.address}
          maxLength={160}
          editable={!data.busy && !!data.profile}
          onChangeText={address => setDraft(value => ({ ...value, address }))}
        />
        <ActionButton
          title="Lưu thay đổi"
          loading={data.busy}
          disabled={!data.profile}
          onPress={async () => {
            if (await data.save(draft)) showSuccess('Đã lưu hồ sơ.');
          }}
        />
        <ActionButton
          title="Xem giới thiệu"
          variant="secondary"
          onPress={() => navigation.navigate(ROUTES.INTRO)}
        />
        {auth.error ? <Text style={ui.error}>{auth.error}</Text> : null}
        <ActionButton
          title="Đăng xuất"
          variant="text"
          loading={auth.busy}
          disabled={data.busy}
          onPress={auth.logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 25,
    color: colors.tealDark,
    fontFamily: fonts.extraBold,
  },
});
