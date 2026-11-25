import {
  get,
  onValue,
  push,
  ref,
  runTransaction,
  set,
} from 'firebase/database';
import { getFirebase } from './firebaseService';
import { validateService } from '../utils/validators';

export type ServiceDraft = {
  name: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  imageURL: string;
  active: boolean;
};
export type ServiceItem = Omit<ServiceDraft, 'price' | 'duration'> & {
  id: string;
  price: number;
  duration: number;
  revision: number;
  discountPercent?: number;
  promotionStart?: string;
  promotionEnd?: string;
};
export function observeServices(
  next: (items: ServiceItem[]) => void,
  fail: (error: unknown) => void,
) {
  return onValue(
    ref(getFirebase().database, 'services'),
    snapshot => {
      const items: ServiceItem[] = [];
      snapshot.forEach(child => {
        items.push({ ...child.val(), id: child.key! });
      });
      next(items);
    },
    fail,
  );
}
export async function saveService(draft: ServiceDraft, existing?: ServiceItem) {
  const errors = validateService(draft);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }
  const database = getFirebase().database;
  const value = {
    ...(existing?.discountPercent !== undefined
      ? { discountPercent: existing.discountPercent }
      : {}),
    ...(existing?.promotionStart
      ? { promotionStart: existing.promotionStart }
      : {}),
    ...(existing?.promotionEnd ? { promotionEnd: existing.promotionEnd } : {}),
    name: draft.name.trim(),
    category: draft.category,
    description: draft.description.trim(),
    price: Number(draft.price),
    duration: Number(draft.duration),
    active: draft.active,
    imageURL: draft.imageURL,
  };
  if (!existing) {
    const target = push(ref(database, 'services'));
    await set(target, { ...value, revision: 0 });
    return;
  }
  const target = ref(database, `services/${existing.id}`);
  // Check the editor before attempting the atomic update.
  const snapshot = await get(target);
  if (!snapshot.exists() || snapshot.val().revision !== existing.revision) {
    throw new Error(
      'Dịch vụ vừa thay đổi. Hãy đóng và mở lại form để lấy dữ liệu mới nhất.',
    );
  }
  const result = await runTransaction(
    target,
    current => {
      if (current && current.revision !== existing.revision) {
        return;
      }
      // A cold client may first receive null. Firebase retries against the server
      // hash; rules require the stored revision + 1 and forbid recreating here.
      return { ...value, revision: existing.revision + 1 };
    },
    { applyLocally: false },
  );
  if (!result.committed) {
    throw new Error(
      'Dịch vụ vừa thay đổi. Hãy đóng và mở lại form để lấy dữ liệu mới nhất.',
    );
  }
}
export async function setServiceActive(item: ServiceItem, active: boolean) {
  await saveService(
    {
      ...item,
      price: String(item.price),
      duration: String(item.duration),
      active,
    },
    item,
  );
}
