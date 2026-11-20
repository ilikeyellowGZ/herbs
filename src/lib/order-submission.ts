const storageKey = 'herby-order-attempt';
let memory: { fingerprint: string; key: string } | null = null;

// Retain a retry key across reloads without persisting contact/address fields.
export async function orderSubmissionKey(payload: unknown) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  try { const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); if (saved?.fingerprint === fingerprint && typeof saved.key === 'string') memory = saved; } catch { /* In-memory retries remain available when storage is blocked. */ }
  if (memory?.fingerprint !== fingerprint) memory = { fingerprint, key: crypto.randomUUID() };
  try { sessionStorage.setItem(storageKey, JSON.stringify(memory)); } catch { /* Storage is optional. */ }
  return memory!.key;
}
export function clearOrderSubmission() { memory = null; try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ } }
