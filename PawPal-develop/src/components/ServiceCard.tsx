import React, { memo } from 'react';
import {
  Image,
  Pressable,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ServiceItem } from '../api/serviceApi';
import { formatCurrency, servicePrice } from '../utils/currency';
import { colors, spacing, ui } from '../theme';
import { ActionButton } from './ActionButton';
import { fonts } from '../theme/typography';

const photos: Record<string, ImageSourcePropType> = {
  Tắm: require('../../assets/images/bath.jpg'),
  'Cắt tỉa': require('../../assets/images/haircut.jpg'),
  Móng: require('../../assets/images/nails.jpg'),
  Tai: require('../../assets/images/ear.jpg'),
  Spa: require('../../assets/images/spa.jpg'),
  'Sức khỏe': require('../../assets/images/vet.jpg'),
  'Trọn gói': require('../../assets/images/bath.jpg'),
};
export const ServiceCard = memo(function ServiceCardView({
  item,
  manager,
  busy,
  onPress,
  actionTitle,
  children,
  detail,
  onDetail,
}: {
  actionTitle?: string;
  item: ServiceItem;
  manager?: boolean;
  busy?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  detail?: boolean;
  onDetail?: () => void;
}) {
  const source = item.imageURL
    ? { uri: item.imageURL }
    : photos[item.category] || photos['Tắm'];
  const price = servicePrice(item);
  if (manager) {
    return (
      <View style={styles.managerCard}>
        <View style={ui.row}>
          <Image
            source={source}
            accessibilityLabel={item.name}
            style={styles.managerPhoto}
          />
          <View style={ui.grow}>
            <Text style={styles.managerName}>{item.name}</Text>
            <View style={[styles.status, !item.active && styles.paused]}>
              <Text
                style={[styles.statusText, !item.active && styles.pausedText]}
              >
                {item.active ? 'Đang mở' : 'Tạm ngưng'}
              </Text>
            </View>
          </View>
          <ActionButton
            title="Sửa"
            accessibilityLabel={`Sửa thông tin ${item.name}`}
            size="small"
            variant="text"
            onPress={onPress}
            disabled={busy}
          />
        </View>
        {children}
      </View>
    );
  }
  return (
    <View style={[styles.card, detail && styles.detail]}>
      <Image
        source={source}
        accessibilityLabel={item.name}
        style={detail ? styles.detailImage : styles.image}
      />
      <View style={[styles.body, detail && styles.detailBody]}>
        {onDetail ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chi tiết ${item.name}`}
            onPress={onDetail}
          >
            <Text style={ui.heading}>{item.name}</Text>
          </Pressable>
        ) : (
          <Text style={ui.heading}>{item.name}</Text>
        )}
        <Text style={styles.description}>
          {item.description ||
            'Liên hệ cửa hàng để được tư vấn dịch vụ phù hợp.'}
        </Text>
        <View style={styles.end}>
          <Text style={styles.price}>
            {price.discount ? (
              <Text style={styles.originalPrice}>
                {formatCurrency(item.price)}
                {'\u00A0\u00A0'}
              </Text>
            ) : null}
            {formatCurrency(price.total)}{' '}
            <Text style={styles.duration}>· {item.duration} phút</Text>
          </Text>
          <ActionButton
            title={actionTitle || 'Đặt lịch'}
            accessibilityLabel={detail ? actionTitle : `Đặt ${item.name}`}
            onPress={onPress}
            size="small"
          />
        </View>
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
  },
  image: {
    height: 84,
    width: 84,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  body: { flex: 1, minWidth: 0 },
  detailBody: { flex: 0 },
  description: { ...ui.meta, fontSize: 13.5 },
  end: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  duration: { ...ui.meta, fontFamily: fonts.bold, fontSize: 13.5 },
  originalPrice: {
    fontFamily: fonts.regular,
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  detail: {
    flexDirection: 'column',
    padding: 0,
    borderWidth: 0,
    backgroundColor: colors.card,
  },
  detailImage: { height: 180, width: '100%', borderRadius: 16 },
  managerCard: {
    padding: 11,
    gap: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  managerPhoto: { width: 46, height: 46, borderRadius: 10 },
  managerName: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 4,
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.tealDark,
  },
  paused: { backgroundColor: colors.closedSurface },
  pausedText: { color: colors.closedText },
});
