import {BASE_URL, REQUEST_TIMEOUT} from '../config';

export async function request(path: string, options: any = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {'Content-Type': 'application/json', ...(options.headers || {})},
      credentials: 'include',
      signal: controller.signal,
    });
    const text = await response.text();
    if (response.status === 404) {
      throw new Error('Không tìm thấy route BE. Kiểm tra lại đường dẫn hoặc BE chưa cập nhật.');
    }
    if (response.status >= 300 && response.status < 400) {
      throw new Error('Phiên BE đã hết hạn. Vui lòng khởi động lại app.');
    }
    let body;
    try { body = text ? JSON.parse(text) : null; } catch {
      throw new Error('BE không trả dữ liệu hợp lệ cho yêu cầu này.');
    }
    if (!response.ok) throw new Error(body?.msg || `Yêu cầu thất bại (${response.status}).`);
    if (body?.code !== undefined && body.code !== '0') throw new Error(body.msg || 'Backend từ chối yêu cầu.');
    return body?.data === undefined ? body : body.data;
  } finally {
    clearTimeout(timer);
  }
}

export const get = (path: string) => request(path);
export const post = (path: string, body: any) => request(path, {method: 'POST', body: JSON.stringify(body)});
export const put = (path: string, body: any) => request(path, {method: 'PUT', body: JSON.stringify(body)});
export const del = (path: string) => request(path, {method: 'DELETE'});

export async function requestText(path: string, options: any = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Yêu cầu thất bại (${response.status}).`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export function postForm(path: string, body: Record<string, string | number | boolean | null | undefined>) {
  const params = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    if (value !== null && value !== undefined) params.append(key, String(value));
  });
  return requestText(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params.toString(),
  });
}
