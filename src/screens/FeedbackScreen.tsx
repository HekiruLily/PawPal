import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Button, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';
import {managerApi} from '../api/managerApi';
import {EmptyState} from '../components/EmptyState';
import {TopBar} from '../components/TopBar';
import {useToast} from '../context/ToastContext';
import {colors, spacing} from '../theme';

export function FeedbackScreen() {
  const [items, setItems] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const {showError, setBusy} = useToast();
  useEffect(() => {
    let active = true;
    managerApi.listFeedback().then(value => { if (active) setItems(value); })
      .catch(error => showError(error.message)).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showError]);
  const reply = async item => {
    const value = replies[item.id]?.trim();
    if (!value) return showError('Vui lòng nhập nội dung phản hồi.');
    setBusy(true);
    try { await managerApi.replyFeedback(item.id, value); setItems(current => current.filter(row => row.id !== item.id)); }
    catch (error) { showError(error.message); } finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.screen}>
    <TopBar title="Phản hồi bình luận" />
    {loading ? <ActivityIndicator color={colors.teal} /> : <FlatList data={items} keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.list} ListEmptyComponent={<EmptyState message="Chưa có bình luận cần phản hồi." />}
      renderItem={({item}) => <View style={styles.card}><Text style={styles.author}>{item.username || 'Khách hàng'}</Text>
        <Text style={styles.comment}>{item.content}</Text>
        <TextInput value={replies[item.id] || ''} onChangeText={value => setReplies({...replies, [item.id]: value})}
          style={styles.input} placeholder="Nhập phản hồi..." multiline />
        <Button title="Gửi phản hồi" color={colors.teal} onPress={() => reply(item)} />
      </View>} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  list: {padding: spacing.lg}, card: {padding: spacing.md, marginBottom: spacing.md, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line},
  author: {fontWeight: '800', color: colors.ink}, comment: {marginVertical: spacing.sm, color: colors.muted},
  input: {minHeight: 70, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: 12, textAlignVertical: 'top'},
});
