import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {api,API_URL} from '../lib/api';
import {useAuth} from '../hooks/useAuth';
import {ActionFeedback} from './UmrahTravelPages';
export const roleNames:Record<string,string>={operator:'Operator Kanwil',petugas_haji:'Petugas Haji',admin:'Admin Kanwil',kabkota:'Admin Kemenhaj Kabupaten/Kota',travel:'Admin Travel PPIU/PIHK',kbihu:'Admin KBIHU',staff:'Staf (lama)',pengawas:'Pengawas',konsultan:'Konsultan',pengguna:'Jemaah'};
export const dashboardFor=(role?:string)=>role==='operator'?'/operator':role==='petugas_haji'?'/petugas-haji':role==='admin'?'/admin':role==='travel'?'/travel':role==='kbihu'?'/kbihu':role==='kabkota'?'/kabkota':role==='staff'?'/staff':role==='pengawas'?'/pengawas':role==='konsultan'?'/konsultan':'/dashboard';
export {default as KanwilOverview} from './MonitoringDashboard';
export type Organization={id:string;name:string;organization_type:string;nib:string;office_address:string;region:string;public_phone:string;license_status:string;license_number:string;license_valid_until:string;license_source:string};
type TextForm=Record<string,string>;
type Material={id:string;category:string;title:string;body:string;source_url:string;video_url:string;published?:boolean;updated_at?:string};
const categoryNames:Record<string,string>={FIKIH:'Fikih Haji',MANASIK:'Tutorial Manasik',DOA:'Bacaan Doa'};
const err=(e:unknown)=>(e as Error).message;
const blank=(keys:string[])=>Object.fromEntries(keys.map(k=>[k,'']));
const format=(v:string)=>new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
function TextFields({fields,value,set,locked=[],optional=[]}:{fields:[string,string,string?][];value:TextForm;set:(f:TextForm)=>void;locked?:string[];optional?:string[]}){
 return <div className="form-grid">{fields.map(([key,label,type])=><label key={key}>{label}{optional.includes(key)?' (opsional)':' *'}{type==='textarea'?<textarea required={!optional.includes(key)} readOnly={locked.includes(key)} rows={3} maxLength={4000} value={value[key]||''} onChange={e=>set({...value,[key]:e.target.value})}/>:<input required={!optional.includes(key)} type={type||'text'} min={type==='number'?1:undefined} maxLength={type==='date'?undefined:1000} value={value[key]||''} readOnly={locked.includes(key)} onChange={e=>set({...value,[key]:e.target.value})}/>}</label>)}</div>;
}
export function ProfilePage(){
 const [profile,setProfile]=useState<TextForm|null>(null),[org,setOrg]=useState<Organization|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;api<{profile:TextForm;organization:Organization}>('/portal/profile').then(d=>{if(active){setProfile(d.profile);setOrg(d.organization)}}).catch(e=>{if(active)setError(err(e))});return()=>{active=false}},[]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{const d=await api<{profile:TextForm}>('/portal/profile',{method:'PATCH',body:profile});setProfile(d.profile);setMessage('Identitas akun disimpan.')}catch(e){setError(err(e))}finally{setBusy(false)}}
 return <div className="managed-form"><h1>Profil & Identitas Akun</h1><ActionFeedback error={error} message={message}/>{profile?<><section className="dash-panel"><h2>{roleNames[profile.role]||profile.role}</h2><p>{profile.email}</p><p><strong>{org?.name||'Belum terhubung organisasi'}</strong></p><p>{org?.organization_type} · {org?.region}</p><p>{org?.office_address}</p><p>Peran dan organisasi ditentukan Admin Kanwil.</p></section><form className="dash-panel spaced-panel" onSubmit={save}><fieldset disabled={busy}><TextFields fields={[["name","Nama lengkap"],["phone","Telepon / WhatsApp","tel"],["address","Alamat penanggung jawab","textarea"],["position","Jabatan"]]} value={profile} set={setProfile}/><label>NIP / Nomor identitas pegawai (jika ada)<input maxLength={150} value={profile.employee_number||''} onChange={e=>setProfile({...profile,employee_number:e.target.value})}/></label><button className="btn primary">Simpan identitas</button></fieldset></form></>:error?<p role="alert">{error}</p>:<p>Memuat profil…</p>}</div>;
}
export function DirectoryPage(){
 const {user,can}=useAuth();
 const [rows,setRows]=useState<Organization[]>([]),[q,setQ]=useState(''),[type,setType]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;setLoading(true);api<{companies:Organization[]}>('/portal/directory').then(d=>{if(active)setRows(d.companies)}).catch(e=>{if(active)setError(err(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const filtered=rows.filter(r=>(!type||r.organization_type===type)&&`${r.name} ${r.office_address} ${r.license_number}`.toLowerCase().includes(q.toLowerCase()));
 return <div className="container managed-form"><h1>Direktori PPIU / PIHK Riau</h1>{user?.role==='admin'&&can('accounts')&&<p><Link className="btn primary" to="/admin/data-travel">Tambah / Kelola Travel</Link></p>}<p>Daftar penyelenggara di Riau dengan izin yang telah diverifikasi Admin Kanwil.</p><div className="form-grid"><label>Cari travel<input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nama, alamat atau nomor izin"/></label><label>Jenis penyelenggara<select value={type} onChange={e=>setType(e.target.value)}><option value="">Semua</option><option>PPIU</option><option>PIHK</option></select></label></div>{error?<p role="alert">{error}</p>:loading?<p>Memuat direktori…</p>:<><p>{filtered.length} penyelenggara</p>{!filtered.length&&<p>Belum ada penyelenggara terverifikasi yang sesuai pencarian. Admin Kanwil dapat memperbarui daftar melalui pengelolaan organisasi.</p>}{filtered.map(r=><article className="dash-panel spaced-panel" key={r.id}><h2>{r.name}</h2><p>{r.organization_type} · Riau · Izin terverifikasi</p><p>Nomor izin: {r.license_number}</p><p>{r.office_address}</p>{r.public_phone&&<p>Kontak: {r.public_phone}</p>}<p>Masa berlaku: {r.license_valid_until||'Sesuai dokumen izin'}</p>{r.license_source&&<a href={r.license_source} target="_blank" rel="noopener noreferrer">Sumber verifikasi</a>}</article>)}</>}</div>;
}
export {default as LicensingPage} from './LicensingPage';
export {default as ManasikPage} from './ManasikPage';
export {KnowledgePage,KnowledgeAdmin} from './KnowledgeServices';
export {ChatAdmin} from './SupportChat';
