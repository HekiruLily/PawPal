import { onValue, push, ref, remove, set } from 'firebase/database';
import { getFirebase } from './firebaseService';
import { validatePet } from '../utils/validators';

export type PetDraft = {
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  gender: string;
  notes: string;
  imageURL: string;
};
export type Pet = Omit<PetDraft, 'age'> & {
  id: string;
  ownerId: string;
  age: number;
};
function owner() {
  const { auth, database } = getFirebase();
  if (!auth.currentUser) {
    throw new Error('Vui lòng đăng nhập lại.');
  }
  return { uid: auth.currentUser.uid, database };
}
export function observePets(
  next: (items: Pet[]) => void,
  fail: (error: unknown) => void,
) {
  const { uid, database } = owner();
  return onValue(
    ref(database, `pets/${uid}`),
    snapshot => {
      const items: Pet[] = [];
      snapshot.forEach(child => {
        items.push({ ...child.val(), id: child.key! });
      });
      next(items);
    },
    fail,
  );
}
export async function savePet(draft: PetDraft, id?: string) {
  const errors = validatePet(draft);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors)[0]);
  }
  const { uid, database } = owner();
  const target = id
    ? ref(database, `pets/${uid}/${id}`)
    : push(ref(database, `pets/${uid}`));
  const value = {
    ownerId: uid,
    name: draft.name.trim(),
    species: draft.species,
    breed: draft.breed.trim(),
    notes: draft.notes.trim(),
    age: Number(draft.age),
    size: draft.size,
    gender: draft.gender,
    imageURL: draft.imageURL,
  };
  await set(target, value);
  return { ...value, id: target.key! };
}
export async function deletePet(id: string) {
  const { uid, database } = owner();
  await remove(ref(database, `pets/${uid}/${id}`));
}
