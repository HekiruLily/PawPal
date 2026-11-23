import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {EmptyState} from '../components/EmptyState';
import {TopBar} from '../components/TopBar';
import {useGroomers} from '../hooks/useGroomers';
import {GroomerItem} from '../components/GroomerCard';
import {colors, spacing} from '../theme';
import {Groomer} from '../api/groomerApi';
import {useToast} from '../context/ToastContext';
import {SearchBar} from '../components/SearchBar';

export function ManageGroomersScreen() {
  const [visible, setVisible] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [form, setForm] = useState<Partial<Groomer>>({});
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{name?: boolean; gender?: boolean; address?: boolean; phoneNumber?: boolean}>({});
  const {items, loading, create, update, remove, reload, setAccepting} = useGroomers();
  const {showError, showSuccess} = useToast();
  const openCreate = () => {
    setForm({
      name: '',
      gender: '',
      title: '',
      experienceYears: 0,
      specialties: '',
      acceptingAppointments: true,
      address: '',
      phoneNumber: '',
      imageURL: '/assets/images/no-user.png',
      description: '',
    });
    setGenderOpen(false);
    setFieldErrors({});
    setVisible(true);
  };
  const openEdit = (item: GroomerItem) => {
    setForm({...item});
    setGenderOpen(false);
    setFieldErrors({});
    setVisible(true);
  };
  const save = async () => {
    const errors = {
      name: !form.name?.trim(),
      gender: !form.gender?.trim(),
      address: !form.address?.trim(),
      phoneNumber: !form.phoneNumber?.trim(),
    };
    setFieldErrors(errors);
    if (errors.name || errors.gender || errors.address || errors.phoneNumber) {
      return;
    }
    if (form.phoneNumber?.trim() && (!/^[0-9+(). -]{8,11}$/.test(form.phoneNumber.trim()))) {
      const message = 'Số điện thoại không hợp lệ.';
      setFieldErrors(current => ({...current, phoneNumber: true}));
      return;
    }
    setSaving(true);
    try {
      form.gid ? await update(form) : await create(form);
      setVisible(false);
      await reload();
      showSuccess(form.gid ? 'Cập nhật nhân viên thành công.' : 'Thêm nhân viên thành công.');
    } catch (error: any) {
      const message = error.message || 'Lưu nhân viên thất bại.';
      showError(message);
    }
    finally { setSaving(false); }
  };
  const confirmDelete = (item: GroomerItem) => Alert.alert('Xóa nhân viên', `Xóa ${item.name}?`, [
    {text: 'Hủy', style: 'cancel'},
    {text: 'Xóa', style: 'destructive', onPress: async () => {
      try {
        await remove(item.gid);
        await reload();
        showSuccess('Xóa nhân viên thành công.');
      } catch (error: any) { showError(error.message || 'Xóa nhân viên thất bại.'); }
    }},
  ]);
  const chooseImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      includeBase64: false,
    });
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
      showError('Ảnh phải nhỏ hơn hoặc bằng 5 MB.');
      return;
    }
    setForm(current => ({...current, imageURL: asset.uri}));
  };
  const search = async (value: string) => {
    setQuery(value);
    try {
      await reload(value);
    } catch (error: any) {
      showError(error.message || 'Tìm kiếm nhân viên thất bại.');
    }
  };
  const clearSearch = () => {
    setQuery('');
    reload('');
  };
  return <SafeAreaView style={styles.screen}>
    <TopBar title="Nhân viên" right={<Pressable style={styles.addButton} onPress={openCreate}><Text style={styles.addText}>+ Thêm</Text></Pressable>} />
    <View style={styles.searchWrap}>
      <SearchBar
        value={query}
        onChangeText={search}
        placeholder="Tìm tên nhân viên"
      />
      {query ? <TouchableOpacity style={styles.clearSearch} onPress={clearSearch}>
        <Text style={styles.clearSearchText}>Xóa</Text>
      </TouchableOpacity> : null}
    </View>
    <Text style={styles.infoNote}>
      Tạm ngưng sẽ ẩn nhân viên khỏi lượt đặt mới. Các lịch đã phân công vẫn hiển thị.
    </Text>
    {loading ? <ActivityIndicator color={colors.teal} /> :
      <FlatList data={items} keyExtractor={item => String(item.gid)}
        ListEmptyComponent={<EmptyState message="Không tìm thấy nhân viên." />}
        contentContainerStyle={styles.list}
        renderItem={({item}) => <StaffCard
          item={item}
          onEdit={() => openEdit(item)}
          onDelete={() => confirmDelete(item)}
          onToggleAccepting={async () => {
            try {
              await setAccepting(item.gid, item.acceptingAppointments === false);
              showSuccess(item.acceptingAppointments === false
                ? 'Nhân viên đã tiếp tục nhận lịch.'
                : 'Nhân viên đã tạm ngưng nhận lịch.');
            } catch (error: any) {
              showError(error.message || 'Không thể cập nhật trạng thái nhân viên.');
            }
          }}
        />}
      />}
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{form.gid ? 'Sửa nhân viên' : 'Thêm nhân viên'}</Text>
        <ScrollView>
          <Text style={styles.fieldLabel}>Tên nhân viên <Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            value={form.name || ''}
            onChangeText={value => {
              setForm(current => ({...current, name: value}));
              if (value.trim()) setFieldErrors(current => ({...current, name: false}));
            }}
            placeholder="Nhập tên nhân viên"
            placeholderTextColor={colors.muted}
            keyboardType="default"
            style={[styles.input, fieldErrors.name && styles.inputError]}
          />

          {fieldErrors.name ? <Text style={styles.fieldErrorText}>Vui lòng nhập tên nhân viên.</Text> : null}

          <Text style={styles.fieldLabel}>Giới tính <Text style={styles.requiredStar}>*</Text></Text>
          <Pressable style={[styles.select, fieldErrors.gender && styles.inputError]} onPress={() => setGenderOpen(open => !open)}>
            <Text style={styles.selectText}>{form.gender || 'Chọn giới tính'}</Text>
            <Text style={styles.selectArrow}>{genderOpen ? '▲' : '▼'}</Text>
          </Pressable>
          {genderOpen ? <View style={styles.options}>
            {['Nam', 'Nữ', 'Khác'].map(gender =>
              <Pressable
                key={gender}
                style={[styles.option, form.gender === gender && styles.optionSelected]}
                onPress={() => {
                  setForm(current => ({...current, gender}));
                  setFieldErrors(current => ({...current, gender: false}));
                  setGenderOpen(false);
                }}
              >
                <Text style={[styles.optionText, form.gender === gender && styles.optionTextSelected]}>{gender}</Text>
              </Pressable>)}
          </View> : null}
          {fieldErrors.gender ? <Text style={styles.fieldErrorText}>Vui lòng chọn giới tính.</Text> : null}

          <Text style={styles.fieldLabel}>Chức danh chuyên môn</Text>
          <TextInput
            value={form.title || ''}
            onChangeText={value => setForm(current => ({...current, title: value}))}
            placeholder="Ví dụ: Groomer trưởng"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Số năm kinh nghiệm</Text>
          <TextInput
            value={form.experienceYears === undefined || form.experienceYears === null
              ? ''
              : String(form.experienceYears)}
            onChangeText={value => setForm(current => ({
              ...current,
              experienceYears: value.trim() === '' ? 0 : Number(value.replace(/[^0-9]/g, '')),
            }))}
            placeholder="Ví dụ: 8"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Lĩnh vực chuyên môn</Text>
          <TextInput
            value={form.specialties || ''}
            onChangeText={value => setForm(current => ({...current, specialties: value}))}
            placeholder="Ví dụ: Chó lớn, Lông dài, Mèo"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Địa chỉ <Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            value={form.address || ''}
            onChangeText={value => {
              setForm(current => ({...current, address: value}));
              if (value.trim()) setFieldErrors(current => ({...current, address: false}));
            }}
            placeholder="Nhập địa chỉ"
            placeholderTextColor={colors.muted}
            keyboardType="default"
            style={[styles.input, fieldErrors.address && styles.inputError]}
          />
          {fieldErrors.address ? <Text style={styles.fieldErrorText}>Vui lòng nhập địa chỉ.</Text> : null}

          <Text style={styles.fieldLabel}>Số điện thoại <Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            value={form.phoneNumber || ''}
            onChangeText={value => {
              setForm(current => ({...current, phoneNumber: value}));
              if (value.trim()) setFieldErrors(current => ({...current, phoneNumber: false}));
            }}
            keyboardType="phone-pad"
            placeholder="Nhập số điện thoại"
            placeholderTextColor={colors.muted}
            style={[styles.input, fieldErrors.phoneNumber && styles.inputError]}
          />
          {fieldErrors.phoneNumber ? <Text style={styles.fieldErrorText}>Vui lòng nhập số điện thoại.</Text> : null}

          <Text style={styles.fieldLabel}>Ảnh nhân viên</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={chooseImage}>
            <Text style={styles.uploadText}>Chọn ảnh từ thư viện</Text>
          </TouchableOpacity>
          <TextInput
            value={form.imageURL || ''}
            onChangeText={value => setForm(current => ({...current, imageURL: value}))}
            placeholder="Hoặc dán liên kết ảnh"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="url"
            style={[styles.input, styles.imageInput]}
          />

          <Text style={styles.fieldLabel}>Mô tả</Text>
          <TextInput
            value={form.description || ''}
            onChangeText={value => setForm(current => ({...current, description: value}))}
            placeholder="Nhập mô tả bằng tiếng Việt"
            placeholderTextColor={colors.muted}
            keyboardType="default"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.descriptionInput]}
          />
        </ScrollView>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setVisible(false)}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
          </TouchableOpacity>
        </View>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

