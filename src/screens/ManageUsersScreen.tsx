import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {managerApi} from '../api/managerApi';
import {EmptyState} from '../components/EmptyState';
import {TopBar} from '../components/TopBar';
import {SearchBar} from '../components/SearchBar';
import {useToast} from '../context/ToastContext';
import {colors, spacing} from '../theme';

export function ManageUsersScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const {showError} = useToast();
  useEffect(() => {
    let active = true;
    (async () => { try { const result = await managerApi.listUsers(); if (active) setUsers(result); }
      catch (error) { showError(error.message); } finally { if (active) setLoading(false); } })();
    return () => { active = false; };
  }, [showError]);
  const search = async value => {
    setQuery(value);
    if (!value.trim()) return;
    try { setUsers(await managerApi.searchUsers(value)); } catch (error) { showError(error.message); }
  };
  const filtered = query.trim() ? users : users;
  return <SafeAreaView style={styles.screen}>
    <TopBar title="Khách hàng" />
    <SearchBar value={query} onChangeText={search} placeholder="Tìm tên tài khoản" />
    {loading ? <ActivityIndicator color={colors.teal} /> : <FlatList data={filtered} keyExtractor={item => String(item.uid)}
      ListEmptyComponent={<EmptyState message="Chưa có khách hàng." />} contentContainerStyle={styles.list}
      renderItem={({item}) => <View style={styles.card}><Text style={styles.name}>{item.username}</Text><Text style={styles.meta}>{item.email || 'Chưa có email'} · {item.phoneNumber || 'Chưa có số điện thoại'}</Text></View>} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  list: {padding: spacing.lg}, card: {padding: spacing.md, marginBottom: spacing.sm, borderRadius: 16, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1},
  name: {fontWeight: '800', color: colors.ink}, meta: {color: colors.muted, marginTop: 4, fontSize: 13},
});
