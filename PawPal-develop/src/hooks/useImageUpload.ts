import { useEffect, useRef, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { isUploadConfigured, uploadImage } from '../api/petApi';
import { errorMessage } from '../utils/errors';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(true);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
    };
  }, []);
  async function selectImage(): Promise<string | undefined> {
    setError('');
    if (!isUploadConfigured()) {
      setError(
        'Chức năng ảnh chưa được cấu hình. Bạn có thể lưu hồ sơ trước và thêm ảnh sau.',
      );
      return;
    }
    setUploading(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
      });
      if (!live.current || result.didCancel) {
        return;
      }
      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Không mở được thư viện ảnh.');
      }
      const asset = result.assets?.[0];
      if (!asset?.uri || !asset.fileSize || !asset.type) {
        throw new Error('Không đọc được ảnh này. Hãy chọn ảnh khác.');
      }
      controller.current = new AbortController();
      const url = await uploadImage(
        {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'pawpal-photo.jpg',
          size: asset.fileSize,
        },
        controller.current.signal,
      );
      if (live.current) {
        return url;
      }
    } catch (reason) {
      if (live.current) {
        setError(errorMessage(reason));
      }
    } finally {
      if (live.current) {
        setUploading(false);
      }
    }
  }
  return { uploading, error, selectImage };
}
