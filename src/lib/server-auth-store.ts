import crypto from 'crypto';
import { DEFAULT_CREDENTIALS } from './auth-crypto';
import { INITIAL_USERS } from './data/store';
import { User } from './types';

export interface PasswordResetRecord {
  token: string;
  email: string;
  expiresAt: number; // timestamp in ms
  createdAt: number;
  used: boolean;
}

import fs from 'fs';
import path from 'path';

// Global server-side registry (persists across API requests during runtime)
const globalStore = global as unknown as {
  __plotifyServerUsers?: Map<string, User>;
  __plotifyServerCredentials?: Map<string, string>;
  __plotifyResetTokens?: Map<string, PasswordResetRecord>;
};

const PERSISTENCE_FILE = path.join(process.cwd(), '.plotify-users-cache.json');

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

// Load any previously persisted registered accounts
try {
  if (fs.existsSync(PERSISTENCE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(PERSISTENCE_FILE, 'utf8'));
    if (cached.users && Array.isArray(cached.users)) {
      for (const u of cached.users) {
        globalStore.__plotifyServerUsers.set(u.email.toLowerCase(), u);
      }
    }
    if (cached.credentials && typeof cached.credentials === 'object') {
      for (const [em, h] of Object.entries(cached.credentials)) {
        globalStore.__plotifyServerCredentials.set(em.toLowerCase(), h as string);
      }
    }
  }
} catch {
  // ignore
}

function persistState() {
  try {
    const users = Array.from(globalStore.__plotifyServerUsers?.values() || []);
    const credentials = Object.fromEntries(globalStore.__plotifyServerCredentials?.entries() || []);
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify({ users, credentials }, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

if (!globalStore.__plotifyResetTokens) {
  globalStore.__plotifyResetTokens = new Map();
}

export function saveServerUser(user: User, passwordHash: string) {
  globalStore.__plotifyServerUsers?.set(user.email.toLowerCase(), user);
  globalStore.__plotifyServerCredentials?.set(user.email.toLowerCase(), passwordHash);
  persistState();
}

export function getServerUserByEmail(email: string): User | undefined {
  return globalStore.__plotifyServerUsers?.get(email.toLowerCase());
}

export function getServerCredentialHash(email: string): string | undefined {
  return globalStore.__plotifyServerCredentials?.get(email.toLowerCase());
}

export function updateServerCredential(email: string, passwordHash: string) {
  globalStore.__plotifyServerCredentials?.set(email.toLowerCase(), passwordHash);
  persistState();
}

export function createPasswordResetToken(email: string, expiresInMinutes = 60): { token: string; expiresAt: number } {
  if (!globalStore.__plotifyResetTokens) {
    globalStore.__plotifyResetTokens = new Map();
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  globalStore.__plotifyResetTokens.set(token, {
    token,
    email: email.toLowerCase().trim(),
    expiresAt,
    createdAt: Date.now(),
    used: false,
  });
  return { token, expiresAt };
}

export function verifyPasswordResetToken(token: string): { valid: boolean; email?: string; error?: string } {
  if (!token || !globalStore.__plotifyResetTokens) {
    return { valid: false, error: 'Invalid or missing reset token.' };
  }
  const record = globalStore.__plotifyResetTokens.get(token);
  if (!record) {
    return { valid: false, error: 'Invalid or expired password reset link.' };
  }
  if (record.used) {
    return { valid: false, error: 'This password reset link has already been used. Please request a new one.' };
  }
  if (Date.now() > record.expiresAt) {
    return { valid: false, error: 'This password reset link has expired. Please request a new one.' };
  }
  return { valid: true, email: record.email };
}

export function consumePasswordResetToken(token: string): boolean {
  if (!globalStore.__plotifyResetTokens) return false;
  const record = globalStore.__plotifyResetTokens.get(token);
  if (record && !record.used) {
    record.used = true;
    return true;
  }
  return false;
}
