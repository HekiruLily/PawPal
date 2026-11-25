import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';

export function PetIntroBanner({ count }: { count: number }) {
  return (
    <View style={styles.banner}>
      <View style={styles.badge}>
        <FontAwesome name="paw" size={24} color={colors.tealDark} />
      </View>
      <View style={ui.grow}>
        <Text style={ui.heading}>Hồ sơ bé cưng</Text>
        <Text style={styles.description}>
          Lưu thông tin từng bé để đặt lịch và chăm sóc thuận tiện hơn.
        </Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{count} thú cưng của bạn</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 19,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { ...ui.meta, marginTop: 4 },
  count: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tealLight,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 8,
  },
  countText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: colors.tealDark,
  },
});
