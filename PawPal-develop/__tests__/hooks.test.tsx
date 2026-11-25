import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { usePets } from '../src/hooks/usePets';
import { useServices } from '../src/hooks/useServices';
import * as petApi from '../src/api/petApi';
import * as serviceApi from '../src/api/serviceApi';
jest.mock('../src/api/petApi', () => ({ observePets: jest.fn() }));
jest.mock('../src/api/serviceApi', () => ({ observeServices: jest.fn() }));

test('pet listener is removed on account change and unmount', async () => {
  const stop = jest.fn();
  (petApi.observePets as jest.Mock).mockReturnValue(stop);
  function Probe({ uid }: { uid: string }) {
    usePets(uid);
    return null;
  }
  let tree: TestRenderer.ReactTestRenderer;
  await act(() => {
    tree = TestRenderer.create(<Probe uid="alice" />);
  });
  await act(() => tree!.update(<Probe uid="bob" />));
  expect(stop).toHaveBeenCalledTimes(1);
  await act(() => tree!.unmount());
  expect(stop).toHaveBeenCalledTimes(2);
});
test('customer sees active services and search matches Vietnamese without accents', async () => {
  let value: ReturnType<typeof useServices>;
  const stop = jest.fn();
  (serviceApi.observeServices as jest.Mock).mockImplementation(next => {
    next([
      {
        id: 's1',
        name: 'Cắt tỉa',
        category: 'Làm đẹp',
        description: '',
        active: true,
      },
      {
        id: 's2',
        name: 'Tắm',
        category: 'Tắm',
        description: '',
        active: false,
      },
    ]);
    return stop;
  });
  function Probe() {
    value = useServices();
    return null;
  }
  let tree: TestRenderer.ReactTestRenderer;
  await act(() => {
    tree = TestRenderer.create(<Probe />);
  });
  expect(value!.items.map(item => item.id)).toEqual(['s1']);
  await act(() => value!.setQuery('cat tia'));
  expect(value!.items.map(item => item.id)).toEqual(['s1']);
  await act(() => value!.setQuery('tam'));
  expect(value!.items).toEqual([]);
  await act(() => tree!.unmount());
  expect(stop).toHaveBeenCalledTimes(1);
});
