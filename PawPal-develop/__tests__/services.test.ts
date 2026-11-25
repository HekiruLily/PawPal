import {
  get,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
} from 'firebase/database';
import { deletePet, observePets, savePet } from '../src/services/petService';
import { saveService } from '../src/services/serviceService';
import { cloudinaryConfig } from '../src/services/firebaseConfig';
import { uploadImage } from '../src/services/uploadService';

jest.mock('../src/services/firebaseService', () => ({
  getFirebase: () => ({
    auth: { currentUser: { uid: 'alice' } },
    database: {},
  }),
}));
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  onValue: jest.fn(),
  ref: jest.fn((_db, path) => ({ key: 'p1', path })),
  push: jest.fn(value => ({ ...value, key: 'p1' })),
  set: jest.fn(),
  remove: jest.fn(),
  runTransaction: jest.fn(),
}));
const pet = {
  name: ' Bơ ',
  species: 'Chó',
  breed: '',
  age: '2',
  size: 'Vừa',
  gender: 'Cái',
  notes: '',
  imageURL: '',
};
const service = {
  name: 'Tắm',
  category: 'Tắm',
  description: '',
  price: '180000',
  duration: '60',
  imageURL: '',
  active: true,
};
beforeEach(() => jest.clearAllMocks());
test('scopes pet CRUD to the authenticated user, ignoring injected owner and id', async () => {
  await savePet({ ...pet, ownerId: 'bob', id: 'forged' } as typeof pet, 'p1');
  expect(ref).toHaveBeenCalledWith({}, 'pets/alice/p1');
  expect(set).toHaveBeenCalledWith(expect.anything(), {
    ...pet,
    name: 'Bơ',
    age: 2,
    ownerId: 'alice',
  });
  await deletePet('p1');
  expect(remove).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'pets/alice/p1' }),
  );
});
test('returns the Firebase unsubscribe function to callers', () => {
  const unsubscribe = jest.fn();
  (onValue as jest.Mock).mockReturnValue(unsubscribe);
  expect(observePets(jest.fn(), jest.fn())).toBe(unsubscribe);
});
test('rejects a stale service editor before starting a transaction', async () => {
  (get as jest.Mock).mockResolvedValue({
    exists: () => true,
    val: () => ({ revision: 3 }),
  });
  await expect(
    saveService(service, {
      ...service,
      id: 's1',
      price: 180000,
      duration: 60,
      revision: 2,
    }),
  ).rejects.toThrow('vừa thay đổi');
  expect(runTransaction).not.toHaveBeenCalled();
});
test('rechecks revision when a competing change arrives during the transaction', async () => {
  (get as jest.Mock).mockResolvedValue({
    exists: () => true,
    val: () => ({ revision: 2 }),
  });
  (runTransaction as jest.Mock).mockImplementation(async (_target, update) => {
    expect(update({ ...service, revision: 2 })).toEqual({
      ...service,
      price: 180000,
      duration: 60,
      revision: 3,
    });
    expect(update(null)).toEqual({
      ...service,
      price: 180000,
      duration: 60,
      revision: 3,
    });
    expect(update({ ...service, revision: 3 })).toBeUndefined();
    return { committed: false };
  });
  await expect(
    saveService(service, {
      ...service,
      id: 's1',
      price: 180000,
      duration: 60,
      revision: 2,
    }),
  ).rejects.toThrow('vừa thay đổi');
});
describe('unsigned image upload', () => {
  const runtime = globalThis as typeof globalThis & {
    FormData: typeof FormData;
  };
  const originalFetch = globalThis.fetch;
  const originalForm = runtime.FormData;
  let fields: [string, unknown][];
  beforeEach(() => {
    cloudinaryConfig.cloudName = 'test-cloud';
    cloudinaryConfig.unsignedPreset = 'test-preset';
    fields = [];
    runtime.FormData = class {
      append(key: string, value: unknown) {
        fields.push([key, value]);
      }
    } as unknown as typeof FormData;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/test/image/upload/p.jpg',
      }),
    });
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    runtime.FormData = originalForm;
    cloudinaryConfig.cloudName = '';
    cloudinaryConfig.unsignedPreset = '';
  });
  test('sends only file and unsigned preset, never an API secret', async () => {
    const image = {
      uri: 'file:///photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
      size: 100,
    };
    await expect(uploadImage(image)).resolves.toMatch(
      /^https:\/\/res.cloudinary.com\//,
    );
    expect(fields).toEqual([
      ['file', image],
      ['upload_preset', 'test-preset'],
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
      expect.objectContaining({ method: 'POST' }),
    );
  });
  test('rejects oversized files before a network call', async () => {
    await expect(
      uploadImage({
        uri: 'file:///p.jpg',
        name: 'p.jpg',
        type: 'image/jpeg',
        size: 6 * 1024 * 1024,
      }),
    ).rejects.toThrow('5 MB');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  test('rejects failed Cloudinary responses', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'bad preset' }),
    });
    await expect(
      uploadImage({
        uri: 'file:///p.jpg',
        name: 'p.jpg',
        type: 'image/jpeg',
        size: 100,
      }),
    ).rejects.toThrow('Không thể tải ảnh');
  });
});
