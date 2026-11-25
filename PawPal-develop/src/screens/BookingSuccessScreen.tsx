import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { AppointmentSummary } from '../components/AppointmentDetails';
import { ActionButton } from '../components/ActionButton';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';

export function BookingSuccessScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const item = route.params?.appointment;
  const edited = route.params?.edited;
  return (
    <SafeAreaView style={ui.screen}>
      <ScrollView contentContainerStyle={ui.content}>
        <View style={styles.check}>
          <Feather name="check" size={36} color={colors.success} />
        </View>
        <Text style={styles.title}>
          {edited ? 'Đã cập nhật lịch' : 'Đã gửi yêu cầu'}
        </Text>
        <Text style={styles.note}>
          {item?.reference || `PP-${item?.aid}`}
          {'\n'}Cửa hàng sẽ xác nhận lịch hẹn của bạn.
        </Text>
        {item ? (
          <View style={ui.card}>
            <AppointmentSummary item={item} />
          </View>
        ) : null}
        <ActionButton
          title="Xem lịch hẹn của tôi"
          onPress={() =>
            navigation.replace(ROUTES.CUSTOMER, { screen: ROUTES.APPOINTMENTS })
          }
        />
        <ActionButton
          title="Đặt lịch khác"
          variant="secondary"
          onPress={() =>
            navigation.replace(ROUTES.CUSTOMER, {
              screen: ROUTES.BOOKING,
              params: { reset: Date.now() },
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  check: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#DFF5EB',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  title: { ...ui.title, alignSelf: 'center', marginTop: 8 },
  note: { ...ui.meta, textAlign: 'center' },
});
