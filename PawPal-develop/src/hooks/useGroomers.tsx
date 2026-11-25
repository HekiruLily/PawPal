import { Groomer, groomerApi } from '../api/groomerApi';
import { useApiData } from './useApiData';
export function useGroomers() {
  const result = useApiData(groomerApi.list);
  async function mutate(task: Promise<unknown>) {
    await task;
    await result.reload();
  }
  return {
    ...result,
    items: result.data || [],
    create: (item: Partial<Groomer>) => mutate(groomerApi.create(item)),
    update: (item: Partial<Groomer>) => mutate(groomerApi.update(item)),
    remove: (gid: number) => mutate(groomerApi.remove(gid)),
    setAccepting: (gid: number, accepting: boolean) =>
      mutate(groomerApi.setAccepting(gid, accepting)),
  };
}
