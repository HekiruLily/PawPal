import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, ui } from '../theme';
export function AuthHero() {
  return (
    <View style={styles.hero}>
      <Image
        source={require('../../assets/images/bath.jpg')}
        style={styles.image}
        accessibilityLabel="Chú chó golden được tắm"
      />
      <View style={styles.shade} />
      <View style={styles.copy}>
        <Text style={styles.title}>PawPal</Text>
        <Text style={styles.text}>
          Chăm sóc thú cưng, đặt lịch trong vài chạm
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: {
    height: 232,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(40,26,16,0.25)',
  },
  copy: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  title: { ...ui.title, fontSize: 34, lineHeight: 42, color: colors.on },
  text: { ...ui.body, color: colors.on, fontSize: 13 },
});
