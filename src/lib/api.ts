let securityToken = '';
export function setSecurityToken(token: string) { securityToken = token; }
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options, credentials: 'same-origin',
    headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(securityToken ? { 'X-CSRF-Token': securityToken } : {}), ...options.headers },
  });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('The store service is unavailable. Please try again shortly.');
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path.startsWith('/admin')) window.dispatchEvent(new Event('owner-session-expired'));
    throw new Error(data.error || 'The request could not be completed.');
  }
  return data as T;
}
export const json = (method: string, value: unknown): RequestInit => ({ method, body: JSON.stringify(value) });