function StaffCard({item, onEdit, onDelete, onToggleAccepting}: {
  item: GroomerItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAccepting: () => void;
}) {
  const initials = item.name?.trim().split(/\s+/).map(part => part[0]).filter(Boolean).slice(-2).join('').toUpperCase() || '?';
  const role = item.title?.trim() || 'Groomer';
  const experience = item.experienceYears ?? 0;
  const tags = (item.specialties || '')
    .split(/[,;]/)
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 4);
  const accepting = item.acceptingAppointments !== false;
  const upcoming = item.upcomingAppointmentCount ?? 0;
  return <View style={styles.card}>
    <View style={styles.personMain}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {role}
          {experience > 0 ? ` · ${experience} năm kinh nghiệm` : ''}
        </Text>
        {tags.length ? <View style={styles.tags}>
          {tags.map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View> : null}
      </View>
    </View>
    <View style={styles.personState}>
      <Text style={[styles.status, !accepting && styles.paused]}>
        {accepting ? 'Đang nhận lịch' : 'Tạm ngưng nhận lịch'}
      </Text>
      <Text style={styles.upcoming}>{upcoming} lịch sắp tới</Text>
    </View>
    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.actionButton} onPress={onToggleAccepting}>
        <Text style={styles.actionText}>
          {accepting ? 'Tạm ngưng' : 'Tiếp tục'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
        <Text style={styles.actionText}>Sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
        <Text style={styles.actionText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  searchWrap: {position: 'relative'},
  infoNote: {marginHorizontal: spacing.lg, marginBottom: 10, color: colors.muted, fontSize: 12.5, lineHeight: 18},
  clearSearch: {position: 'absolute', right: 28, top: 13, height: 22, justifyContent: 'center'},
  clearSearchText: {color: colors.danger, fontWeight: '800', fontSize: 12},
  addButton: {minWidth: 74, height: 44, borderRadius: 12, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center'},
  addText: {color: colors.on, fontWeight: '800'},
  list: {paddingHorizontal: 14, paddingTop: 4, paddingBottom: spacing.xl},
  card: {marginBottom: 12, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: '#DDBEC0', backgroundColor: '#FFFDFC'},
  personMain: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  avatar: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF4CB'},
  avatarText: {color: '#98292F', fontSize: 15, fontWeight: '800'},
  info: {flex: 1, paddingTop: 1},
  name: {fontSize: 16, lineHeight: 20, fontWeight: '800', color: colors.ink},
  meta: {marginTop: 2, color: colors.muted, fontSize: 12.5},
  tags: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7},
  tag: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: '#EDDDB2', backgroundColor: '#FFF4CB', color: colors.ink, fontSize: 12, fontWeight: '800', overflow: 'hidden'},
  personState: {marginTop: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  status: {paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#FFF4CB', color: '#98292F', fontSize: 12, fontWeight: '800'},
  paused: {backgroundColor: '#FFF4CB', color: '#98292F'},
  upcoming: {color: colors.muted, fontSize: 11.5},
  toggle: {height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#FFF4CB', backgroundColor: '#FFF4CB', alignItems: 'center', justifyContent: 'center'},
  toggleText: {color: '#98292F', fontWeight: '800', fontSize: 13},
  actionRow: {flexDirection: 'row', gap: 8, marginTop: 8},
  actionButton: {flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#FFF4CB', backgroundColor: '#FFF4CB', alignItems: 'center', justifyContent: 'center'},
  actionText: {color: '#98292F', fontWeight: '800', fontSize: 12},
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: 'rgba(56,40,29,0.28)'},
  modal: {width: '92%', maxHeight: '78%', padding: spacing.lg, borderRadius: 20, backgroundColor: colors.card},
  modalTitle: {fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 12},
  fieldLabel: {marginTop: 4, marginBottom: 6, color: colors.ink, fontSize: 13, fontWeight: '800'},
  requiredStar: {color: colors.danger, fontWeight: '900'},
  inputError: {borderColor: colors.danger, borderWidth: 1.5},
  fieldErrorText: {marginTop: -4, marginBottom: 7, color: colors.danger, fontSize: 12, fontWeight: '700'},
  input: {height: 48, marginBottom: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', color: colors.ink},
  select: {height: 48, marginBottom: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  selectText: {color: colors.ink},
  selectArrow: {color: colors.muted, fontSize: 12},
  options: {marginTop: -8, marginBottom: 8, overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF'},
  option: {height: 44, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line},
  optionSelected: {backgroundColor: colors.tealLight},
  optionText: {color: colors.ink},
  optionTextSelected: {color: colors.tealDark, fontWeight: '800'},
  uploadButton: {height: 44, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.tealLight, alignItems: 'center', justifyContent: 'center'},
  uploadText: {color: colors.tealDark, fontWeight: '800'},
  imageInput: {marginBottom: 8},
  descriptionInput: {height: 92, paddingTop: 12},
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8},
  cancelButton: {height: 44, minWidth: 84, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center'},
  cancelText: {color: colors.ink, fontWeight: '800'},
  saveButton: {height: 44, minWidth: 84, borderRadius: 12, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center'},
  saveButtonDisabled: {opacity: 0.65},
  saveText: {color: colors.on, fontWeight: '800'},
});
