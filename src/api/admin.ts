import { useQuery } from '@tanstack/react-query';

import { API_BASE, SITE } from '@/api/client';
import { basicHeaders, send } from '@/api/submit';
import type { Credentials } from '@/api/types';

/**
 * Admin mode (inc/mobile-admin.php in the theme): the KOP Tools list, a WordPress cookie session for the
 * web view, and "sign out everywhere". Every route needs an administrator's application password.
 */
export type AdminTool = { category: string; title: string; desc: string; url: string };
export type AdminTools = { user: string; tools: AdminTool[] };

type Json = Record<string, unknown>;

function message(status: number, body: Json): string {
  if (status === 401) return 'WordPress rejected the login. Sign in again under About, Reviewer sign-in.';
  if (status === 403) return 'This account is not an administrator.';
  if (status === 404) return 'The site does not have admin mode yet.';
  return typeof body.message === 'string' && body.message ? body.message : `The site answered ${status}.`;
}

export async function fetchAdminTools(creds: Credentials, fetchImpl: typeof fetch = fetch): Promise<AdminTools> {
  const res = await send({ url: `${API_BASE}/app/tools`, method: 'GET', headers: { Accept: 'application/json', ...basicHeaders(creds) } }, fetchImpl);
  if ('network' in res) throw new Error(res.network);
  if (!res.ok) throw Object.assign(new Error(message(res.status, res.body)), { status: res.status });
  const list = Array.isArray(res.body.tools) ? (res.body.tools as Json[]) : [];
  return {
    user: String(res.body.user ?? creds.username),
    tools: list
      .map((t) => ({ category: String(t.category ?? ''), title: String(t.title ?? ''), desc: String(t.desc ?? ''), url: String(t.url ?? '') }))
      .filter((t) => t.title && t.url.startsWith(SITE)),
  };
}

/** The tools for a signed-in administrator; disabled (no data) when signed out. */
export function useAdminTools(creds: Credentials | null) {
  return useQuery({
    queryKey: ['admin-tools', creds?.username ?? ''],
    queryFn: () => fetchAdminTools(creds as Credentials),
    enabled: !!creds,
    staleTime: 10 * 60 * 1000,
    retry: (count, e) => count < 1 && !(e as { status?: number }).status,
  });
}

/** A one-use /app-login/ address that signs the web view in and lands on `redirect`. */
export async function startAdminSession(creds: Credentials, redirect: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await send(
    {
      url: `${API_BASE}/app/session`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...basicHeaders(creds) },
      body: JSON.stringify({ redirect }),
    },
    fetchImpl,
  );
  if ('network' in res) throw new Error(res.network);
  if (!res.ok || typeof res.body.url !== 'string') throw new Error(message(res.status, res.body));
  return res.body.url;
}

/** Ends every WordPress session of this account, on this phone and every other device. */
export async function signOutEverywhere(creds: Credentials, fetchImpl: typeof fetch = fetch): Promise<void> {
  const res = await send({ url: `${API_BASE}/app/signout`, method: 'POST', headers: { Accept: 'application/json', ...basicHeaders(creds) } }, fetchImpl);
  if ('network' in res) throw new Error(res.network);
  if (!res.ok) throw new Error(message(res.status, res.body));
}
