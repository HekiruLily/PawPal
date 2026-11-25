import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/petApi';
import { errorMessage } from '../utils/errors';
export type { Pet, PetDraft } from '../api/petApi';

export function usePets(ownerId: string) {
  const [items, setItems] = useState<api.Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const live = useRef(true);
  const mutating = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    setLoading(true);
    setItems([]);
    setError('');
    try {
      stop = api.observePets(
        value => {
          if (active) {
            setItems(value);
            setLoading(false);
            setError('');
          }
        },
        reason => {
          if (active) {
            setError(errorMessage(reason));
            setLoading(false);
          }
        },
      );
    } catch (reason) {
      setError(errorMessage(reason));
      setLoading(false);
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [ownerId, attempt]);
  const mutate = useCallback(async (operation: () => Promise<unknown>) => {
    if (mutating.current) {
      return false;
    }
    mutating.current = true;
    setBusy(true);
    setActionError('');
    try {
      await operation();
      return true;
    } catch (reason) {
      if (live.current) {
        setActionError(errorMessage(reason));
      }
      return false;
    } finally {
      mutating.current = false;
      if (live.current) {
        setBusy(false);
      }
    }
  }, []);
  return {
    items,
    loading,
    busy,
    error,
    actionError,
    retry: () => setAttempt(value => value + 1),
    clearActionError: () => setActionError(''),
    save: (draft: api.PetDraft, id?: string) =>
      mutate(() => api.savePet(draft, id)),
    remove: (id: string) => mutate(() => api.deletePet(id)),
  };
}
