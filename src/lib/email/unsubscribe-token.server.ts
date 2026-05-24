import type { SupabaseClient } from "@supabase/supabase-js";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get or create an unsubscribe token for the given email address.
 * One token per address — reuses an existing unused token, creates a new one otherwise.
 * Caller must use a service-role Supabase client.
 */
export async function getOrCreateUnsubscribeToken(
  sb: SupabaseClient<any, any>,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();

  const { data: existing } = await sb
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();

  if (existing && !existing.used_at) return existing.token;
  if (existing && existing.used_at) return null; // suppressed/used

  const token = generateToken();
  const { error } = await sb
    .from("email_unsubscribe_tokens")
    .upsert(
      { token, email: normalized },
      { onConflict: "email", ignoreDuplicates: true },
    );
  if (error) {
    console.error("Failed to create unsubscribe token", error);
    return null;
  }

  const { data: stored } = await sb
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return stored?.token ?? null;
}
