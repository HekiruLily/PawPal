import {
  searchText,
  validatePet,
  validateService,
} from '../src/utils/validators';

const pet = {
  name: 'Bơ',
  species: 'Chó',
  breed: '',
  age: '0',
  size: 'Vừa',
  gender: 'Không rõ',
  notes: '',
  imageURL: '',
};
const service = {
  name: 'Tắm',
  category: 'Tắm',
  description: '',
  price: '1',
  duration: '5',
  imageURL: '',
};
test('accepts newborn pets and positive service prices, without mandatory photos', () => {
  expect(validatePet(pet)).toEqual({});
  expect(validateService(service)).toEqual({});
});
test.each(['', '-1', '31', '1.5', 'abc'])('rejects invalid pet age %s', age => {
  expect(validatePet({ ...pet, age })).toHaveProperty('age');
});
test.each(['0', '-1', '1000000000', '1.5', '1e3', 'abc', ''])(
  'rejects invalid price %s',
  price => {
    expect(validateService({ ...service, price })).toHaveProperty('price');
  },
);
test.each(['0', '4', '601', '5.5'])('rejects invalid duration %s', duration => {
  expect(validateService({ ...service, duration })).toHaveProperty('duration');
});
test('rejects a local photo URI and blank names', () => {
  expect(
    validatePet({ ...pet, imageURL: 'file:///photo.jpg', name: '   ' }),
  ).toEqual(
    expect.objectContaining({
      name: expect.any(String),
      imageURL: expect.any(String),
    }),
  );
});
test('Vietnamese search ignores case, accents and outer whitespace', () => {
  expect(searchText('  ĐƯỜNG Cắt Tỉa ')).toBe('duong cat tia');
});
