import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { usePets } from '../hooks/usePets';
import { useServices } from '../hooks/useServices';
import { useApiData } from '../hooks/useApiData';
import { useBooking } from '../hooks/useBooking';
import { useProfile } from '../hooks/useProfile';
import { useImageUpload } from '../hooks/useImageUpload';
import { groomerApi } from '../api/groomerApi';
import {
  dateLabel,
  storeDate,
  timeLabel,
  validBookingDate,
} from '../utils/appointments';
import { formatCurrency, servicePrice } from '../utils/currency';
import { TopBar } from '../components/TopBar';
import { IconButton } from '../components/IconButton';
import { ActionButton } from '../components/ActionButton';
import { FormField } from '../components/FormField';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { PetForm } from '../components/PetForm';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';
import { fonts } from '../theme/typography';

const stages = ['Thú cưng', 'Dịch vụ', 'Ngày giờ', 'Xác nhận'];
const titles = [
  'Đặt lịch cho bé nào?',
  'Bé cần dịch vụ gì?',
  'Chọn ngày và giờ',
  'Kiểm tra lịch hẹn',
];
export function BookingScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { user } = useAuth();
  const pets = usePets(user!.uid);
  const services = useServices();
  const staff = useApiData(groomerApi.listPublic);
  const profile = useProfile();
  const image = useImageUpload();
  const [step, setStep] = useState(0);
  const [petId, setPetId] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [groomerId, setGroomerId] = useState<number | undefined>();
  const [date, setDate] = useState(storeDate());
  const [editor, setEditor] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const edit = route.params?.edit;
  useEffect(() => {
    setStep(0);
    setSelectionError('');
    setPetId(edit?.firebasePetId || '');
    setIds(
      edit
        ? (edit.items || []).map(item => item.firebaseServiceId).filter(Boolean)
        : route.params?.serviceId
        ? [route.params.serviceId]
        : [],
    );
    setGroomerId(edit?.groomerId || route.params?.groomerId);
    setDate(edit?.startTime?.slice(0, 10) || storeDate());
  }, [route.params, edit]);
  const selected = services.allItems.filter(item => ids.includes(item.id));
  const pet = pets.items.find(item => item.id === petId);
  const booking = useBooking(
    pet?.id || '',
    selected,
    date,
    groomerId,
    step >= 2,
  );
  const duration =
    booking.quote?.durationMinutes ??
    selected.reduce((sum, item) => sum + item.duration, 0);
  const amount =
    booking.quote?.totalPrice ??
    selected.reduce((sum, item) => sum + servicePrice(item).total, 0);
  const chosenStaff = (staff.data || []).find(
    item => item.gid === (booking.slot?.groomerId || groomerId),
  );
  function toggle(id: string) {
    setSelectionError('');
    const next = ids.includes(id)
      ? ids.filter(value => value !== id)
      : [...ids, id];
    const items = services.allItems.filter(item => next.includes(item.id));
    if (
      items.some(item => item.category === 'Sức khỏe') &&
      items.some(item => item.category !== 'Sức khỏe')
    ) {
      setSelectionError(
        'Khám sức khỏe cần đặt riêng với các dịch vụ chăm sóc.',
      );
      return;
    }
    setIds(next);
  }
  const dateValid = validBookingDate(date);
  const canNext =
    step === 0
      ? !!pet
      : step === 1
      ? selected.length > 0
      : step === 2
      ? !!booking.slot && !!booking.quote && dateValid
      : !!booking.slot && !!profile.profile?.phoneNumber;
  return (
    <SafeAreaView edges={['top', 'bottom']} style={ui.screen}>
      <TopBar
        title={edit ? 'Sửa lịch hẹn' : 'Đặt lịch'}
        right={
          <IconButton
            name="x"
            label="Đóng đặt lịch"
            onPress={() => navigation.navigate(ROUTES.HOME)}
          />
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.progress}>
          {stages.map((stage, index) => (
            <View
              key={stage}
              style={[styles.bar, index <= step && styles.barOn]}
            />
          ))}
        </View>
        <Text style={styles.step}>
          Bước {step + 1}/4 · {stages[step]}
        </Text>
        <Text accessibilityRole="header" style={ui.title}>
          {titles[step]}
        </Text>
        {step === 0 ? (
          <>
            <Text style={ui.meta}>Chọn một hồ sơ thú cưng.</Text>
            <DataState
              loading={pets.loading}
              error={pets.error}
              onRetry={pets.retry}
            />
            {pets.items.map(item => (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: petId === item.id }}
                onPress={() => setPetId(item.id)}
                style={[styles.option, petId === item.id && styles.selected]}
              >
                <Image
                  source={
                    item.imageURL
                      ? { uri: item.imageURL }
                      : item.species === 'Mèo'
                      ? require('../../assets/images/ear.jpg')
                      : require('../../assets/images/golden.jpg')
                  }
                  style={styles.petPhoto}
                />
                <View style={ui.grow}>
                  <Text style={ui.heading}>{item.name}</Text>
                  <Text style={ui.meta}>
                    {item.species} · {item.age} tuổi · {item.size}
                  </Text>
                </View>
                <Feather
                  name={petId === item.id ? 'check-circle' : 'circle'}
                  size={22}
                  color={colors.tealDark}
                />
              </Pressable>
            ))}
            {!pets.loading && !pets.error && !pets.items.length ? (
              <EmptyState
                title="Chưa có thú cưng"
                message="Thêm hồ sơ để bắt đầu đặt lịch."
              />
            ) : null}
            {edit && !pet && !pets.loading ? (
              <Text style={ui.error}>
                Hồ sơ trong lịch này chưa được liên kết với tài khoản Firebase.
              </Text>
            ) : null}
            <ActionButton
              title="Thêm thú cưng"
              icon="plus"
              variant="secondary"
              onPress={() => setEditor(true)}
            />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Text style={ui.meta}>Bạn có thể chọn nhiều dịch vụ phù hợp.</Text>
            <DataState
              loading={services.loading}
              error={services.error}
              onRetry={services.retry}
            />
            {services.allItems.map(item => (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ids.includes(item.id) }}
                onPress={() => toggle(item.id)}
                style={[
                  styles.option,
                  ids.includes(item.id) && styles.selected,
                ]}
              >
                <Feather
                  name={ids.includes(item.id) ? 'check-square' : 'square'}
                  size={22}
                  color={colors.tealDark}
                />
                <View style={ui.grow}>
                  <Text style={ui.heading}>{item.name}</Text>
                  <Text style={ui.meta}>{item.description}</Text>
                  <Text style={styles.price}>
                    {formatCurrency(servicePrice(item).total)} · {item.duration}{' '}
                    phút
                  </Text>
                </View>
              </Pressable>
            ))}
            {!services.loading &&
            !services.error &&
            !services.allItems.length ? (
              <EmptyState message="Chưa có dịch vụ đang mở." />
            ) : null}
            {selectionError ? (
              <Text accessibilityRole="alert" style={ui.error}>
                {selectionError}
              </Text>
            ) : null}
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Text style={ui.meta}>Giờ cửa hàng: 08:00–18:00 · Việt Nam</Text>
            <FormField
              label="Nhân viên"
              value={
                groomerId
                  ? (staff.data || []).find(item => item.gid === groomerId)
                      ?.name || 'Nhân viên đã chọn'
                  : 'Bất kỳ nhân viên phù hợp'
              }
              options={[
                'Bất kỳ nhân viên phù hợp',
                ...(staff.data || []).map(
                  item => `${item.name} · #${item.gid}`,
                ),
              ]}
              onChangeText={value =>
                setGroomerId(
                  value.includes(' · #')
                    ? Number(value.split(' · #').pop())
                    : undefined,
                )
              }
            />
            <DataState
              loading={staff.loading}
              error={staff.error}
              onRetry={staff.reload}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.days}
            >
              {Array.from({ length: 5 }, (_, index) =>
                storeDate(new Date(Date.now() + index * 86400000)),
              ).map((value, index) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: date === value }}
                  onPress={() => setDate(value)}
                  style={[styles.day, date === value && styles.selected]}
                >
                  <Text style={ui.meta}>
                    {index === 0
                      ? 'Hôm nay'
                      : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][
                          new Date(`${value}T00:00:00Z`).getUTCDay()
                        ]}
                  </Text>
                  <Text style={ui.heading}>
                    {value.slice(8)}/{value.slice(5, 7)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <FormField
              label="Hoặc chọn ngày (năm-tháng-ngày)"
              value={date}
              onChangeText={setDate}
              placeholder="2026-12-01"
              maxLength={10}
              error={dateValid ? '' : 'Chọn ngày hợp lệ từ hôm nay trở đi.'}
            />
            {dateValid ? (
              <DataState
                loading={booking.loading}
                error={booking.error}
                onRetry={booking.retry}
              />
            ) : null}
            <Text style={ui.heading}>Giờ còn trống</Text>
            <View style={ui.wrap}>
              {(dateValid ? booking.slots : [])
                .filter(
                  (value, index, list) =>
                    list.findIndex(
                      entry => entry.startTime === value.startTime,
                    ) === index,
                )
                .map(value => (
                  <Pressable
                    key={value.startTime}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: booking.slot?.startTime === value.startTime,
                    }}
                    style={[
                      styles.time,
                      booking.slot?.startTime === value.startTime &&
                        styles.selected,
                    ]}
                    onPress={() => booking.setSlot(value)}
                  >
                    <Text style={styles.price}>
                      {timeLabel(value.startTime)}
                    </Text>
                  </Pressable>
                ))}
            </View>
            {dateValid &&
            !booking.loading &&
            !booking.error &&
            !booking.slots.length ? (
              <EmptyState
                title="Chưa có giờ trống"
                message="Thử ngày khác hoặc chọn nhân viên bất kỳ."
              />
            ) : null}
          </>
        ) : null}
        {step === 3 ? (
          <>
            <View style={ui.card}>
              {[
                ['Thú cưng', pet?.name],
                ['Dịch vụ', selected.map(item => item.name).join(' + ')],
                [
                  'Ngày giờ',
                  booking.slot
                    ? `${dateLabel(booking.slot.startTime)} · ${timeLabel(
                        booking.slot.startTime,
                      )}`
                    : 'Chọn lại giờ',
                ],
                ['Nhân viên', chosenStaff?.name || 'Nhân viên phù hợp'],
                ['Thời lượng', `${duration} phút`],
                ['Tạm tính', formatCurrency(booking.quote?.subtotal || 0)],
                ['Giảm giá', formatCurrency(booking.quote?.discount || 0)],
                ['Tổng tiền', formatCurrency(amount)],
              ].map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{label}</Text>
                  <Text style={styles.reviewValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={ui.card}>
              <Text style={ui.heading}>Thông tin liên hệ</Text>
              <Text style={ui.body}>{profile.profile?.name || user?.name}</Text>
              <Text style={ui.meta}>
                {profile.profile?.phoneNumber || 'Chưa có số điện thoại'}
              </Text>
              <Text style={ui.meta}>{user?.email}</Text>
              <ActionButton
                title="Cập nhật hồ sơ"
                variant="text"
                onPress={() => navigation.navigate(ROUTES.PROFILE)}
              />
            </View>
            <Text style={ui.help}>
              Cửa hàng sẽ xác nhận yêu cầu. Vui lòng kiểm tra thông tin và đến
              đúng giờ hẹn.
            </Text>
            {booking.error ? (
              <Text style={ui.error} accessibilityRole="alert">
                {booking.error}
              </Text>
            ) : null}
            {!booking.slot ? (
              <ActionButton
                title="Chọn lại giờ và kiểm tra giá"
                variant="secondary"
                onPress={() => {
                  setStep(2);
                  booking.retry();
                }}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <View style={ui.between}>
          <Text style={styles.total}>{formatCurrency(amount)}</Text>
          <Text style={ui.meta}>{duration} phút</Text>
        </View>
        <View style={ui.row}>
          <ActionButton
            title="Quay lại"
            variant="secondary"
            disabled={booking.busy}
            onPress={() =>
              step ? setStep(step - 1) : navigation.navigate(ROUTES.HOME)
            }
          />
          <View style={ui.grow}>
            <ActionButton
              title={
                step === 3
                  ? edit
                    ? 'Lưu thay đổi'
                    : 'Gửi yêu cầu'
                  : 'Tiếp tục'
              }
              loading={booking.busy}
              disabled={!canNext}
              onPress={async () => {
                if (step < 3) setStep(step + 1);
                else {
                  const result = await booking.submit(edit);
                  if (result)
                    navigation.navigate(ROUTES.BOOKING_SUCCESS, {
                      appointment: result,
                      edited: !!edit,
                    });
                }
              }}
            />
          </View>
        </View>
      </View>
      <BottomSheetModal
        title="Thêm thú cưng"
        visible={editor}
        busy={pets.busy || image.uploading}
        onClose={() => setEditor(false)}
      >
        {editor ? (
          <PetForm
            busy={pets.busy}
            error={pets.actionError}
            uploading={image.uploading}
            uploadError={image.error}
            onChooseImage={image.selectImage}
            onCancel={() => setEditor(false)}
            onSubmit={async draft => {
              if (await pets.save(draft)) setEditor(false);
            }}
          />
        ) : null}
      </BottomSheetModal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { ...ui.content, gap: 12 },
  progress: { ...ui.row, gap: 6 },
  bar: { flex: 1, height: 5, borderRadius: 4, backgroundColor: colors.line },
  barOn: { backgroundColor: colors.button },
  step: { ...ui.meta, fontSize: 12, fontFamily: fonts.bold },
  option: {
    ...ui.row,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    padding: 12,
    backgroundColor: colors.card,
  },
  selected: { borderColor: colors.tealDark, backgroundColor: colors.tealLight },
  petPhoto: { width: 54, height: 54, borderRadius: 12 },
  price: { ...ui.body, fontSize: 13, fontFamily: fonts.bold },
  days: { gap: 7 },
  day: {
    minWidth: 70,
    minHeight: 69,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 8,
    gap: 3,
  },
  time: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.nav,
  },
  total: { ...ui.heading, fontSize: 20, lineHeight: 25 },
  reviewRow: { ...ui.row, alignItems: 'flex-start' },
  reviewLabel: { ...ui.meta, width: 87 },
  reviewValue: { ...ui.body, flex: 1, textAlign: 'right' },
});
