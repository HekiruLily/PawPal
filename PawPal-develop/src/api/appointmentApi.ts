import { backendRequest, jsonBody } from './backendSession';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'expired';
export type Appointment = {
  aid: number;
  reference?: string;
  version: number;
  status: AppointmentStatus;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  totalPrice: number;
  discount?: number;
  petId?: number;
  firebasePetId?: string;
  petName: string;
  petImageURL?: string;
  serviceNames?: string[];
  serviceIds?: number[];
  serviceName?: string;
  groomerId?: number;
  groomerName?: string;
  customerName?: string;
  username?: string;
  phoneNumber?: string;
  editCount?: number;
  items?: {
    serviceId: number;
    firebaseServiceId?: string;
    serviceName: string;
    price: number;
    duration: number;
  }[];
};
export type Quote = {
  subtotal: number;
  discount: number;
  totalPrice: number;
  durationMinutes: number;
};
export type Slot = { startTime: string; groomerId: number };
export type BookingDraft = {
  firebasePetId: string;
  firebaseServiceIds: string[];
  groomerId?: number | null;
  startTime: string;
  expectedTotal: number;
  expectedDuration: number;
  expectedDiscount: number;
};

export const appointmentApi = {
  list: (manager = false) =>
    backendRequest(
      manager ? '/maintain/api/appointments' : '/Appointment/api/appointments',
      {},
      manager,
    ) as Promise<Appointment[]>,
  quote: (firebasePetId: string, firebaseServiceIds: string[]) =>
    backendRequest(
      '/Appointment/api/quote',
      jsonBody('POST', { firebasePetId, firebaseServiceIds }),
    ) as Promise<Quote>,
  slots: (
    date: string,
    firebasePetId: string,
    firebaseServiceIds: string[],
    groomerId?: number,
  ) =>
    backendRequest(
      `/Appointment/api/slots?date=${encodeURIComponent(date)}`,
      jsonBody('POST', { firebasePetId, firebaseServiceIds, groomerId }),
    ) as Promise<Slot[]>,
  create: (draft: BookingDraft) =>
    backendRequest(
      '/Appointment/api/appointments',
      jsonBody('POST', draft),
    ) as Promise<Appointment>,
  update: (aid: number, version: number, draft: BookingDraft) =>
    backendRequest(
      `/Appointment/api/appointments/${aid}`,
      jsonBody('PUT', { ...draft, version }),
    ) as Promise<Appointment>,
  cancel: (item: Appointment) =>
    backendRequest(
      `/Appointment/api/appointments/${item.aid}/cancel?version=${item.version}`,
      { method: 'POST' },
    ),
  status: (item: Appointment, status: AppointmentStatus, groomerId?: number) =>
    backendRequest(
      `/maintain/api/appointments/${item.aid}/status`,
      jsonBody('POST', { status, groomerId, version: item.version }),
      true,
    ),
  assign: (item: Appointment, groomerId: number) =>
    backendRequest(
      `/maintain/api/appointments/${item.aid}/assign`,
      jsonBody('POST', { groomerId, version: item.version }),
      true,
    ),
};
