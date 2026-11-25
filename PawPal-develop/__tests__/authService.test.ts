import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { onValue, set } from 'firebase/database';
import { observeAuth, register } from '../src/services/authService';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  set: jest.fn(),
  ref: jest.fn((_database, path) => path),
}));
jest.mock('../src/services/firebaseService', () => ({
  getFirebase: () => mockClients,
}));
const mockClients = {
  auth: {
    currentUser: null as {
      uid: string;
      email: string;
      displayName: string;
    } | null,
  },
  database: {},
};

test('role comes from the trusted role node and old listeners stop on account switch', () => {
  const stopAuth = jest.fn();
  const stopRole = jest.fn();
  let authChanged: (user: unknown) => void;
  const roleCallbacks: ((snapshot: { val: () => unknown }) => void)[] = [];
  (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
    authChanged = callback;
    return stopAuth;
  });
  (onValue as jest.Mock).mockImplementation((_ref, callback) => {
    roleCallbacks.push(callback);
    return stopRole;
  });
  const next = jest.fn();
  const stop = observeAuth(next, jest.fn());
  mockClients.auth.currentUser = {
    uid: 'alice',
    email: 'alice@pawpal.test',
    displayName: 'Alice',
  };
  authChanged!(mockClients.auth.currentUser);
  roleCallbacks[0]({ val: () => null });
  expect(next).toHaveBeenLastCalledWith(
    expect.objectContaining({ uid: 'alice', role: 'customer' }),
  );
  mockClients.auth.currentUser = {
    uid: 'bob',
    email: 'bob@pawpal.test',
    displayName: 'Bob',
  };
  authChanged!(mockClients.auth.currentUser);
  expect(stopRole).toHaveBeenCalledTimes(1);
  roleCallbacks[1]({ val: () => 'manager' });
  expect(next).toHaveBeenLastCalledWith(
    expect.objectContaining({ uid: 'bob', role: 'manager' }),
  );
  roleCallbacks[0]({ val: () => 'manager' });
  expect(next).toHaveBeenLastCalledWith(
    expect.objectContaining({ uid: 'bob' }),
  );
  stop();
  expect(stopRole).toHaveBeenCalledTimes(2);
  expect(stopAuth).toHaveBeenCalledTimes(1);
  next.mockClear();
  authChanged!(null);
  roleCallbacks[1]({ val: () => 'manager' });
  expect(next).not.toHaveBeenCalled();
});

test('registration stores the canonical Firebase email required by database rules', async () => {
  const user = { uid: 'alice', email: 'alice@pawpal.test' };
  (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user });
  await register(' Alice ', ' ALICE@pawpal.test ', 'password123');
  expect(updateProfile).toHaveBeenCalledWith(user, { displayName: 'Alice' });
  expect(set).toHaveBeenCalledWith('users/alice', {
    name: 'Alice',
    email: 'alice@pawpal.test',
  });
});
