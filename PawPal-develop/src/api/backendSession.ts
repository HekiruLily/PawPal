import { request } from './httpClient';
import { backendIdentity } from '../services/backendAuthService';

// Each request carries the current Firebase identity. Backend checks the token
// and trusted role; a legacy cookie never grants rights to the mobile user.
export async function backendRequest(
  path: string,
  options: { headers?: Record<string, string>; [key: string]: unknown } = {},
  _manager = false,
) {
  const identity = await backendIdentity();
  const result = await request(path, {
    ...options,
    credentials: 'omit',
    headers: { ...options.headers, Authorization: `Bearer ${identity.token}` },
  });
  identity.assertCurrent();
  return result;
}

export function jsonBody(method: string, body: unknown) {
  return { method, body: JSON.stringify(body) };
}
