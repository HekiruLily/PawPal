import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useApiData } from '../src/hooks/useApiData';
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'alice' } }),
}));
let result: ReturnType<typeof useApiData<string>>;
function Probe({
  load,
  period,
}: {
  load: () => Promise<string>;
  period: string;
}) {
  result = useApiData(load, period);
  return null;
}
test('changing report filters discards late results and never updates after unmount', async () => {
  let finishOld: (data: string) => void;
  const old = () =>
    new Promise<string>(resolve => {
      finishOld = resolve;
    });
  const fresh = jest.fn(() => Promise.resolve('30 ngày'));
  let tree: Renderer.ReactTestRenderer;
  await act(() => {
    tree = Renderer.create(<Probe load={old} period="7" />);
  });
  await act(async () => tree!.update(<Probe load={fresh} period="30" />));
  await act(async () => finishOld!('7 ngày'));
  expect(result!.data).toBe('30 ngày');
  await act(() => tree!.unmount());
  await act(() => result!.reload());
  expect(fresh).toHaveBeenCalledTimes(1);
});
