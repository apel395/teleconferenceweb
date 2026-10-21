import {API_URL,getToken,sessionExpiresAt,expireSession} from './api';
export type OrganizationOption={id:string;name:string;organization_type:string};
export type Pilgrim={id:string;hajj_year:number;porsi_number:string;full_name:string;phone:string;gender:string;birth_date:string;hajj_type:string;kloter_code:string;status:string;version:number;company_id:string|null;kbihu_id:string|null;regional_office_id:string|null;person?:{full_name:string;phone:string;gender:string;birth_date:string}};
export const pilgrimLabels:Record<string,string>={porsi_number:'Nomor porsi',full_name:'Nama jemaah',phone:'Nomor HP',gender:'Jenis kelamin',birth_date:'Tanggal lahir',hajj_type:'Jenis haji / umrah',kloter_code:'Kloter',status:'Status',company_id:'Travel PPIU / PIHK',kbihu_id:'KBIHU',regional_office_id:'Kemenhaj kabupaten/kota'};
export const stages:Record<string,string>={PRE:'Pramanifest',DEPARTURE:'Manifest keberangkatan',RETURN:'Manifest kepulangan'};
export const statuses:Record<string,string>={ACTIVE:'Aktif',CANCELLED:'Batal',REPLACED:'Digantikan',TRANSFERRED:'Mutasi',RETURNED:'Sudah pulang',SUBMITTED:'Menunggu pemeriksaan',NEEDS_REVISION:'Perlu perbaikan',APPROVED:'Disetujui',REJECTED:'Ditolak',OPEN:'Terbuka',IN_PROGRESS:'Ditangani',RESOLVED:'Selesai'};
export const types:Record<string,string>={REGULER:'Haji reguler',HAJI_KHUSUS:'Haji khusus',UMRAH:'Umrah'};
export const changeTypes:Record<string,string>={CORRECTION:'Koreksi data',REPLACEMENT:'Penggantian jemaah',CANCEL:'Pembatalan',TRANSFER:'Mutasi kloter / lembaga'};
export function safeDrive(value:unknown):string|null{try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password&&['drive.google.com','docs.google.com'].includes(u.hostname)?u.href:null;}catch{return null;}}
export function displayTime(value:string){return value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':'—';}
// Binary Excel requests carry the same session checks as the JSON API helper.
export async function binaryApi(path:string,options:{method?:string;body?:File;headers?:Record<string,string>}={}){
 const token=getToken();if(!token)throw Error('Silakan masuk kembali.');if((sessionExpiresAt(token)??0)<=Date.now()){expireSession(token);throw Error('Sesi Anda telah berakhir.');}
 const response=await fetch(API_URL+path,{method:options.method||'GET',headers:{Authorization:'Bearer '+token,...options.headers},body:options.body});
 if(!response.ok){if(response.status===401)expireSession(token);if(response.status===403)window.dispatchEvent(new Event('kemenhaj-access-denied'));const d=await response.json().catch(()=>({}));throw Error(d.error||'Berkas belum dapat diproses.');}
 return response;
}
export async function downloadExcel(path:string,filename:string){const r=await binaryApi(path);const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
