import { getUserCryptoKey, encryptProfileFields } from "@/lib/encryption/profileEncryption";

function generateSaltB64() {
  const bytes = new Uint8Array(16); 
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}

export async function updateProfile(supabase: any, userId: string, updates: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  gender?: string | null;
  birthday?: string | null;
  username?: string | null;
  role?: string | null;
  
}) {
  const { data: existing, error } = await supabase
    .from("profiles")
    .select("id, encryption_salt")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const encryption_salt = existing?.encryption_salt ?? generateSaltB64();

  const key = await getUserCryptoKey(userId, encryption_salt);

  const encrypted = await encryptProfileFields(key, updates);

  // 4. Save encrypted data + salt
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      ...encrypted,
      encryption_salt,
    })
    .eq("id", userId);

  if (updateError) throw updateError;
}