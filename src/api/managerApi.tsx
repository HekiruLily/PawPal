import {postForm, requestText} from './httpClient';
import {login} from './authApi';

let managerSessionPromise: Promise<{username: string}> | null = null;

async function ensureManagerSession() {
  if (!managerSessionPromise) {
    managerSessionPromise = login('manager', 'group10').catch(error => {
      managerSessionPromise = null;
      throw error;
    });
  }
  return managerSessionPromise;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableRows(html: string): string[][] {
  return (html.match(/<tr[\s\S]*?<\/tr>/gi) || []).map(row =>
    Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi))
      .map(match => decodeHtml(match[1].replace(/<[^>]+>/g, ''))),
  );
}

function assertManagerHtml(html: string) {
  if (/id="signform"|>Login Failed</.test(html) || html.includes('window.location.href = "/appointment-system"')) {
    throw new Error('Phiên quản lý không hợp lệ. Vui lòng đăng nhập lại.');
  }
}

async function loadUsers(keyword = '') {
  await ensureManagerSession();
  const html = keyword
    ? await postForm('/maintain/searchUser', {keyword})
    : await requestText('/maintain/maintainUser');
  assertManagerHtml(html);
  return tableRows(html).map(cells => {
    const uid = Number(cells[0]);
    if (!Number.isFinite(uid) || cells.length < 8) return null;
    return {
      uid,
      username: cells[1],
      password: '',
      registrationTime: cells[3],
      imageURL: cells[4],
      gender: cells[5],
      phoneNumber: cells[6],
      email: cells[7],
    };
  }).filter(Boolean);
}

async function loadAppointments(keyword = '') {
  await ensureManagerSession();
  const html = keyword
    ? await postForm('/maintain/searchAppointment', {keyword})
    : await requestText('/maintain/maintainAppointment');
  assertManagerHtml(html);
  return tableRows(html).map(cells => {
    const aid = Number(cells[0]);
    if (!Number.isFinite(aid) || cells.length < 12) return null;
    return {
      aid,
      createTime: cells[1],
      startTime: cells[2],
      status: cells[3],
      serviceName: cells[4],
      groomerName: cells[5],
      username: cells[6],
      petName: cells[7],
      finishTime: cells[8],
      cancelTime: cells[9],
      totalprice: cells[10],
    };
  }).filter(Boolean);
}

function parseJavaScriptArray(text: string): any[] {
  if (!text) return [];
  try {
    return JSON.parse(text.replace(/(\b[a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":'));
  } catch {
    return [];
  }
}

export async function getReportData(year = new Date().getFullYear()) {
  await ensureManagerSession();
  const html = await requestText(`/maintain/report?year=${year}`);
  assertManagerHtml(html);
  const appointmentBlocks = Array.from(
    html.matchAll(/let\s+appointmentsData\s*=\s*(\[[\s\S]*?\])\s*;/gi),
  );
  const appointments = parseJavaScriptArray(appointmentBlocks[0]?.[1]);
  const annual = parseJavaScriptArray(appointmentBlocks[1]?.[1]);
  const quarterly = parseJavaScriptArray(appointmentBlocks[2]?.[1]);
  return {appointments, annual, quarterly};
}

export const managerApi = {
  getDashboard: async (year = new Date().getFullYear()) => {
    const [users, appointments, report] = await Promise.all([
      loadUsers(),
      loadAppointments(),
      getReportData(year),
    ]);
    const revenue = (report.appointments || []).reduce((sum, item) => {
      const value = Number(item.totalprice ?? item.totalPrice ?? item.price ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    return {
      totalAppointments: appointments.length,
      revenue,
      pendingAppointments: appointments.filter(item =>
        String(item.status).toLowerCase().includes('pending') ||
        String(item.status).toLowerCase().includes('wait') ||
        String(item.status).toLowerCase().includes('book')).length,
      customerCount: users.length,
    };
  },
  listUsers: () => loadUsers(),
  searchUsers: keyword => loadUsers(keyword),
  getUserDetail: async uid => {
    const users = await loadUsers();
    const user = users.find(item => item.uid === Number(uid));
    if (!user) throw new Error('Không tìm thấy khách hàng.');
    return user;
  },
  listAppointments: () => loadAppointments(),
  updateAppointmentStatus: async (aid, status) => {
    await ensureManagerSession();
    await postForm('/maintain/updateAppointment', {aid, status});
    return true;
  },
  listFeedback: async () => [],
  replyFeedback: async (_id: number | string, _reply: string) => {
    throw new Error('BE hiện chưa cung cấp chức năng phản hồi bình luận.');
  },
};
