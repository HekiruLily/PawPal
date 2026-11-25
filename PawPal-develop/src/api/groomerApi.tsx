import { backendRequest, jsonBody } from './backendSession';
export type Groomer = {
  gid: number;
  name: string;
  gender: string;
  imageURL?: string;
  rank: number;
  phoneNumber?: string;
  address?: string;
  description?: string;
  title?: string;
  experienceYears?: number;
  specialties?: string;
  acceptingAppointments?: boolean;
  upcomingAppointmentCount?: number;
  veterinary?: boolean;
};
export const groomerApi = {
  list: () =>
    backendRequest('/maintain/api/groomers', {}, true) as Promise<Groomer[]>,
  listPublic: () =>
    backendRequest('/appointment-system/api/groomers') as Promise<Groomer[]>,
  search: (keyword: string) =>
    backendRequest(
      `/maintain/api/groomers?q=${encodeURIComponent(keyword)}`,
      {},
      true,
    ) as Promise<Groomer[]>,
  getById: async (gid: number) => {
    const item = (await groomerApi.list()).find(row => row.gid === gid);
    if (!item) throw new Error('Không tìm thấy nhân viên.');
    return item;
  },
  create: (groomer: Partial<Groomer>) =>
    backendRequest('/maintain/api/groomers', jsonBody('POST', groomer), true),
  update: (groomer: Partial<Groomer>) =>
    backendRequest(
      `/maintain/api/groomers/${groomer.gid}`,
      jsonBody('PUT', groomer),
      true,
    ),
  remove: (gid: number) =>
    backendRequest(`/maintain/api/groomers/${gid}`, { method: 'DELETE' }, true),
  setAccepting: (gid: number, accepting: boolean) =>
    backendRequest(
      `/maintain/api/groomers/${gid}/accepting?accepting=${accepting}`,
      { method: 'POST' },
      true,
    ),
};
