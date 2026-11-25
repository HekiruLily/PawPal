import { backendRequest } from '../src/api/backendSession';
import { request } from '../src/api/httpClient';
jest.mock('../src/api/httpClient', () => ({
  request: jest.fn(),
}));
jest.mock('../src/services/firebaseService', () => ({
  getFirebase: () => mockClients,
}));
const mockToken = jest.fn();
const mockClients: {
  auth: { currentUser: null | { uid: string; getIdToken: typeof mockToken } };
} = {
  auth: { currentUser: null },
};
beforeEach(() => {
  jest.resetAllMocks();
  mockToken.mockResolvedValue('firebase-id-token');
  mockClients.auth.currentUser = { uid: 'alice', getIdToken: mockToken };
});
test('uses Firebase token and omits legacy cookies, overriding caller authorization', async () => {
  (request as jest.Mock).mockResolvedValue(['own appointment']);
  await expect(
    backendRequest('/Appointment/api/appointments', {
      headers: { Authorization: 'Bearer wrong-user' },
    }),
  ).resolves.toEqual(['own appointment']);
  expect(request).toHaveBeenCalledWith('/Appointment/api/appointments', {
    credentials: 'omit',
    headers: { Authorization: 'Bearer firebase-id-token' },
  });
});
test('account switching while checking the session cancels the request', async () => {
  mockToken.mockImplementation(async () => {
    mockClients.auth.currentUser = { uid: 'bob', getIdToken: mockToken };
    return 'old-token';
  });
  await expect(backendRequest('/Appointment/api/appointments')).rejects.toThrow(
    'đã thay đổi',
  );
  expect(request).not.toHaveBeenCalled();
});
test('discards a response after account switching and preserves server manager denial', async () => {
  (request as jest.Mock).mockImplementation(async () => {
    mockClients.auth.currentUser = null;
    return ['old data'];
  });
  await expect(
    backendRequest('/maintain/api/reports', {}, true),
  ).rejects.toThrow('đã thay đổi');
  mockClients.auth.currentUser = { uid: 'alice', getIdToken: mockToken };
  (request as jest.Mock).mockRejectedValue(new Error('Cần quyền quản lý.'));
  await expect(
    backendRequest('/maintain/api/reports', {}, true),
  ).rejects.toThrow('Cần quyền quản lý');
});
