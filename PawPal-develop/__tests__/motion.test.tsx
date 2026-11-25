import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated, Modal, Text } from 'react-native';
import { BottomSheetModal } from '../src/components/BottomSheetModal';
import { useReducedMotion } from '../src/hooks/useReducedMotion';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.setTimeout(20000);

afterEach(() => jest.restoreAllMocks());

test('a closing sheet keeps its form mounted until the animation completes', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  let finish: (result: { finished: boolean }) => void;
  jest.spyOn(Animated, 'parallel').mockImplementation(() => ({
    start: callback => {
      finish = callback!;
    },
    stop: jest.fn(),
    reset: jest.fn(),
  }));
  const close = jest.fn();
  let tree: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <BottomSheetModal visible title="Sửa thú cưng" onClose={close}>
        <Text>Form đang sửa</Text>
      </BottomSheetModal>,
    );
  });
  await act(() =>
    tree!.update(
      <BottomSheetModal visible={false} title="" onClose={close}>
        {null}
      </BottomSheetModal>,
    ),
  );
  expect(tree!.root.findByType(Modal).props.visible).toBe(true);
  expect(JSON.stringify(tree!.toJSON())).toContain('Form đang sửa');
  await act(() => finish({ finished: true }));
  expect(tree!.root.findByType(Modal).props.visible).toBe(false);
  await act(() =>
    tree!.update(
      <BottomSheetModal visible busy title="Thêm thú cưng" onClose={close}>
        <Text>Form mới</Text>
      </BottomSheetModal>,
    ),
  );
  await act(() => tree!.root.findByType(Modal).props.onRequestClose());
  expect(close).not.toHaveBeenCalled();
  expect(JSON.stringify(tree!.toJSON())).toContain('Form mới');
  await act(() => tree!.unmount());
});

test('reduced motion follows the OS preference and removes its listener', async () => {
  const remove = jest.fn();
  let change: (value: boolean) => void;
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_name, listener) => {
      change = listener;
      return { remove };
    });
  let reduced: boolean;
  function Probe() {
    reduced = useReducedMotion();
    return null;
  }
  let tree: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<Probe />);
  });
  expect(reduced!).toBe(true);
  await act(() => change(false));
  expect(reduced!).toBe(false);
  await act(() => tree!.unmount());
  expect(remove).toHaveBeenCalledTimes(1);
});
