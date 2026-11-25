import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../components/ActionButton';
import { ROUTES } from '../navigation/routes';
import { colors, ui } from '../theme';
const slides = [
  {
    image: require('../../assets/images/golden.jpg'),
    title: 'Chăm sóc thú cưng như người thân',
    text: 'Tắm, cắt tỉa và chăm sóc sức khỏe, do đội ngũ nhân viên giàu kinh nghiệm thực hiện.',
  },
  {
    image: require('../../assets/images/vet.jpg'),
    title: 'Đội ngũ giàu kinh nghiệm và tận tâm',
    text: 'Groomer và bác sĩ thú y luôn sẵn sàng tư vấn cho bé của bạn.',
  },
  {
    image: require('../../assets/images/intro-spa.jpg'),
    title: 'Đặt lịch chỉ trong vài chạm',
    text: 'Chọn thú cưng, dịch vụ và giờ phù hợp. Theo dõi lịch hẹn ngay trên điện thoại.',
  },
];
export function OnboardingScreen({ navigation }: { navigation: any }) {
  const [index, setIndex] = useState(0);
  function finish() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace(ROUTES.LOGIN);
  }
  return (
    <SafeAreaView style={ui.screen}>
      <View style={styles.top}>
        <Text style={ui.heading}>PawPal</Text>
        <ActionButton
          title="Bỏ qua"
          variant="text"
          size="small"
          onPress={finish}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={slides[index].image}
          style={styles.photo}
          accessibilityLabel={slides[index].title}
        />
        <Text style={styles.title}>{slides[index].title}</Text>
        <Text style={styles.text}>{slides[index].text}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <View
          accessibilityLabel={`Trang ${index + 1} trên 3`}
          style={styles.dots}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.activeDot]}
            />
          ))}
        </View>
        <ActionButton
          title={index === 2 ? 'Bắt đầu' : 'Tiếp tục'}
          onPress={() => (index === 2 ? finish() : setIndex(index + 1))}
        />
        {index > 0 ? (
          <ActionButton
            title="Quay lại"
            variant="text"
            onPress={() => setIndex(index - 1)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  top: { ...ui.between, paddingHorizontal: 20, minHeight: 60 },
  content: {
    ...ui.content,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  photo: { width: '100%', aspectRatio: 1.25, maxHeight: 310, borderRadius: 28 },
  title: {
    ...ui.title,
    fontSize: 27,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 320,
  },
  text: { ...ui.body, textAlign: 'center', maxWidth: 320 },
  footer: { padding: 20, gap: 15 },
  dots: { ...ui.row, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  activeDot: { width: 23, backgroundColor: colors.button },
});
