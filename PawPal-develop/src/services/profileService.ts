import { onValue, ref, update } from 'firebase/database';
import { updateProfile } from 'firebase/auth';
import { getFirebase } from './firebaseService';
export type UserProfile = {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
};
export function observeProfile(
  next: (value: UserProfile) => void,
  fail: (reason: unknown) => void,
) {
  const { auth, database } = getFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập lại.');
  return onValue(
    ref(database, `users/${user.uid}`),
    snapshot => {
      if (auth.currentUser?.uid !== user.uid) return;
      const data = snapshot.val() || {};
      next({
        name: data.name || user.displayName || '',
        email: user.email || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
      });
    },
    fail,
  );
}
export async function saveProfile(profile: UserProfile) {
  const { auth, database } = getFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập lại.');
  if (!profile.name.trim() || profile.name.trim().length > 60)
    throw new Error('Họ tên từ 1 đến 60 ký tự.');
  if (!/^[+\d(). -]{7,20}$/.test(profile.phoneNumber.trim()))
    throw new Error(
      'Số điện thoại từ 7 đến 20 ký tự, chỉ gồm số và dấu + ( ) . - hoặc khoảng trắng.',
    );
  if (profile.address.trim().length > 160)
    throw new Error('Địa chỉ tối đa 160 ký tự.');
  await update(ref(database, `users/${user.uid}`), {
    name: profile.name.trim(),
    email: user.email,
    phoneNumber: profile.phoneNumber.trim(),
    address: profile.address.trim(),
  });
  if (auth.currentUser?.uid === user.uid)
    await updateProfile(user, { displayName: profile.name.trim() });
}
