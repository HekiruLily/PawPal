import { backendRequest } from './backendSession';
import { appointmentApi, Appointment } from './appointmentApi';
export type ReportData = {
  totalAppointments: number;
  revenue: number;
  statusCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  daily: { date: string; appointments: number; revenue: number }[];
  appointments: Appointment[];
  customerCount?: number;
  petCount?: number;
  pendingAppointments?: number;
};
export async function getReportData(_year = new Date().getFullYear()) {
  const data = await managerApi.getReports('all');
  return { ...data, annual: [], quarterly: [] };
}
export const managerApi = {
  getDashboard: (period: string | number = '7') =>
    backendRequest(
      `/maintain/api/dashboard?period=${period}`,
      {},
      true,
    ) as Promise<ReportData>,
  getReports: (period = '7') =>
    backendRequest(
      `/maintain/api/reports?period=${period}`,
      {},
      true,
    ) as Promise<ReportData>,
  listUsers: () =>
    backendRequest('/maintain/api/users', {}, true) as Promise<any[]>,
  searchUsers: (q: string) =>
    backendRequest(
      `/maintain/api/users?q=${encodeURIComponent(q)}`,
      {},
      true,
    ) as Promise<any[]>,
  getUserDetail: async (uid: number) => {
    const user = (await managerApi.listUsers()).find(
      item => item.uid === Number(uid),
    );
    if (!user) throw new Error('Không tìm thấy khách hàng.');
    return user;
  },
  listAppointments: () => appointmentApi.list(true),
  updateAppointmentStatus: async (
    aid: number,
    status: Appointment['status'],
  ) => {
    const item = (await appointmentApi.list(true)).find(row => row.aid === aid);
    if (!item) throw new Error('Không tìm thấy lịch hẹn.');
    return appointmentApi.status(item, status, item.groomerId);
  },
  listFeedback: async () => [],
  replyFeedback: async (_id: number | string, _reply: string) => {
    throw new Error('Backend chưa cung cấp chức năng phản hồi bình luận.');
  },
};
