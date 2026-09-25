/**
 * Secure password hashing and verification using standard Web Crypto API (SHA-256 with salt)
 * Cross-platform: Works in Node.js (Next.js server-side API routes) and client browsers.
 */

const PASSWORD_SALT = 'plotify_salt_bangladesh_2026';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}::${PASSWORD_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  if (!password || !expectedHash) return false;
  const hash = await hashPassword(password);
  return hash === expectedHash;
}

// Pre-computed SHA-256 hashes for default seeded accounts
export const DEFAULT_CREDENTIALS: Record<string, string> = {
  // Plotify@Support
  'support@plotify.store': '1ec873a5d279b078a15a6c673441f8566c35506eef88bb90fb5e0f048bbec0c1',
  // Plotify@Business
  'business@plotify.com.bd': 'be03946c132d1a34687223f5f9da9086b3ea9d8c4a810cb587bbaa1046b53399',
  // Plotify@Personal
  'tahmina@example.com': '296ec3491403144bcc631bb7c2a5e2709745262c20c4fd964548428b2ceac401',
  'tanvir.hossain@gmail.com': '296ec3491403144bcc631bb7c2a5e2709745262c20c4fd964548428b2ceac401',
};
