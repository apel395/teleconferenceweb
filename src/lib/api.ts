export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'petugas_haji' | 'kabkota' | 'kbihu' | 'staff' | 'travel' | 'konsultan' | 'pengguna' | 'pengawas';
  company_id?: string | null;
  access_version?:number; account_provisioned?:boolean;
  phone?:string;address?:string;position?:string;employee_number?:string;
};

export type AuthSession = {
  token: string;
  user: User;
};

const TOKEN_KEY = 'kemenhaj-token';
const USER_KEY = 'kemenhaj-user';

export type CacheContext={scope_key:string;revision:number;max_age_seconds:number;server_time:string;next_transition_at?:string|null};
let cacheContext:{token:string;scope:string;revision:number;until:number}|null=null;
let cacheEpoch=0;
const responseCache=new Map<string,{value:unknown;until:number}>();
const pendingReads=new Map<string,Promise<unknown>>();
export function invalidateApiCache(){cacheEpoch++;responseCache.clear();pendingReads.clear();}
export function resetApiCache(){invalidateApiCache();cacheContext=null;}
export function configureApiCache(context:CacheContext|null,token:string){
 if(!context||getToken()!==token||typeof context.scope_key!=='string'||!Number.isSafeInteger(context.revision)||!Number.isFinite(context.max_age_seconds)){resetApiCache();return;}
 if(cacheContext?.token!==token||cacheContext.scope!==context.scope_key||cacheContext.revision!==context.revision)invalidateApiCache();
 const max=Math.max(0,Math.min(30,context.max_age_seconds))*1000;
 const transition=context.next_transition_at?Date.parse(context.next_transition_at)-Date.parse(context.server_time):max;
 cacheContext={token,scope:context.scope_key,revision:context.revision,until:Date.now()+Math.max(0,Math.min(max,Number.isFinite(transition)?transition:max))};
}
function cacheAllowed(path:string){const url=path.split('?')[0];return /^\/operations\/umrah-travel(?:\/[0-9a-f-]{36})?$/.test(url)||/^\/portal\/licenses(?:\/[0-9a-f-]{36})?$/.test(url)||['/portal/manasik','/data/pilgrims','/data/changes','/data/manifests','/workspace/dashboard','/portal/dashboard'].includes(url);}
const copy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return Boolean(token && (sessionExpiresAt(token) ?? 0) > Date.now());
}

// Decode expiry only for UI logout timing. The API still verifies the JWT signature.
export function sessionExpiresAt(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp > 0
      && Number.isFinite(payload.exp * 1000) ? payload.exp * 1000 : null;
  } catch { return null; }
}

export function expireSession(expectedToken: string) {
  // A late 401 from an old request must not sign out a newer login.
  if (getToken() !== expectedToken) return;
  clearSession();
  window.dispatchEvent(new Event('kemenhaj-session-expired'));
}

// Recheck on tab wake and storage changes because background timers can be paused.
export function watchSessionExpiration(onSession: () => void, onRemoved: () => void): () => void {
  let timer: number | undefined;
  let previousToken = getToken();
  const check = () => {
    window.clearTimeout(timer);
    const token = getToken();
    if (!token) {
      if (previousToken) onRemoved();
      previousToken = null;
      onSession();
      return;
    }
    previousToken = token;
    const remaining = (sessionExpiresAt(token) ?? 0) - Date.now();
    if (remaining <= 0) { expireSession(token); return; }
    onSession();
    timer = window.setTimeout(check, Math.min(remaining, 2147483647));
  };
  const storage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === USER_KEY || event.key === null) check();
  };
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('storage', storage);
  check();
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('focus', check);
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('storage', storage);
  };
}

export function setSession(session: AuthSession) {
  const prior=getUser();
  if(getToken()!==session.token||prior?.id!==session.user.id||prior?.role!==session.user.role||prior?.company_id!==session.user.company_id||prior?.access_version!==session.user.access_version)resetApiCache();
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
  resetApiCache();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; cache?:'default'|'reload'|'no-store' } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();

  if (token && path !== '/auth/login' && (sessionExpiresAt(token) ?? 0) <= Date.now()) {
    expireSession(token);
    throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.');
  }
  if (token && path !== '/auth/login') headers.Authorization = `Bearer ${token}`;
  if(method!=='GET'||options.cache==='reload')invalidateApiCache();
  const scope=cacheContext,epoch=cacheEpoch;
  const reusable=method==='GET'&&options.cache!=='no-store'&&options.cache!=='reload'&&!!token&&scope?.token===token&&scope.until>Date.now()&&cacheAllowed(path);
  const key=`${epoch}:${path}`;
  if(reusable){const hit=responseCache.get(key);if(hit&&hit.until>Date.now())return copy(hit.value) as T;const pending=pendingReads.get(key);if(pending)return copy(await pending) as T;}
  const request=(async()=>{
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    cache:'no-store',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token && path !== '/auth/login') {
      expireSession(token);
    }
    if (res.status === 403 && token) {resetApiCache();window.dispatchEvent(new Event('kemenhaj-access-denied'));}
    throw new Error((data as { error?: string }).error || 'Terjadi kesalahan');
  }

  if(method!=='GET')invalidateApiCache();
  if(token&&path!=='/auth/login'&&getToken()!==token)throw Error('Sesi berubah. Muat ulang data.');
  if(reusable&&cacheEpoch===epoch&&cacheContext===scope&&scope.until>Date.now()){
    if(responseCache.size>=100)responseCache.delete(responseCache.keys().next().value!);
    if(JSON.stringify(data).length<=250000)responseCache.set(key,{value:copy(data),until:scope.until});
  }
  return data;
  })();
  if(reusable)pendingReads.set(key,request);
  try{return copy(await request) as T;}finally{if(pendingReads.get(key)===request)pendingReads.delete(key);}
}

