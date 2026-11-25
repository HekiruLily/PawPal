import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/serviceApi';
import { errorMessage } from '../utils/errors';
import { searchText } from '../utils/validators';
export type { ServiceItem, ServiceDraft } from '../api/serviceApi';

export function useServices(manager = false) {
  const [items, setItems] = useState<api.ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
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
    setError('');
    try {
      stop = api.observeServices(
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
  }, [attempt]);
  const available = useMemo(
    () => items.filter(item => manager || item.active),
    [items, manager],
  );
  const categories = useMemo(
    () => ['Tất cả', ...new Set(available.map(item => item.category))],
    [available],
  );
  const filtered = useMemo(
    () =>
      available.filter(
        item =>
          (category === 'Tất cả' ||
            !categories.includes(category) ||
            item.category === category) &&
          searchText(
            `${item.name} ${item.category} ${item.description}`,
          ).includes(searchText(query)),
      ),
    [available, category, categories, query],
  );
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
    items: filtered,
    allItems: available,
    categories,
    query,
    setQuery,
    category,
    setCategory,
    loading,
    busy,
    error,
    actionError,
    retry: () => setAttempt(value => value + 1),
    clearActionError: () => setActionError(''),
    save: (draft: api.ServiceDraft, existing?: api.ServiceItem) =>
      mutate(() => api.saveService(draft, existing)),
    toggle: (item: api.ServiceItem, active: boolean) =>
      mutate(() => api.setServiceActive(item, active)),
  };
}
