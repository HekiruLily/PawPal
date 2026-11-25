import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useBooking } from '../src/hooks/useBooking';
import { appointmentApi } from '../src/api/appointmentApi';
import {
  canCancel,
  effectiveStatus,
  storeDate,
} from '../src/utils/appointments';
import { reportCsv } from '../src/utils/reportCsv';
import type { Appointment } from '../src/api/appointmentApi';
import type { ServiceItem } from '../src/api/serviceApi';
jest.mock('../src/api/backendSession', () => ({
  backendRequest: jest.fn(),
  jsonBody: jest.fn(),
}));
const service: ServiceItem = {
  id: '1',
  name: 'Tắm',
  category: 'Tắm',
  description: '',
  price: 180000,
  duration: 60,
  active: true,
  imageURL: '',
  revision: 0,
};
const quote = {
  subtotal: 180000,
  discount: 27000,
  totalPrice: 153000,
  durationMinutes: 60,
};
const slot = { startTime: '2026-12-01T10:00:00+07:00', groomerId: 2 };
const appointment = {
  aid: 1,
  version: 4,
  status: 'pending',
  petName: 'Bơ',
  startTime: slot.startTime,
  durationMinutes: 60,
  totalPrice: 153000,
  editCount: 0,
} as Appointment;
let value: ReturnType<typeof useBooking>;
function Probe({ pet = '1', date = '2026-12-01' }) {
  value = useBooking(pet, [service], date, undefined, true);
  return null;
}
beforeEach(() => {
  jest.restoreAllMocks();
});

test('Firebase keys are preserved for trusted backend mapping, not coerced into SQL ids', async () => {
  const api = jest.spyOn(appointmentApi, 'quote').mockResolvedValue(quote);
  jest.spyOn(appointmentApi, 'slots').mockResolvedValue([slot]);
  let tree: TestRenderer.ReactTestRenderer;
  await act(() => {
    tree = TestRenderer.create(<Probe pet="-FirebasePushId" />);
  });
  expect(value!.error).toBe('');
  expect(api).toHaveBeenCalledWith('-FirebasePushId', ['1']);
  await act(() => tree!.unmount());
});
test('submission keeps the reviewed discount, duration, assigned staff and edit version', async () => {
  jest.spyOn(appointmentApi, 'quote').mockResolvedValue(quote);
  jest.spyOn(appointmentApi, 'slots').mockResolvedValue([slot]);
  const update = jest
    .spyOn(appointmentApi, 'update')
    .mockResolvedValue(appointment);
  let tree: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<Probe />);
  });
  await act(() => value!.setSlot(slot));
  await act(async () => {
    expect(await value!.submit(appointment)).toEqual(appointment);
  });
  expect(update).toHaveBeenCalledWith(1, 4, {
    firebasePetId: '1',
    firebaseServiceIds: ['1'],
    groomerId: 2,
    startTime: slot.startTime,
    expectedTotal: 153000,
    expectedDuration: 60,
    expectedDiscount: 27000,
  });
  await act(() => tree!.unmount());
});
test('a stale price response cannot replace slots for a newly selected date', async () => {
  let resolveOld: (value: typeof quote) => void;
  jest
    .spyOn(appointmentApi, 'quote')
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValue(quote);
  jest
    .spyOn(appointmentApi, 'slots')
    .mockResolvedValueOnce([slot])
    .mockResolvedValueOnce([
      { ...slot, startTime: '2026-12-02T11:00:00+07:00' },
    ]);
  let tree: TestRenderer.ReactTestRenderer;
  await act(() => {
    tree = TestRenderer.create(<Probe />);
  });
  await act(async () => tree!.update(<Probe date="2026-12-02" />));
  await act(async () => resolveOld!(quote));
  expect(value!.slots[0].startTime).toBe('2026-12-02T11:00:00+07:00');
  await act(() => tree!.unmount());
});
test('a rejected booking does not show success and invalidates the selected slot', async () => {
  jest.spyOn(appointmentApi, 'quote').mockResolvedValue(quote);
  jest.spyOn(appointmentApi, 'slots').mockResolvedValue([slot]);
  jest
    .spyOn(appointmentApi, 'create')
    .mockRejectedValue(new Error('Giá đã thay đổi.'));
  let tree: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<Probe />);
  });
  await act(() => value!.setSlot(slot));
  await act(async () => {
    expect(await value!.submit()).toBeNull();
  });
  expect(value!.error).toBe('Giá đã thay đổi.');
  expect(value!.slot).toBeNull();
  await act(() => tree!.unmount());
});
test('cancellation and expiry use real instants, and the shop date is UTC+7', () => {
  const start = Date.parse(slot.startTime);
  expect(canCancel(appointment, start - 1)).toBe(true);
  expect(effectiveStatus(appointment, start)).toBe('expired');
  expect(
    canCancel({ ...appointment, status: 'confirmed' }, start - 86400000),
  ).toBe(true);
  expect(
    canCancel({ ...appointment, status: 'confirmed' }, start - 86399999),
  ).toBe(false);
  expect(storeDate(new Date('2026-12-01T18:00:00Z'))).toBe('2026-12-02');
});
test('CSV escapes quotes, newlines and spreadsheet formulas', () => {
  const csv = reportCsv([
    { ...appointment, customerName: '=SUM(1,2)', petName: 'Bơ "bé"\nnhỏ' },
  ]);
  expect(csv).toContain('"\'=SUM(1,2)"');
  expect(csv).toContain('"Bơ ""bé""\nnhỏ"');
});
