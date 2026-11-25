export {
  login,
  register,
  logout,
  resetPassword,
  observeAuth,
} from '../services/authService';
export {
  configureAuthStorage,
  isFirebaseConfigured,
} from '../services/firebaseService';
export type { AuthUser } from '../services/authService';
