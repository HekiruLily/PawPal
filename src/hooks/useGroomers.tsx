import {useCallback, useEffect, useState} from 'react';
import {Groomer, groomerApi} from '../api/groomerApi';
import {useToast} from '../context/ToastContext';

export function useGroomers() {
  const [items, setItems] = useState<Groomer[]>([]);
  const [loading, setLoading] = useState(true);
  const {showError} = useToast();
  const load = useCallback(async (keyword = '') => {
    setLoading(true);
    try {
      setItems(await (keyword ? groomerApi.search(keyword) : groomerApi.list()));
    } catch (error: any) {
      setItems([]);
      showError(error.message);
    }
    finally { setLoading(false); }
  }, [showError]);
  useEffect(() => { load(); }, [load]);
  const create = useCallback(async (groomer: Partial<Groomer>) => {
    await groomerApi.create(groomer);
    await load();
  }, [load]);
  const update = useCallback(async (groomer: Partial<Groomer>) => {
    await groomerApi.update(groomer);
    await load();
  }, [load]);
  const remove = useCallback(async (gid: number) => {
    await groomerApi.remove(gid);
    await load();
  }, [load]);
  const setAccepting = useCallback(async (gid: number, accepting: boolean) => {
    await groomerApi.setAccepting(gid, accepting);
    await load();
  }, [load]);
  return {items, loading, reload: load, create, update, remove, setAccepting};
}
