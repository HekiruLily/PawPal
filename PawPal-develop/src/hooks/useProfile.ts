import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/profileApi';
import { errorMessage } from '../utils/errors';
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<api.UserProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lifecycle = useRef({ generation: 0 });
  const running = useRef(false);
  useEffect(() => {
    const state = lifecycle.current;
    const current = ++state.generation;
    setLoading(true);
    setProfile(null);
    setError('');
    let stop: (() => void) | undefined;
    try {
      stop = api.observeProfile(
        value => {
          if (state.generation === current) {
            setProfile(value);
            setLoading(false);
          }
        },
        reason => {
          if (state.generation === current) {
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
      state.generation++;
      stop?.();
    };
  }, [user?.uid, attempt]);
  async function save(value: api.UserProfile) {
    if (running.current) return false;
    running.current = true;
    const state = lifecycle.current;
    const current = state.generation;
    setBusy(true);
    setError('');
    try {
      await api.saveProfile(value);
      return state.generation === current;
    } catch (reason) {
      if (state.generation === current) setError(errorMessage(reason));
      return false;
    } finally {
      running.current = false;
      if (state.generation === current) setBusy(false);
    }
  }
  return {
    profile,
    error,
    loading,
    busy,
    save,
    retry: () => setAttempt(value => value + 1),
  };
}
