import { backendRequest } from './backendSession';
import { appointmentApi } from './appointmentApi';
export type Notification = {
  id: number;
  appointmentId?: number;
  title?: string;
  message: string;
  readAt?: string;
};
export const notificationApi = {
  list: () =>
    backendRequest('/customer/api/notifications') as Promise<Notification[]>,
  open: async (item: Notification) => {
    const rows = item.appointmentId ? await appointmentApi.list() : [];
    const appointment = rows.find(row => row.aid === item.appointmentId);
    if (item.appointmentId && !appointment)
      throw new Error('Lịch hẹn không còn khả dụng.');
    if (!item.readAt)
      await backendRequest(`/customer/api/notifications/${item.id}/read`, {
        method: 'POST',
      });
    return appointment || null;
  },
};
