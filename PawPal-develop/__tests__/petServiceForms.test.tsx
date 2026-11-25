import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { PetForm } from '../src/components/PetForm';
import { ServiceForm } from '../src/components/ServiceForm';
import { ActionButton } from '../src/components/ActionButton';
import { servicePrice } from '../src/utils/currency';

jest.mock('react-native-vector-icons/Feather', () => 'Feather');

jest.setTimeout(15000);

const common = {
  busy: false,
  error: '',
  uploading: false,
  uploadError: '',
  onChooseImage: jest.fn(),
};
const service = {
  id: 's1',
  name: 'Tắm & sấy khô',
  category: 'Tắm',
  description: 'Sấy nhiệt thấp',
  price: 180000,
  duration: 60,
  active: true,
  imageURL: '',
  revision: 2,
  discountPercent: 15,
  promotionStart: '2026-11-01',
  promotionEnd: '2026-11-30',
};

test('pet form validates age and saves the selected species with an optional breed', async () => {
  const save = jest.fn();
  let tree: Renderer.ReactTestRenderer;
  await act(() => {
    tree = Renderer.create(<PetForm {...common} onSubmit={save} />);
  });
  const field = (label: string) =>
    tree!.root
      .findAllByType(TextInput)
      .find(node => node.props.accessibilityLabel === label)!;
  await act(() => {
    field('Tên thú cưng').props.onChangeText('Bơ');
    field('Tuổi').props.onChangeText('1.5');
  });
  await act(() => tree!.root.findByType(ActionButton).props.onPress());
  expect(save).not.toHaveBeenCalled();
  expect(JSON.stringify(tree!.toJSON())).toContain('số tuổi nguyên');
  await act(() => field('Tuổi').props.onChangeText('3'));
  await act(() =>
    tree!.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'combobox' &&
          node.props.accessibilityLabel === 'Loài',
      )[0]
      .props.onPress(),
  );
  await act(() =>
    tree!.root
      .findAll(
        node =>
          node.props.accessibilityRole === 'radio' &&
          node.props.accessibilityLabel === 'Mèo',
      )[0]
      .props.onPress(),
  );
  await act(() => tree!.root.findByType(ActionButton).props.onPress());
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Bơ',
      age: '3',
      breed: '',
      species: 'Mèo',
      gender: 'Cái',
    }),
  );
  await act(() => tree!.unmount());
});

test('inline price editor rejects zero then saves both fields while preserving service information', async () => {
  const save = jest.fn(),
    toggle = jest.fn();
  let tree: Renderer.ReactTestRenderer;
  await act(() => {
    tree = Renderer.create(
      <ServiceForm
        {...common}
        service={service}
        pricingOnly
        onSubmit={save}
        onToggle={toggle}
      />,
    );
  });
  const inputs = () => tree!.root.findAllByType(TextInput);
  const submit = () =>
    tree!.root
      .findAllByType(ActionButton)
      .find(node => node.props.title === 'Lưu thay đổi')!;
  await act(() => inputs()[0].props.onChangeText('0'));
  await act(() => submit().props.onPress());
  expect(save).not.toHaveBeenCalled();
  await act(() => {
    inputs()[0].props.onChangeText('210000');
    inputs()[1].props.onChangeText('90');
  });
  await act(() => submit().props.onPress());
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      name: service.name,
      description: service.description,
      price: '210000',
      duration: '90',
      active: true,
    }),
  );
  await act(() =>
    tree!.root
      .findAllByType(ActionButton)
      .find(node => node.props.title === 'Tạm ngưng')!
      .props.onPress(),
  );
  expect(toggle).toHaveBeenCalledTimes(1);
  await act(() => tree!.unmount());
});

test('promotion uses shop date, floors the discount and includes the last day', () => {
  const offer = { ...service, price: 180001 };
  expect(servicePrice(offer, new Date('2026-11-30T16:59:59Z'))).toEqual({
    discount: 27000,
    total: 153001,
  });
  expect(servicePrice(offer, new Date('2026-11-30T17:00:00Z'))).toEqual({
    discount: 0,
    total: 180001,
  });
  expect(
    servicePrice({ ...offer, active: false }, new Date('2026-11-10T00:00:00Z'))
      .discount,
  ).toBe(0);
  expect(
    servicePrice(
      { ...offer, promotionStart: undefined },
      new Date('2026-11-10T00:00:00Z'),
    ).discount,
  ).toBe(0);
});
