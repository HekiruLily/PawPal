import { useEffect, useRef, useState } from 'react';
import { notificationApi, Notification } from '../api/notificationApi';
import type { Appointment } from '../api/appointmentApi';
import { useApiData } from './useApiData';
import { errorMessage } from '../utils/errors';
export function useNotifications() {
  const data = useApiData(notificationApi.list);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const live = useRef(true);
  const busy = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  async function open(item: Notification) {
    if (busy.current) return;
    busy.current = true;
    setError('');
    try {
      const value = await notificationApi.open(item);
      if (live.current) {
        setDetail(value);
        await data.reload();
      }
    } catch (reason) {
      if (live.current) setError(errorMessage(reason));
    } finally {
      busy.current = false;
    }
  }
  return {
    ...data,
    actionError: error,
    detail,
    close: () => setDetail(null),
    open,
  };
}
