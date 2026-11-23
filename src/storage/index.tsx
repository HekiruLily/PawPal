import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from './keys';

export async function readUser() {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return value ? JSON.parse(value) : null;
}

export function writeUser(user) {
  return AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearSession() {
  return AsyncStorage.removeItem(STORAGE_KEYS.USER);
}
