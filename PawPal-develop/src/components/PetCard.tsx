import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import type { Pet } from '../api/petApi';
import { colors, sizes, ui } from '../theme';
import { ActionButton } from './ActionButton';
import { fonts } from '../theme/typography';

export const PetCard = memo(function PetCardView({
  item,
  disabled,
  onEdit,
  onDelete,
}: {
  item: Pet;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const source = item.imageURL
    ? { uri: item.imageURL }
    : item.species === 'Chó'
    ? require('../../assets/images/golden.jpg')
    : item.species === 'Mèo'
    ? require('../../assets/images/ear.jpg')
    : null;
  return (
    <View style={styles.card}>
      {source ? (
        <Image
          source={source}
          accessibilityLabel={`Ảnh ${item.name}`}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, ui.placeholder]}>
          <Feather name="heart" size={sizes.icon} color={colors.tealDark} />
        </View>
      )}
      <View style={ui.grow}>
        <Text style={ui.heading}>{item.name}</Text>
        <View style={styles.tags}>
          {[
            item.species,
            item.breed,
            `${item.age} tuổi`,
            item.size,
            item.gender,
          ]
            .filter(Boolean)
            .map((value, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{value}</Text>
              </View>
            ))}
        </View>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        <View style={styles.actions}>
          <ActionButton
            title="Sửa hồ sơ"
            accessibilityLabel={`Sửa hồ sơ ${item.name}`}
            variant="secondary"
            size="small"
            onPress={onEdit}
            disabled={disabled}
            icon="edit-2"
          />
          <ActionButton
            title="Xóa"
            accessibilityLabel={`Xóa hồ sơ ${item.name}`}
            variant="secondary"
            size="small"
            onPress={onDelete}
            disabled={disabled}
            icon="trash-2"
          />
        </View>
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  tagText: { fontFamily: fonts.bold, fontSize: 11, color: colors.muted },
  notes: { ...ui.meta, marginTop: 7 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
