import { DEFAULT_CREDENTIALS } from './auth-crypto';
import { INITIAL_USERS } from './data/store';
import { User } from './types';

// Global server-side registry (persists across API requests during runtime)
const globalStore = global as unknown as {
  __plotifyServerUsers?: Map<string, User>;
  __plotifyServerCredentials?: Map<string, string>;
};

if (!globalStore.__plotifyServerUsers) {
  globalStore.__plotifyServerUsers = new Map(
    INITIAL_USERS.map(u => [u.email.toLowerCase(), u])
  );
}

if (!globalStore.__plotifyServerCredentials) {
  globalStore.__plotifyServerCredentials = new Map(
    Object.entries(DEFAULT_CREDENTIALS).map(([email, hash]) => [email.toLowerCase(), hash])
  );
}

export function saveServerUser(user: User, passwordHash: string) {
  globalStore.__plotifyServerUsers?.set(user.email.toLowerCase(), user);
  globalStore.__plotifyServerCredentials?.set(user.email.toLowerCase(), passwordHash);
}

export function getServerUserByEmail(email: string): User | undefined {
  return globalStore.__plotifyServerUsers?.get(email.toLowerCase());
}

export function getServerCredentialHash(email: string): string | undefined {
  return globalStore.__plotifyServerCredentials?.get(email.toLowerCase());
}
