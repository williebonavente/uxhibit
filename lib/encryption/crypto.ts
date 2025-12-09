// crypto.ts
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function deriveKey(passphrase: string, saltB64: string) {
  const passBytes = textEncoder.encode(passphrase);
  const salt = base64ToBytes(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 210000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(plaintext)
  );
  // pack iv + ciphertext as base64
  const packed = new Uint8Array(iv.byteLength + cipher.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher), iv.byteLength);
  return bytesToBase64(packed);
}

export async function decryptString(key: CryptoKey, packedB64: string): Promise<string> {
  const packed = base64ToBytes(packedB64);
  const iv = packed.slice(0, 12);
  const data = packed.slice(12);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return textDecoder.decode(new Uint8Array(plainBuf));
}

// Utilities
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}