const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const session = { get token() { return localStorage.getItem('dance-token') || ''; }, set token(value: string) { localStorage.setItem('dance-token', value); }, clear() { localStorage.removeItem('dance-token'); } };
export async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}), ...init.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || '请求失败，请稍后重试'); }
  return response.status === 204 ? null : response.json();
}
