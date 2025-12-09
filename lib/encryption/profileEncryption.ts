import { decryptString, deriveKey, encryptString } from "./crypto";

export async function getUserCryptoKey(userId: string, saltB64: string) {
  const passphrase = process.env.PROFILE_ENCRYPTION_PASSPHRASE!;
  // Optionally include userId in passphrase derivation for stronger per‑user isolation
  return deriveKey(passphrase + ":" + userId, saltB64);
}

export async function encryptProfileFields(
  key: CryptoKey,
  profile: { first_name?: string | null; middle_name?: string | null; last_name?: string | null; bio?: string | null }
) {
  return {
    first_name: profile.first_name ? await encryptString(key, profile.first_name) : null,
    middle_name: profile.middle_name ? await encryptString(key, profile.middle_name) : null,
    last_name: profile.last_name ? await encryptString(key, profile.last_name) : null,
    bio: profile.bio ? await encryptString(key, profile.bio) : null,
  };
}

export async function decryptProfileFields(
  key: CryptoKey,
  profile: { first_name?: string | null; middle_name?: string | null; last_name?: string | null; bio?: string | null }
) {
  return {
    ...profile,
    first_name: profile.first_name ? await decryptString(key, profile.first_name) : null,
    middle_name: profile.middle_name ? await decryptString(key, profile.middle_name) : null,
    last_name: profile.last_name ? await decryptString(key, profile.last_name) : null,
    bio: profile.bio ? await decryptString(key, profile.bio) : null,
  };
}