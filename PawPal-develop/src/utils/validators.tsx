export function isValidLogin(value: string): boolean {
  return value.trim().length >= 3;
}

export function isValidPrice(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 999999999;
}

export type FieldErrors = Record<string, string>;
export function validatePet(value: {
  name: string;
  species: string;
  age: string;
  breed: string;
  size: string;
  gender: string;
  notes: string;
  imageURL: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!value.name.trim() || value.name.trim().length > 40)
    errors.name = 'Nhập tên thú cưng, tối đa 40 ký tự.';
  if (!['Chó', 'Mèo', 'Khác'].includes(value.species))
    errors.species = 'Chọn loài thú cưng.';
  if (
    value.age.trim() === '' ||
    !Number.isInteger(Number(value.age)) ||
    Number(value.age) < 0 ||
    Number(value.age) > 30
  )
    errors.age = 'Nhập số tuổi nguyên từ 0 đến 30.';
  if (value.breed.length > 40) errors.breed = 'Tên giống tối đa 40 ký tự.';
  if (!['Nhỏ', 'Vừa', 'Lớn'].includes(value.size))
    errors.size = 'Chọn kích cỡ.';
  if (!['Cái', 'Đực', 'Không rõ'].includes(value.gender))
    errors.gender = 'Chọn giới tính.';
  if (value.notes.length > 300) errors.notes = 'Ghi chú tối đa 300 ký tự.';
  if (
    value.imageURL &&
    !value.imageURL.startsWith('https://res.cloudinary.com/')
  )
    errors.imageURL = 'Ảnh cần được tải lên Cloudinary trước khi lưu.';
  return errors;
}
export function validateService(value: {
  name: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  imageURL: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!value.name.trim() || value.name.trim().length > 60)
    errors.name = 'Tên dịch vụ từ 1 đến 60 ký tự.';
  if (!value.category.trim() || value.category.length > 40)
    errors.category = 'Loại dịch vụ từ 1 đến 40 ký tự.';
  if (!/^\d+$/.test(value.price) || !isValidPrice(Number(value.price)))
    errors.price = 'Giá là số nguyên từ 1 đến 999999999 đồng.';
  if (
    !/^\d+$/.test(value.duration) ||
    Number(value.duration) < 5 ||
    Number(value.duration) > 600
  )
    errors.duration = 'Thời lượng là số nguyên từ 5 đến 600 phút.';
  if (value.description.length > 500)
    errors.description = 'Mô tả tối đa 500 ký tự.';
  if (
    value.imageURL &&
    !value.imageURL.startsWith('https://res.cloudinary.com/')
  )
    errors.imageURL = 'Ảnh cần được tải lên Cloudinary trước khi lưu.';
  return errors;
}
export function searchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
