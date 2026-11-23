import {useCallback, useEffect, useState} from 'react';
import {managerApi} from '../api/managerApi';
import {useToast} from '../context/ToastContext';

export function useManagerStats(year = new Date().getFullYear()) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const {showError} = useToast();
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await managerApi.getDashboard(year)); }
    catch (error) { showError(error.message); }
    finally { setLoading(false); }
  }, [showError, year]);
  useEffect(() => { load(); }, [load]);
  return {data, loading, reload: load};
}
