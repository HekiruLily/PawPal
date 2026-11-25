import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { managerApi } from '../api/managerApi';
import { useApiData } from '../hooks/useApiData';
import { TopBar } from '../components/TopBar';
import { SearchBar } from '../components/SearchBar';
import { IconButton } from '../components/IconButton';
import { DataState } from '../components/DataState';
import { EmptyState } from '../components/EmptyState';
import { searchText } from '../utils/validators';
import { ui } from '../theme';
export function ManageUsersScreen({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const data = useApiData(managerApi.listUsers);
  const rows = (data.data || []).filter(item =>
    searchText(
      `${item.name} ${item.username} ${item.email} ${item.phoneNumber}`,
    ).includes(searchText(query)),
  );
  return (
    <SafeAreaView edges={['top', 'bottom']} style={ui.screen}>
      <TopBar
        title="Khách hàng"
        manager
        right={
          <IconButton
            name="arrow-left"
            label="Quay lại tài khoản"
            onPress={navigation.goBack}
          />
        }
      />
      <FlatList
        data={rows}
        keyExtractor={item => String(item.uid)}
        contentContainerStyle={ui.content}
        ListHeaderComponent={
          <View style={ui.stack}>
            <SearchBar
              inset={false}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm tên, email hoặc số điện thoại"
            />
            <DataState
              loading={data.loading}
              error={data.error}
              onRetry={data.reload}
            />
          </View>
        }
        ListEmptyComponent={
          !data.loading && !data.error ? (
            <EmptyState message="Không tìm thấy khách hàng." />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={ui.card}>
            <Text style={ui.heading}>{item.name || item.username}</Text>
            <Text style={ui.meta}>{item.email || 'Chưa có email'}</Text>
            <Text style={ui.meta}>
              {item.phoneNumber || 'Chưa có số điện thoại'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
