import {get, postForm, requestText} from './httpClient';
import {login} from './authApi';

export type Groomer = {
  gid: number;
  name: string;
  gender: string;
  imageURL?: string;
  rank: number;
  phoneNumber?: string;
  address?: string;
  description?: string;
  title?: string;
  experienceYears?: number;
  specialties?: string;
  acceptingAppointments?: boolean;
  upcomingAppointmentCount?: number;
};

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

function splitStoredDescription(value: string | undefined): {address: string; description: string} {
  const text = (value || '').trim();
  if (!text.startsWith('Địa chỉ:')) return {address: '', description: text};
  const lines = text.split(/\r?\n/);
  return {
    address: lines[0].replace(/^Địa chỉ:\s*/i, '').trim(),
    description: lines.slice(1).join('\n').trim(),
  };
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

function parseGroomerHtml(html: string): Groomer[] {
  return (html.match(/<tr[\s\S]*?<\/tr>/gi) || []).map(row => {
    const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi))
      .map(match => decodeHtml(match[1].replace(/<[^>]+>/g, '')));
    if (cells.length < 7) return null;

    const gidIndex = /^\d+$/.test(cells[0]) ? 0 : /^\d+$/.test(cells[1] || '') ? 1 : -1;
    if (gidIndex < 0) return null;
    const gid = Number(cells[gidIndex]);
    if (!Number.isFinite(gid)) return null;

    const nameIndex = gidIndex + 1;
    const genderIndex = gidIndex + 2;
    const imageIndex = gidIndex + 3;
    const rankIndex = gidIndex + 4;
    const phoneIndex = gidIndex + 5;
    const descriptionIndex = gidIndex + 6;
    const stored = splitStoredDescription(cells[descriptionIndex]);
    return {
      gid,
      name: cells[nameIndex] || '',
      gender: cells[genderIndex] || '',
      imageURL: cells[imageIndex] || '/assets/images/no-user.png',
      rank: Number(cells[rankIndex]) || 0,
      phoneNumber: cells[phoneIndex] || '',
      address: stored.address,
      description: stored.description,
    };
  }).filter((item: Groomer | null): item is Groomer => item !== null);
}

async function loadGroomerPage(keyword = ''): Promise<Groomer[]> {
  await ensureManagerSession();
  const data = await get('/maintain/api/groomers') as Groomer[];
  const normalized = (Array.isArray(data) ? data : []).map(item => ({
    ...item,
    acceptingAppointments: item.acceptingAppointments !== false,
    upcomingAppointmentCount: item.upcomingAppointmentCount ?? 0,
  }));
  if (!keyword.trim()) return normalized;
  const lowerKeyword = keyword.trim().toLowerCase();
  return normalized.filter(item =>
    item.name?.toLowerCase().includes(lowerKeyword) ||
    item.title?.toLowerCase().includes(lowerKeyword) ||
    item.specialties?.toLowerCase().includes(lowerKeyword),
  );
}

const groomerForm = (groomer: Partial<Groomer>) => ({
  name: groomer.name || '',
  gender: groomer.gender || '',
  imageURL: groomer.imageURL || '/assets/images/no-user.png',
  rank: groomer.rank ?? 0,
  phoneNumber: groomer.phoneNumber || '',
  title: groomer.title || '',
  experienceYears: groomer.experienceYears ?? 0,
  specialties: groomer.specialties || '',
  acceptingAppointments: groomer.acceptingAppointments !== false,
  description: [
    groomer.address?.trim() ? `Địa chỉ: ${groomer.address.trim()}` : '',
    groomer.description?.trim() || '',
  ].filter(Boolean).join('\n'),
});

export const groomerApi = {
  list: () => loadGroomerPage(),
  search: (keyword: string) => loadGroomerPage(keyword),
  getById: (gid: number) =>
    get(`/appointment-system/manager/groomerList/view?gid=${gid}`),
  create: async (groomer: Partial<Groomer>) => {
    await ensureManagerSession();
    const response = await postForm('/maintain/updateGroomer', groomerForm(groomer));
    if (!response || typeof response !== 'string') {
      throw new Error('BE không phản hồi kết quả lưu nhân viên.');
    }
    return {
      gid: -1,
      name: groomer.name || '',
      gender: groomer.gender || '',
      imageURL: groomer.imageURL || '/assets/images/no-user.png',
      rank: groomer.rank ?? 0,
      phoneNumber: groomer.phoneNumber || '',
      address: groomer.address || '',
      description: groomer.description || '',
    };
  },
  update: async (groomer: Partial<Groomer>) => {
    await ensureManagerSession();
    await postForm('/maintain/updateGroomer', groomerForm(groomer));
    return groomer as Groomer;
  },
  remove: async (gid: number) => {
    await ensureManagerSession();
    await postForm('/maintain/deleteGroomer', {gid});
    const all = await loadGroomerPage();
    if (all.some(item => item.gid === gid)) throw new Error('Nhân viên chưa được xóa.');
    return true;
  },
  setAccepting: async (gid: number, accepting: boolean) => {
    await ensureManagerSession();
    await postForm(`/maintain/api/groomers/${gid}/accepting`, {accepting});
    return true;
  },
};
