import type { Appointment } from '../api/appointmentApi';

export const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
};
export function storeDate(value = new Date()) {
  return new Date(value.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}
export function validBookingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value &&
    value >= storeDate()
  );
}
export function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
export function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  });
}
export function effectiveStatus(item: Appointment, now = Date.now()) {
  return item.status === 'pending' && Date.parse(item.startTime) <= now
    ? 'expired'
    : item.status;
}
export function canCancel(item: Appointment, now = Date.now()) {
  const remaining = Date.parse(item.startTime) - now;
  return (
    (item.status === 'pending' && remaining > 0) ||
    (item.status === 'confirmed' && remaining >= 24 * 3600000)
  );
}
export function canEdit(item: Appointment, now = Date.now()) {
  return (
    effectiveStatus(item, now) === 'pending' && (item.editCount || 0) === 0
  );
}
export function appointmentServices(item: Appointment) {
  return (
    item.items?.map(service => service.serviceName).join(' + ') ||
    item.serviceNames?.join(' + ') ||
    item.serviceName ||
    'Dịch vụ chăm sóc'
  );
}
