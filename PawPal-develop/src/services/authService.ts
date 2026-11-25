import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { onValue, ref, set } from 'firebase/database';
import { getFirebase } from './firebaseService';

export type AuthUser = {
  uid: string;
  email: string;
  name: string;
  role: 'customer' | 'manager';
};
export function observeAuth(
  next: (user: AuthUser | null) => void,
  fail: (error: unknown) => void,
) {
  const { auth, database } = getFirebase();
  let disposed = false;
  let stopRole: (() => void) | undefined;
  const stopAuth = onAuthStateChanged(
    auth,
    user => {
      if (disposed) {
        return;
      }
      stopRole?.();
      stopRole = undefined;
      if (!user) {
        next(null);
        return;
      }
      stopRole = onValue(
        ref(database, `roles/${user.uid}`),
        snapshot => {
          if (!disposed && auth.currentUser?.uid === user.uid) {
            next({
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || user.email || 'Khách hàng',
              role: snapshot.val() === 'manager' ? 'manager' : 'customer',
            });
          }
        },
        error => {
          if (!disposed) {
            fail(error);
          }
        },
      );
    },
    error => {
      if (!disposed) {
        fail(error);
      }
    },
  );
  return () => {
    disposed = true;
    stopRole?.();
    stopAuth();
  };
}
export async function login(email: string, password: string) {
  const result = await signInWithEmailAndPassword(
    getFirebase().auth,
    email.trim(),
    password,
  );
  return { username: result.user.email || email, uid: result.user.uid };
}
export async function register(name: string, email: string, password: string) {
  const { auth, database } = getFirebase();
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  await updateProfile(credential.user, { displayName: name.trim() });
  await set(ref(database, `users/${credential.user.uid}`), {
    name: name.trim(),
    email: credential.user.email || email.trim(),
  });
}
export function logout() {
  return signOut(getFirebase().auth);
}
export function resetPassword(email: string) {
  return sendPasswordResetEmail(getFirebase().auth, email.trim());
}
