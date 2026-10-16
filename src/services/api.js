import { CONFIG } from '../config';

export const tokens = { access: null, refresh: null };
let onSessionExpired = () => {};
export function setSessionExpiredHandler(fn) { onSessionExpired = fn; }
export class ApiError extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

export const coldListeners = new Set();
let coldCount = 0;
function coldStartGuard() {
  let fired = false;
  const t = setTimeout(() => { fired = true; coldCount++; coldListeners.forEach((f) => f(coldCount)); }, 2500);
  return () => {
    clearTimeout(t);
    if (fired) { coldCount--; coldListeners.forEach((f) => f(coldCount)); }
  };
}

async function apiRaw(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const isForm = opts.body instanceof FormData;
  const method = (opts.method || 'GET').toUpperCase();
  let body = opts.body;
  if (!isForm && body === undefined && !['GET', 'HEAD', 'DELETE'].includes(method)) body = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (tokens.access) headers.Authorization = 'Bearer ' + tokens.access;
  return fetch(CONFIG.API_BASE + path, {
    method, headers,
    body: isForm ? opts.body : body !== undefined ? JSON.stringify(body) : undefined,
  });
}

let refreshPromise = null;
async function tryRefresh() {
  if (!tokens.refresh) return false;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(CONFIG.API_BASE + '/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refresh }),
      });
      if (!res.ok) return false;
      applyTokens(await res.json());
      return true;
    } catch { return false; } finally { refreshPromise = null; }
  })();
  return refreshPromise;
}
export function applyTokens(data) {
  tokens.access = data.accessToken || data.access_token || data.token || tokens.access;
  tokens.refresh = data.refreshToken || data.refresh_token || tokens.refresh;
}

export async function api(path, opts = {}) {
  const done = coldStartGuard();
  let res;
  try {
    res = await apiRaw(path, opts);
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. O backend pode estar iniciando (Render free tier) — tente novamente em alguns segundos.', 0);
  } finally { done(); }

  if (res.status === 401 && tokens.refresh && !opts._retried) {
    if (await tryRefresh()) return api(path, { ...opts, _retried: true });
    onSessionExpired();
    throw new ApiError('Sessão expirada. Faça login novamente.', 401);
  }
  if (!res.ok) {
    let msg = `Erro ao comunicar com o servidor (${res.status}).`;
    try { const e = await res.json(); msg = e.message || e.error || msg; } catch { /* sem corpo */ }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch { return null; }
}
