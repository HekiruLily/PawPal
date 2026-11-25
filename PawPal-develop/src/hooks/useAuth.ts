import { useEffect, useRef, useState } from 'react';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { errorMessage } from '../utils/errors';

export function useAuth() {
  const auth = useAuthContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(true);
  const performing = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  async function perform(task: () => Promise<unknown>) {
    if (performing.current) {
      return false;
    }
    performing.current = true;
    setBusy(true);
    setError('');
    try {
      await task();
      return true;
    } catch (reason) {
      if (live.current) {
        setError(errorMessage(reason));
      }
      return false;
    } finally {
      performing.current = false;
      if (live.current) {
        setBusy(false);
      }
    }
  }
  return {
    ...auth,
    busy,
    error: error || auth.error,
    login: (email: string, password: string) =>
      perform(async () => {
        if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) {
          throw new Error('Nhập email hợp lệ và mật khẩu.');
        }
        await auth.login(email, password);
      }),
    register: (
      name: string,
      email: string,
      password: string,
      confirm: string,
    ) =>
      perform(async () => {
        if (!name.trim() || name.trim().length > 60) {
          throw new Error('Họ tên từ 1 đến 60 ký tự.');
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
          throw new Error('Nhập email hợp lệ.');
        }
        if (password.length < 6 || password !== confirm) {
          throw new Error('Mật khẩu từ 6 ký tự và phải khớp phần xác nhận.');
        }
        await auth.register(name, email, password);
      }),
    resetPassword: (email: string) =>
      perform(async () => {
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
          throw new Error('Nhập email hợp lệ.');
        }
        await auth.resetPassword(email);
      }),
    logout: () => perform(auth.logout),
  };
}
