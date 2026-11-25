import { cloudinaryConfig } from './firebaseConfig';

export type UploadImage =
  | { uri: string; name: string; type: string; size: number }
  | Blob;
export function isUploadConfigured() {
  return Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.unsignedPreset);
}
export async function uploadImage(
  image: UploadImage,
  signal?: AbortSignal,
): Promise<string> {
  if (!isUploadConfigured()) {
    throw new Error(
      'Chức năng ảnh chưa được cấu hình Cloudinary. Bạn vẫn có thể lưu hồ sơ không kèm ảnh.',
    );
  }
  const size = image.size;
  if (
    size <= 0 ||
    size > 5 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)
  ) {
    throw new Error('Chọn ảnh JPEG, PNG hoặc WebP không quá 5 MB.');
  }
  const form = new FormData();
  // FormData on native accepts a URI descriptor; on Web it accepts a Blob/File.
  form.append('file', image as Blob);
  form.append('upload_preset', cloudinaryConfig.unsignedPreset);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      cloudinaryConfig.cloudName,
    )}/image/upload`,
    { method: 'POST', body: form, signal },
  );
  const body = await response.json();
  if (
    !response.ok ||
    typeof body.secure_url !== 'string' ||
    !body.secure_url.startsWith('https://res.cloudinary.com/')
  ) {
    throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
  }
  return body.secure_url;
}
