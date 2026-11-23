import {NativeModules, Platform} from 'react-native';

declare const process: {env?: {[key: string]: string | undefined}};

function metroHost(): string | null {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL) return null;
  try {
    const url = new URL(scriptURL);
    return url.hostname;
  } catch {
    return null;
  }
}

const configuredUrl = typeof process !== 'undefined' ? process.env?.REACT_NATIVE_API_URL : undefined;
const host = configuredUrl?.trim()
  || metroHost()
  || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const BASE_URL = configuredUrl?.trim()
  || `http://${host}:8080`;
export const REQUEST_TIMEOUT = 15000;
