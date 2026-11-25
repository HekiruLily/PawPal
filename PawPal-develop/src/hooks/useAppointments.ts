import { useRef, useState, useEffect } from 'react';
import {
  appointmentApi,
  Appointment,
  AppointmentStatus,
} from '../api/appointmentApi';
import { useApiData } from './useApiData';
import { errorMessage } from '../utils/errors';

export function useAppointments(manager = false) {
  const result = useApiData(() => appointmentApi.list(manager));
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const live = useRef(true);
  const running = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  async function change(task: () => Promise<unknown>) {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setActionError('');
    try {
      await task();
      await result.reload();
      return true;
    } catch (reason) {
      if (live.current) setActionError(errorMessage(reason));
      return false;
    } finally {
      running.current = false;
      if (live.current) setBusy(false);
    }
  }
  return {
    ...result,
    items: result.data || [],
    busy,
    actionError,
    cancel: (item: Appointment) => change(() => appointmentApi.cancel(item)),
    status: (item: Appointment, status: AppointmentStatus, gid?: number) =>
      change(() => appointmentApi.status(item, status, gid)),
    assign: (item: Appointment, gid: number) =>
      change(() => appointmentApi.assign(item, gid)),
  };
}
