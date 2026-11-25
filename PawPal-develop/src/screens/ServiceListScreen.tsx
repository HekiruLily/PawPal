import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useServices, ServiceItem } from '../hooks/useServices';
import { TopBar } from '../components/TopBar';
import { SearchBar } from '../components/SearchBar';
import { ChipFilterBar } from '../components/ChipFilterBar';
import { ServiceCard } from '../components/ServiceCard';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';
import { colors, ui } from '../theme';
import { ROUTES } from '../navigation/routes';

export function ServiceListScreen({ navigation }: { navigation: any }) {
  const data = useServices();
  const { error: authError } = useAuth();
  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const current = data.allItems.find(item => item.id === selected?.id);
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar title="Dịch vụ" />
      <FlatList
        data={data.items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {authError ? (
              <Text accessibilityRole="alert" style={ui.error}>
                {authError}
              </Text>
            ) : null}
            <SearchBar
              inset={false}
              value={data.query}
              onChangeText={data.setQuery}
              placeholder="Tìm dịch vụ, ví dụ: tắm, móng"
            />
            <ChipFilterBar
              inset={false}
              label="Lọc loại dịch vụ"
              options={data.categories}
              value={data.category}
              onChange={data.setCategory}
            />
            {data.error ? (
              <View style={ui.errorBox}>
                <Text style={ui.error}>{data.error}</Text>
                <ActionButton
                  title="Thử lại"
                  onPress={data.retry}
                  variant="secondary"
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          data.loading ? (
            <ActivityIndicator color={colors.button} style={ui.loader} />
          ) : !data.error ? (
            <EmptyState
              title="Không tìm thấy dịch vụ"
              message="Thử từ khóa khác hoặc chọn Tất cả."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View>
            <ServiceCard
              item={item}
              actionTitle="Đặt lịch"
              onDetail={() => setSelected(item)}
              onPress={() =>
                navigation.navigate(ROUTES.BOOKING, { serviceId: item.id })
              }
            />
          </View>
        )}
      />
      <BottomSheetModal
        visible={!!selected}
        title="Chi tiết dịch vụ"
        onClose={() => setSelected(null)}
      >
        {current ? (
          <ServiceCard
            item={current}
            detail
            actionTitle="Đóng chi tiết"
            onPress={() => setSelected(null)}
          />
        ) : (
          <EmptyState message="Dịch vụ này hiện đã tạm ngưng nhận lịch." />
        )}
        <Text style={ui.help}>
          Giá và thời lượng áp dụng cho lượt đặt mới. Lịch đã tạo giữ thông tin
          đã chốt.
        </Text>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { ...ui.content, paddingTop: 4, gap: 10 },
});
