function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  // Server-side: use localhost
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

const BASE_URL = '/api';

export function apiUrl(path: string): string {
  return `${getBaseUrl()}${path}`;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
