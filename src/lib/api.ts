export async function httpGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, method: init?.method ?? "GET" });
  const data = (await res.json().catch(() => null)) as T;
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: string }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function httpPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T;
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: string }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** Map /bankapi/* to same-origin /api/bankapi/* (see next.config rewrites). */
export function bankApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/bankapi/")) return `/api${normalized}`;
  if (normalized.startsWith("/api/bankapi/")) return normalized;
  return normalized;
}

export async function bankApiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return httpGet<T>(bankApiPath(path), init);
}

export async function bankApiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return httpPost<T>(bankApiPath(path), body, init);
}