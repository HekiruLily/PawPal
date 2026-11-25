import { useEffect, useRef, useState } from 'react';
import {
  appointmentApi,
  Appointment,
  Quote,
  Slot,
} from '../api/appointmentApi';
import type { ServiceItem } from '../api/serviceApi';
import { errorMessage } from '../utils/errors';

export function useBooking(
  petId: string,
  services: ServiceItem[],
  date: string,
  groomerId: number | undefined,
  enabled: boolean,
) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const live = useRef(true);
  const sending = useRef(false);
  const serviceKey = services
    .map(item => item.id)
    .sort()
    .join(',');
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setSlot(null);
    setSlots([]);
    setQuote(null);
    setError('');
    if (!enabled || !petId || !serviceKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    async function load() {
      try {
        const ids = serviceKey.split(',');
        const [price, times] = await Promise.all([
          appointmentApi.quote(petId, ids),
          appointmentApi.slots(date, petId, ids, groomerId),
        ]);
        if (active) {
          setQuote(price);
          setSlots(times);
        }
      } catch (reason) {
        if (active) setError(errorMessage(reason));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [petId, serviceKey, date, groomerId, enabled, attempt]);
  async function submit(edit?: Appointment) {
    if (!quote || !slot || sending.current) return null;
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      const draft = {
        firebasePetId: petId,
        firebaseServiceIds: services.map(item => item.id),
        groomerId: slot.groomerId,
        startTime: slot.startTime,
        expectedTotal: quote.totalPrice,
        expectedDuration: quote.durationMinutes,
        expectedDiscount: quote.discount,
      };
      const result = edit
        ? await appointmentApi.update(edit.aid, edit.version, draft)
        : await appointmentApi.create(draft);
      return live.current ? result : null;
    } catch (reason) {
      if (live.current) {
        setError(errorMessage(reason));
        setSlot(null);
      }
      return null;
    } finally {
      sending.current = false;
      if (live.current) setBusy(false);
    }
  }
  return {
    quote,
    slots,
    slot,
    setSlot,
    error,
    loading,
    busy,
    retry: () => setAttempt(value => value + 1),
    submit,
  };
}
