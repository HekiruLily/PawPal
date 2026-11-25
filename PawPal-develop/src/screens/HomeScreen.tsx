import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../hooks/useServices';
import { useProfile } from '../hooks/useProfile';
import { useAppointments } from '../hooks/useAppointments';
import { useApiData } from '../hooks/useApiData';
import { groomerApi } from '../api/groomerApi';
import {
  effectiveStatus,
  dateLabel,
  timeLabel,
  appointmentServices,
} from '../utils/appointments';
import { formatCurrency, servicePrice } from '../utils/currency';
import { TopBar } from '../components/TopBar';
import { IconButton } from '../components/IconButton';
import { ActionButton } from '../components/ActionButton';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';

export function HomeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const profile = useProfile();
  const services = useServices();
  const appointments = useAppointments();
  const team = useApiData(groomerApi.listPublic);
  const name = (profile.profile?.name || user?.name || 'bạn')
    .trim()
    .split(' ')
    .pop();
  const next = appointments.items
    .filter(
      item =>
        ['pending', 'confirmed'].includes(effectiveStatus(item)) &&
        Date.parse(item.startTime) > Date.now(),
    )
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))[0];
  const favorites = ['Tắm', 'Cắt tỉa', 'Spa', 'Trọn gói']
    .map(category => services.allItems.find(item => item.category === category))
    .filter((item): item is NonNullable<typeof item> => !!item);
  const offer = services.allItems.find(item => servicePrice(item).discount > 0);
  const book = (serviceId?: string, groomerId?: number) =>
    navigation.navigate(ROUTES.BOOKING, { serviceId, groomerId });
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar
        title="PawPal"
        right={
          <View style={ui.row}>
            <IconButton
              name="bell"
              label="Thông báo lịch hẹn"
              onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
            />
            <IconButton
              name="user"
              label="Hồ sơ của tôi"
              onPress={() => navigation.navigate(ROUTES.PROFILE)}
            />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.copy}>
            <Text style={styles.greeting}>Chào {name}!</Text>
            <Text style={styles.headline}>Chăm sóc{'\n'}bé cưng</Text>
            <ActionButton
              title="Đặt lịch"
              size="small"
              onPress={() => book()}
            />
          </View>
          <Image
            style={styles.heroPhoto}
            source={require('../../assets/images/boarding.jpg')}
            accessibilityLabel="Bé cưng thư giãn trên chăn"
          />
        </View>
        <View style={styles.shortcuts}>
          {[
            ['plus', 'Đặt lịch', ROUTES.BOOKING],
            ['scissors', 'Dịch vụ', ROUTES.SERVICES],
            ['heart', 'Thú cưng', ROUTES.PETS],
            ['clock', 'Lịch sử', ROUTES.APPOINTMENTS],
          ].map(([icon, title, target], i) => (
            <Pressable
              key={target}
              accessibilityRole="button"
              accessibilityLabel={title}
              style={styles.shortcut}
              onPress={() =>
                navigation.navigate(
                  target,
                  target === ROUTES.APPOINTMENTS
                    ? { history: true, request: Date.now() }
                    : undefined,
                )
              }
            >
              <View style={[styles.shortIcon, i === 0 && styles.firstIcon]}>
                {icon === 'heart' ? (
                  <FontAwesome name="paw" size={17} color={colors.tealDark} />
                ) : (
                  <Feather name={icon} size={17} color={colors.tealDark} />
                )}
              </View>
              <Text style={styles.shortLabel}>{title}</Text>
            </Pressable>
          ))}
        </View>
        <View style={ui.between}>
          <Text style={ui.heading}>Lịch sắp tới</Text>
          <ActionButton
            size="small"
            variant="text"
            title="Xem lịch ›"
            onPress={() =>
              navigation.navigate(ROUTES.APPOINTMENTS, {
                history: false,
                request: Date.now(),
              })
            }
          />
        </View>
        <DataState
          loading={appointments.loading}
          error={appointments.error}
          onRetry={appointments.reload}
        />
        {next ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem lịch sắp tới"
            onPress={() =>
              navigation.navigate(ROUTES.APPOINTMENTS, {
                history: false,
                request: Date.now(),
              })
            }
            style={[ui.card, ui.row]}
          >
            <View style={styles.dayTile}>
              <Text style={styles.month}>
                {dateLabel(next.startTime).slice(3, 5)}
              </Text>
              <Text style={styles.day}>
                {dateLabel(next.startTime).slice(0, 2)}
              </Text>
            </View>
            <View style={ui.grow}>
              <Text style={ui.heading}>
                {next.petName} · {timeLabel(next.startTime)}
              </Text>
              <Text style={ui.meta}>{appointmentServices(next)}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.ink} />
          </Pressable>
        ) : !appointments.loading && !appointments.error ? (
          <EmptyState
            title="Chưa có lịch sắp tới"
            message="Lịch mới sẽ hiện tại đây."
          />
        ) : null}
        {offer ? (
          <View style={styles.offer}>
            <View style={ui.grow}>
              <Text style={styles.offerTag}>
                Ưu đãi · Đến{' '}
                {offer.promotionEnd?.split('-').reverse().slice(0, 2).join('/')}
              </Text>
              <Text style={ui.heading}>
                Giảm {offer.discountPercent}% {offer.name.toLowerCase()}
              </Text>
              <Text style={ui.meta}>
                {formatCurrency(servicePrice(offer).total)} · {offer.duration}{' '}
                phút
              </Text>
              <ActionButton
                title="Đặt ưu đãi"
                size="small"
                onPress={() => book(offer.id)}
              />
            </View>
            <Image
              source={require('../../assets/images/bath.jpg')}
              style={styles.offerPhoto}
            />
          </View>
        ) : null}
        <View style={ui.between}>
          <Text style={ui.heading}>Dịch vụ nổi bật</Text>
          <ActionButton
            size="small"
            variant="text"
            title="Tất cả ›"
            onPress={() => navigation.navigate(ROUTES.SERVICES)}
          />
        </View>
        <DataState
          loading={services.loading}
          error={services.error}
          onRetry={services.retry}
        />
        <View style={styles.grid}>
          {(favorites.length ? favorites : services.allItems.slice(0, 4)).map(
            item => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => book(item.id)}
                style={styles.service}
              >
                <Image
                  source={
                    item.imageURL
                      ? { uri: item.imageURL }
                      : item.category === 'Cắt tỉa'
                      ? require('../../assets/images/haircut.jpg')
                      : item.category === 'Spa'
                      ? require('../../assets/images/spa.jpg')
                      : require('../../assets/images/bath.jpg')
                  }
                  style={styles.servicePhoto}
                />
                <View style={styles.serviceCopy}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {formatCurrency(servicePrice(item).total)} · {item.duration}{' '}
                    phút
                  </Text>
                </View>
              </Pressable>
            ),
          )}
        </View>
        {!services.loading && !services.error && !services.allItems.length ? (
          <EmptyState message="Dịch vụ đang được cập nhật." />
        ) : null}
        <View style={ui.between}>
          <Text style={ui.heading}>Đội ngũ chăm sóc</Text>
        </View>
        <DataState
          loading={team.loading}
          error={team.error}
          onRetry={team.reload}
        />
        {(team.data || [])
          .filter(item => item.acceptingAppointments !== false)
          .map(item => (
            <View key={item.gid} style={[ui.card, ui.row, styles.person]}>
              <View style={styles.initial}>
                <Text style={styles.initialText}>{item.name.slice(0, 1)}</Text>
              </View>
              <View style={ui.grow}>
                <Text style={ui.heading}>{item.name}</Text>
                <Text style={ui.meta}>
                  {item.title || 'Chăm sóc thú cưng'} ·{' '}
                  {item.experienceYears || 0} năm
                </Text>
                <Text style={styles.serviceMeta}>{item.specialties}</Text>
              </View>
              <ActionButton
                title="Chọn"
                variant="secondary"
                size="small"
                onPress={() => book(undefined, item.gid)}
              />
            </View>
          ))}
        {!team.loading && !team.error && !team.data?.length ? (
          <EmptyState message="Chưa có nhân viên nhận lịch." />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { ...ui.content, paddingHorizontal: 17, paddingTop: 15, gap: 9 },
  hero: {
    minHeight: 218,
    backgroundColor: '#FFE28B',
    borderRadius: 23,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  copy: {
    flex: 1.04,
    paddingLeft: 16,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 10,
  },
  greeting: { fontSize: 12, color: '#422819', fontFamily: fonts.semibold },
  headline: {
    fontFamily: 'NotoSerifDisplay-Regular',
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.8,
    color: '#422819',
    marginBottom: 4,
  },
  heroPhoto: {
    flex: 0.96,
    margin: 10,
    marginLeft: 0,
    borderTopLeftRadius: 95,
    borderTopRightRadius: 95,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: 198,
  },
  shortcuts: {
    ...ui.row,
    marginTop: 2,
    gap: 5,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  shortcut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    gap: 4,
  },
  shortIcon: {
    width: 33,
    height: 32,
    backgroundColor: colors.surface,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstIcon: { backgroundColor: colors.tealLight },
  shortLabel: { fontSize: 11, color: colors.ink, fontFamily: fonts.semibold },
  dayTile: {
    backgroundColor: colors.surface,
    width: 48,
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: { ...ui.meta, fontSize: 10 },
  day: { ...ui.heading, fontSize: 23, lineHeight: 27 },
  offer: {
    ...ui.row,
    borderRadius: 17,
    backgroundColor: colors.surface,
    padding: 12,
    overflow: 'hidden',
  },
  offerTag: {
    ...ui.meta,
    color: colors.tealDark,
    fontSize: 11,
    marginBottom: 5,
  },
  offerPhoto: { width: '28%', height: 134, borderRadius: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  service: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  servicePhoto: { height: 76, width: '100%' },
  serviceCopy: { padding: 10, gap: 5 },
  serviceName: { ...ui.heading, fontSize: 13, lineHeight: 18 },
  serviceMeta: { ...ui.meta, fontSize: 11, lineHeight: 16 },
  person: { borderRadius: 15, padding: 11 },
  initial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: { ...ui.heading, color: colors.tealDark },
});
