import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/errors';

// Refresh server screens on focus and discard late responses after account changes.
export function useApiData<T>(load: () => Promise<T>, key = '') {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const lifecycle = useRef({ generation: 0, active: false, scope: '' });
  const loader = useRef(load);
  loader.current = load;
  const reload = useCallback(async () => {
    const state = lifecycle.current;
    if (!state.active) return;
    const current = ++state.generation;
    setLoading(true);
    setError('');
    try {
      const value = await loader.current();
      if (state.generation === current) setData(value);
    } catch (reason) {
      if (state.generation === current) {
        setData(null);
        setError(errorMessage(reason));
      }
    } finally {
      if (state.generation === current) setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      const state = lifecycle.current;
      const scope = `${user?.uid}:${key}`;
      if (scope !== state.scope) setData(null);
      state.scope = scope;
      state.active = true;
      reload();
      return () => {
        state.active = false;
        state.generation++;
      };
    }, [reload, user?.uid, key]),
  );
  return { data, error, loading, reload };
}
