import {BASE_URL} from '../config';

export async function login(username, password) {
  const body = new URLSearchParams({username, password}).toString();
  const response = await fetch(`${BASE_URL}/appointment-system/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
    credentials: 'include',
  });
  const text = await response.text();
  if (/Login Failed|Đăng nhập thất bại|<p id="error"[^>]*>[^<]+/.test(text)) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }
  if (!/Administrator Login Success|id="Role" value="1"/.test(text)) {
    const sessionCheck = await fetch(`${BASE_URL}/maintain/maintainUser`, {
      credentials: 'include',
    });
    const sessionHtml = await sessionCheck.text();
    if (
      sessionCheck.status === 404 ||
      /id="signform"|window\.location\.href\s*=\s*"\/appointment-system"|>Login Failed</.test(sessionHtml)
    ) {
      throw new Error('Tài khoản không có quyền quản lý.');
    }
  }
  return {username, role: 'manager'};
}
