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
import { useToast } from '../context/ToastContext';
import { usePets, Pet, PetDraft } from '../hooks/usePets';
import { useImageUpload } from '../hooks/useImageUpload';
import { TopBar } from '../components/TopBar';
import { PetCard } from '../components/PetCard';
import { PetIntroBanner } from '../components/PetIntroBanner';
import { PetForm } from '../components/PetForm';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';
import { colors, ui } from '../theme';

export function PetListScreen() {
  const { user, error: authError } = useAuth();
  const data = usePets(user!.uid);
  const image = useImageUpload();
  const { showSuccess } = useToast();
  const [editor, setEditor] = useState<{ pet?: Pet } | null>(null);
  const [deleting, setDeleting] = useState<Pet | null>(null);
  async function save(draft: PetDraft) {
    if (await data.save(draft, editor?.pet?.id)) {
      setEditor(null);
      showSuccess('Đã lưu hồ sơ thú cưng.');
    }
  }
  async function remove() {
    if (deleting && (await data.remove(deleting.id))) {
      setDeleting(null);
      showSuccess('Đã xóa hồ sơ thú cưng.');
    }
  }
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar title="Thú cưng" />
      <FlatList
        data={data.items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <PetIntroBanner count={data.items.length} />
            <ActionButton
              title="Thêm hồ sơ thú cưng"
              icon="plus"
              onPress={() => {
                data.clearActionError();
                setEditor({});
              }}
            />
            {authError ? (
              <Text accessibilityRole="alert" style={ui.error}>
                {authError}
              </Text>
            ) : null}
            {data.error ? (
              <View style={ui.errorBox}>
                <Text style={ui.error}>{data.error}</Text>
                <ActionButton
                  title="Thử lại"
                  variant="secondary"
                  onPress={data.retry}
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
              title="Chưa có hồ sơ thú cưng"
              message="Thêm thông tin bé cưng để đặt lịch nhanh và quản lý việc chăm sóc dễ dàng hơn."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <PetCard
            item={item}
            disabled={data.busy}
            onEdit={() => {
              data.clearActionError();
              setEditor({ pet: item });
            }}
            onDelete={() => {
              data.clearActionError();
              setDeleting(item);
            }}
          />
        )}
      />
      <BottomSheetModal
        visible={!!editor}
        title={editor?.pet ? 'Sửa thú cưng' : 'Thêm thú cưng'}
        onClose={() => setEditor(null)}
        busy={data.busy || image.uploading}
      >
        {editor ? (
          <PetForm
            pet={editor.pet}
            busy={data.busy}
            error={data.actionError}
            uploading={image.uploading}
            uploadError={image.error}
            onChooseImage={image.selectImage}
            onSubmit={save}
            onCancel={() => setEditor(null)}
          />
        ) : null}
      </BottomSheetModal>
      <BottomSheetModal
        visible={!!deleting}
        title={`Xóa hồ sơ ${deleting?.name || ''}?`}
        onClose={() => setDeleting(null)}
        busy={data.busy}
      >
        <Text style={ui.body}>
          Hồ sơ sẽ được xóa khỏi danh sách của bạn. Thú cưng đang có lịch hẹn
          cần được xử lý lịch trước.
        </Text>
        {data.actionError ? (
          <Text style={ui.error}>{data.actionError}</Text>
        ) : null}
        <ActionButton
          title="Giữ lại hồ sơ"
          variant="secondary"
          onPress={() => setDeleting(null)}
          disabled={data.busy}
        />
        <ActionButton
          title="Xóa hồ sơ"
          variant="danger"
          onPress={remove}
          loading={data.busy}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { gap: 14, paddingBottom: 4 },
  content: { ...ui.content, paddingTop: 4, gap: 10 },
});
