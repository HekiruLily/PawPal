import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useServices, ServiceItem, ServiceDraft } from '../hooks/useServices';
import { useImageUpload } from '../hooks/useImageUpload';
import { useToast } from '../context/ToastContext';
import { TopBar } from '../components/TopBar';
import { ServiceCard } from '../components/ServiceCard';
import { ServiceForm } from '../components/ServiceForm';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { EmptyState } from '../components/EmptyState';
import { ActionButton } from '../components/ActionButton';
import { colors, ui } from '../theme';

export function ManageServicesScreen() {
  const data = useServices(true);
  const image = useImageUpload();
  const { showSuccess } = useToast();
  const [editor, setEditor] = useState<{ service?: ServiceItem } | null>(null);
  const [activeId, setActiveId] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'toggle'>('save');
  async function save(draft: ServiceDraft) {
    if (await data.save(draft, editor?.service)) {
      setEditor(null);
      showSuccess('Đã lưu dịch vụ.');
    }
  }
  async function savePrice(draft: ServiceDraft, service: ServiceItem) {
    setActiveId(service.id);
    setPendingAction('save');
    if (await data.save(draft, service)) showSuccess('Đã lưu thay đổi dịch vụ');
  }
  async function toggle(service: ServiceItem) {
    setActiveId(service.id);
    setPendingAction('toggle');
    if (await data.toggle(service, !service.active)) {
      showSuccess(
        `${service.name} ${service.active ? 'đã tạm ngưng' : 'đã mở lại'}`,
      );
    }
  }
  return (
    <SafeAreaView edges={['top']} style={ui.screen}>
      <TopBar
        manager
        title="Dịch vụ"
        right={
          <ActionButton
            title="Thêm"
            size="small"
            icon="plus"
            onPress={() => {
              data.clearActionError();
              setEditor({});
            }}
          />
        }
      />
      <FlatList
        data={data.allItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={ui.stack}>
            <Text style={styles.intro}>
              Giá và thời lượng áp dụng cho lượt đặt mới. Lịch đã tạo giữ giá đã
              chốt.
            </Text>
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
            <EmptyState message="Chưa có dịch vụ. Chọn Thêm để tạo dịch vụ đầu tiên." />
          ) : null
        }
        renderItem={({ item }) => (
          <ServiceCard
            key={`${item.id}:${item.revision}`}
            item={item}
            manager
            busy={data.busy}
            onPress={() => {
              data.clearActionError();
              setEditor({ service: item });
            }}
          >
            <ServiceForm
              service={item}
              pricingOnly
              pendingAction={activeId === item.id ? pendingAction : undefined}
              busy={data.busy}
              error={activeId === item.id ? data.actionError : ''}
              uploading={false}
              uploadError=""
              onChooseImage={image.selectImage}
              onSubmit={draft => savePrice(draft, item)}
              onToggle={() => toggle(item)}
            />
          </ServiceCard>
        )}
      />
      <BottomSheetModal
        visible={!!editor}
        title={editor?.service ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ'}
        onClose={() => setEditor(null)}
        busy={data.busy || image.uploading}
      >
        {editor ? (
          <ServiceForm
            service={editor.service}
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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { ...ui.content, paddingTop: 13, paddingHorizontal: 15, gap: 8 },
  intro: { ...ui.meta, fontSize: 12 },
});
