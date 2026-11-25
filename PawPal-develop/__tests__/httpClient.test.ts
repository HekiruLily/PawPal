import { request } from '../src/api/httpClient';
jest.mock('../src/config', () => ({
  BASE_URL: 'http://localhost:8080',
  REQUEST_TIMEOUT: 15000,
}));
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
test('keeps an ownership/not-found API error instead of claiming the backend route is missing', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 404,
    ok: false,
    text: async () =>
      JSON.stringify({ code: '404', msg: 'Không tìm thấy thú cưng của bạn.' }),
  });
  await expect(
    request('/Appointment/api/quote', { credentials: 'omit' }),
  ).rejects.toThrow('Không tìm thấy thú cưng của bạn.');
  expect(globalThis.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/Appointment/api/quote',
    expect.objectContaining({ credentials: 'omit' }),
  );
});
test('HTML 404 still explains the missing backend route', async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue({
      status: 404,
      ok: false,
      text: async () => '<html>not found</html>',
    });
  await expect(request('/missing')).rejects.toThrow('Không tìm thấy route BE');
});
