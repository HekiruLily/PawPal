import { getFirebase } from './firebaseService';

export async function backendIdentity() {
  const { auth } = getFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Vui lòng đăng nhập để tiếp tục.');
  const token = await user.getIdToken();
  const assertCurrent = () => {
    if (auth.currentUser?.uid !== user.uid) {
      throw new Error('Tài khoản đã thay đổi. Vui lòng thử lại.');
    }
  };
  assertCurrent();
  return { token, assertCurrent };
}
