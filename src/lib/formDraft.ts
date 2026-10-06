// Only this tab retains unsent form data; never store it in shared localStorage.
const PREFIX = 'kemenhaj-form-draft-v1:';
const MAX_AGE = 24 * 60 * 60 * 1000;
export function readFormDraft<T>(key:string, fallback:()=>T, valid:(value:unknown)=>boolean=()=>true):T {
  try {
    const raw=sessionStorage.getItem(PREFIX+key);
    if(raw){const data=JSON.parse(raw);if(data.version===1&&typeof data.savedAt==='number'&&Date.now()-data.savedAt>=0&&Date.now()-data.savedAt<MAX_AGE&&data.value&&typeof data.value==='object'&&!Array.isArray(data.value)&&valid(data.value))return data.value as T;
      sessionStorage.removeItem(PREFIX+key);}
  } catch { /* Corrupt or unavailable storage must not prevent form entry. */ }
  return fallback();
}
export function writeFormDraft(key:string,value:unknown):boolean {
  try {sessionStorage.setItem(PREFIX+key,JSON.stringify({version:1,savedAt:Date.now(),value}));return true} catch {return false}
}
export function removeFormDraft(key:string){try{sessionStorage.removeItem(PREFIX+key)}catch{/* Storage may be unavailable. */}}
const destinations:Record<string,readonly string[]>={
 '/layanan/pelaporan-travel-umrah/pengajuan':['travel','admin','staff','pengawas'],
 '/layanan/pemulangan-travel-umrah/pengajuan':['travel','admin','staff','pengawas'],
 '/layanan/pelaporan-pemulangan/pengajuan':['admin','staff'],
 '/layanan/pemulangan-haji-reguler/pengajuan':['admin','staff'],
};
export function formContinuation(path:string|null,role:string|undefined):string|null {
 return path&&role&&destinations[path]?.includes(role)?path:null;
}
export function loginForForm(path:string){return '/masuk?lanjut='+encodeURIComponent(path)}
export function registrationForForm(path:string){return '/daftar-travel?lanjut='+encodeURIComponent(path)}
