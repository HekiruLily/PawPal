import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../hooks/useNotifications';
import { TopBar } from '../components/TopBar';
import { IconButton } from '../components/IconButton';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { AppointmentDetails } from '../components/AppointmentDetails';
import { ui } from '../theme';
export function NotificationsScreen({ navigation }: { navigation: any }) {
  const data = useNotifications();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={ui.screen}>
      <TopBar
        title="Thông báo"
        right={
          <IconButton
            name="arrow-left"
            label="Quay lại trang chủ"
            onPress={navigation.goBack}
          />
        }
      />
      <FlatList
        data={data.data || []}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={ui.content}
        ListHeaderComponent={
          <View style={ui.stack}>
            <DataState
              loading={data.loading}
              error={data.error}
              onRetry={data.reload}
            />
            {data.actionError ? (
              <Text style={ui.error}>{data.actionError}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !data.loading && !data.error ? (
            <EmptyState
              title="Chưa có thông báo"
              message="Cập nhật lịch hẹn sẽ hiển thị tại đây."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => data.open(item)}
            style={ui.card}
          >
            <View style={ui.between}>
              <Text style={ui.heading}>
                {item.title || 'Cập nhật lịch hẹn'}
              </Text>
              {!item.readAt ? <Text style={ui.error}>Mới</Text> : null}
            </View>
            <Text style={ui.body}>{item.message}</Text>
          </Pressable>
        )}
      />
      <AppointmentDetails item={data.detail} onClose={data.close} />
    </SafeAreaView>
  );
}
