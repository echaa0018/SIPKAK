// The only place in the frontend that calls fetch.
async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`Request to ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

export function getHealth() {
  return request<{ ok: boolean; store: string }>('/health');
}
