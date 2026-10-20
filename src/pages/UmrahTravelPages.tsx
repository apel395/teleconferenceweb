import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import allChecklist from '../lib/airportChecklist.json';
import { useFormDraft } from '../hooks/useFormDraft';
import JourneyTicketView from './JourneyTicketView';
import { loginForForm } from '../lib/formDraft';
const root='/operations/umrah-travel';
type Kind='DEPARTURE'|'RETURN';
export type Phase='DRAFT'|'SUBMITTED'|'DEPARTED'|'RETURNING'|'RETURN_NOTES'|'CLOSED';
type Item={code:string;result:'YES'|'NO'|null;notes:string;drive_url?:string};
export type Form={journey_type?:'UMRAH'|'HAJI_KHUSUS';airport:string;inspection_date:string;ppiu_name:string;ppiu_license_number:string;ppiu_officer_name:string;ppiu_address:string;flight_number:string;airline:string;route:string;flight_type:string;travel_date:string;pilgrim_count:string|number|null;officer_count:string|number|null;officer_names:string[];findings:string;return_notes:string;supervised_party:string;items:Item[];drive_url:string};
type Check={code:string;result:'YES'|'NO'|null};
type Review={notes:string;supervisor_1:string;supervisor_2:string;supervised_party:string;verification_items:Check[];reviewer_name?:string};
export type History={at:string;actor_id?:string;actor_name:string;role:string;action:string;state:Phase;details?:string;section?:string;changes?:{field:string;before:unknown;after:unknown}[]};
export type Ticket={id:string;reference:string;kind:Kind;status:string;journey_status:Phase;form_data:Form;return_form_data:Partial<Form>;review_data:Partial<Review>;journey_history:History[];updated_at:string;created_at:string;departed_at?:string;closed_at?:string;departure_report_id?:string};
const phases:Record<Phase,string>={DRAFT:'Keberangkatan',SUBMITTED:'Keberangkatan',DEPARTED:'Sudah Berangkat',RETURNING:'Kepulangan',RETURN_NOTES:'Kepulangan dengan Catatan',CLOSED:'Sudah Pulang'};
const filters={DEPARTURE:'Keberangkatan',DEPARTED:'Sudah Berangkat',RETURNING:'Kepulangan',RETURN_NOTES:'Kepulangan dengan Catatan',CLOSED:'Sudah Pulang'};
const returnPhases:Phase[]=['DEPARTED','RETURNING','RETURN_NOTES'];
const returnGuidance={code:'RET-01',section:'IV. Pengawasan Bimbingan',indicator:'Jemaah telah menerima sosialisasi/edukasi persiapan kepulangan Umrah dari PPIU.',evidence:'Wawancara jemaah/petugas'};
const checklist=(kind:Kind)=>kind==='RETURN'?[...allChecklist.filter(x=>x.code!=='DOC-05'&&!x.code.startsWith('BIM-')),returnGuidance]:allChecklist.filter(x=>x.code!=='DOC-05');
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
const makeForm=(kind:Kind,source?:Form):Form=>({airport:'',inspection_date:today(),ppiu_name:source?.ppiu_name||'',ppiu_license_number:source?.ppiu_license_number||'',ppiu_address:source?.ppiu_address||'',ppiu_officer_name:source?.ppiu_officer_name||'',supervised_party:source?.supervised_party||'',flight_number:'',airline:'',route:'',flight_type:'',travel_date:'',pilgrim_count:source?.pilgrim_count??'',officer_count:source?.officer_count??'',officer_names:source?.officer_names||[],findings:'',return_notes:'',journey_type:source?.journey_type||'UMRAH',drive_url:'',items:checklist(kind).map(x=>({code:x.code,result:null,notes:''}))});
const hydrate=(value:Partial<Form>,kind:Kind):Form=>({...makeForm(kind),...value,officer_names:Array.isArray(value.officer_names)?value.officer_names:[],items:checklist(kind).map(x=>value.items?.find(i=>i.code===x.code)||{code:x.code,result:null,notes:''})});
const makeReview=(value:Partial<Review>={},party=''):Review=>({notes:'',supervisor_1:'',supervisor_2:'',supervised_party:party,...value,verification_items:checklist('DEPARTURE').map(x=>value.verification_items?.find(i=>i.code===x.code)||{code:x.code,result:null})});
function roleBase(role?:string){return role==='admin'?'/admin':role==='staff'?'/staff':role==='pengawas'?'/pengawas':'/travel'}
const airlines=['Saudia','Garuda Indonesia','Lion Air','Batik Air','Citilink','Qatar Airways','Emirates','Etihad Airways','Oman Air','AirAsia'];
const routes=['Pekanbaru → Jeddah','Pekanbaru → Madinah','Jakarta → Jeddah','Jakarta → Madinah','Batam → Jeddah','Batam → Madinah','Kuala Lumpur → Jeddah','Jeddah → Pekanbaru','Madinah → Pekanbaru','Jeddah → Jakarta','Madinah → Jakarta','Jeddah → Batam','Madinah → Batam'];
function validDriveLink(value:string){try{const u=new URL(value.trim());return u.protocol==='https:'&&['drive.google.com','docs.google.com'].includes(u.hostname)&&!u.username&&!u.password}catch{return false}}
const date=(value?:string)=>value?new Date(value).toLocaleString('id-ID'):'—';
function Choice({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){
 const [custom,setCustom]=useState(false);const other=custom||Boolean(value&&!options.includes(value));
 return <label>{label} *<select required value={other?'OTHER':value} onChange={e=>{setCustom(e.target.value==='OTHER');onChange(e.target.value==='OTHER'?'':e.target.value)}}><option value="">Pilih {label.toLowerCase()}</option>{options.map(x=><option key={x}>{x}</option>)}<option value="OTHER">Lainnya — isi sesuai dokumen</option></select>{other&&<input aria-label={`${label} lainnya`} required maxLength={500} value={value} placeholder={`Isi ${label.toLowerCase()} sesuai dokumen`} onChange={e=>onChange(e.target.value)}/>}</label>;
}
export function ActionFeedback({error,message}:{error:string;message:string}) {
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>setDismissed(false),[error,message]);
 const notice=error||message;
 if(!notice||dismissed)return null;
 return <aside aria-label="Notifikasi laporan" style={{position:'fixed',right:16,bottom:24,width:'min(540px, calc(100vw - 32px))',maxHeight:'40vh',overflowY:'auto',zIndex:2000,padding:20,borderRadius:12,boxShadow:'0 8px 32px #0003',background:error?'#fff1f0':'#eef7ef',color:error?'#8f211c':'#245a32',border:'1px solid '+(error?'#efb8b4':'#bed9c2'),fontSize:16,lineHeight:1.6}}>
  <button type="button" aria-label="Tutup notifikasi" onClick={()=>setDismissed(true)} style={{float:'right',marginLeft:12,padding:'4px 8px',background:'transparent',border:'1px solid currentColor',borderRadius:6,color:'inherit',cursor:'pointer'}}>Tutup</button>
  <div role={error?'alert':'status'} aria-live={error?'assertive':'polite'} aria-atomic="true"><strong>{error?'Perlu perhatian':'Berhasil'}</strong><p style={{margin:'8px 0 0',overflowWrap:'anywhere'}}>{notice}</p></div>
 </aside>;
}

export function EvidenceUpload({indicator,disabled,onFile,label='Unggah bukti (JPG/PNG/PDF, maksimal 8 MB)',accept='image/jpeg,image/png,application/pdf'}:{indicator:string;disabled:boolean;onFile:(file:File)=>void;label?:string;accept?:string}) {
 const input=useRef<HTMLInputElement>(null);
 return <div><p>{label}</p><button type="button" className="btn light" disabled={disabled} onClick={()=>input.current?.click()} style={{display:'inline-flex',minHeight:48,fontSize:16}}>Pilih berkas</button><input ref={input} type="file" aria-label={`Unggah bukti ${indicator}`} hidden style={{display:'none'}} accept={accept} disabled={disabled} onChange={e=>{const file=e.target.files?.[0];if(file)onFile(file);e.target.value=''}}/></div>;
}

export function UmrahTravelList({base}:{base:string}){
 const {user}=useAuth();const [params,setParams]=useSearchParams();
 const [rows,setRows]=useState<Ticket[]>([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [options,setOptions]=useState<{airlines:string[];routes:string[]}>({airlines:[],routes:[]});
 const term=params.get('q')||'',phase=params.get('phase')||'',airline=params.get('airline')||'',route=params.get('route')||'',page=Math.max(1,Number(params.get('page'))||1);
 const [query,setQuery]=useState(term);useEffect(()=>setQuery(term),[term]);
 useEffect(()=>{let active=true;api<typeof options>(root+'/options').then(d=>{if(active)setOptions(d)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{let active=true;setLoading(true);setError('');const search=new URLSearchParams({page:String(page),q:term,phase,airline,route});api<{reports:Ticket[];total:number}>(root+'?'+search).then(d=>{if(active){setRows(d.reports);setTotal(d.total)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[page,term,phase,airline,route]);
 function filter(key:string,value:string){const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);if(key!=='page')next.delete('page');setParams(next)}
 return <div className="managed-form"><div className="dash-panel-head"><h2>Tiket Perjalanan Jemaah</h2>{user?.role==='travel'&&<Link className="btn primary" to={`${base}/laporan-umrah/baru`}>Buat tiket keberangkatan</Link>}</div><p>Satu nomor tiket untuk keberangkatan, pemeriksaan admin, kepulangan, dan riwayat perjalanan.</p><section className="dash-panel"><form className="form-grid" onSubmit={e=>{e.preventDefault();filter('q',query)}}><label>Cari tiket perjalanan<input type="search" maxLength={120} placeholder="Nomor tiket, travel, maskapai, rute, nomor penerbangan" value={query} onChange={e=>setQuery(e.target.value)}/></label><button type="submit" className="btn primary">Cari</button></form><div className="form-grid"><label>Status tiket<select value={phase} onChange={e=>filter('phase',e.target.value)}><option value="">Semua tiket</option>{Object.entries(filters).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>Maskapai keberangkatan<select value={airline} onChange={e=>filter('airline',e.target.value)}><option value="">Semua maskapai</option>{[...new Set([...options.airlines,...airlines,...(airline?[airline]:[])])].map(x=><option key={x}>{x}</option>)}</select></label><label>Rute keberangkatan<select value={route} onChange={e=>filter('route',e.target.value)}><option value="">Semua rute</option>{[...new Set([...options.routes,...routes,...(route?[route]:[])])].map(x=><option key={x}>{x}</option>)}</select></label></div>{error?<p className="form-error" role="alert">{error}</p>:loading?<p role="status">Memuat tiket…</p>:<><p>{total} tiket perjalanan</p><div className="table-wrap-live"><table className="table-live"><thead><tr>{['Nomor tiket','Travel / PPIU','Maskapai / Rute','Keberangkatan','Kepulangan','Status','Aksi'].map(x=><th key={x} scope="col">{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td style={{overflowWrap:'anywhere'}}>{r.reference}</td><td>{r.form_data.ppiu_name}</td><td>{r.form_data.airline}<br/>{r.form_data.route}</td><td>{r.form_data.travel_date||'—'}</td><td>{r.return_form_data?.travel_date||'—'}</td><td>{phases[r.journey_status]}{['DRAFT','SUBMITTED'].includes(r.journey_status)&&<small style={{display:'block'}}>{r.journey_status==='DRAFT'?'Draft':'Menunggu pemeriksaan admin'}</small>}</td><td><Link className="btn light sm" to={`${base}/laporan-umrah/${r.id}${returnPhases.includes(r.journey_status)?'?tab=return':''}`}>{r.journey_status==='CLOSED'?'Lihat riwayat':returnPhases.includes(r.journey_status)?'Buka kepulangan':'Buka tiket'}</Link></td></tr>)}{!rows.length&&<tr><td colSpan={7}>Tidak ada tiket sesuai pencarian.</td></tr>}</tbody></table></div><div className="manifest-pagination"><button type="button" disabled={page===1} onClick={()=>filter('page',String(page-1))}>Sebelumnya</button><span>Halaman {page}</span><button type="button" disabled={page*25>=total} onClick={()=>filter('page',String(page+1))}>Berikutnya</button></div></>}</section></div>;
}
function TicketFormFields({form,onChange,kind,disabled,lockCompany}:{form:Form;onChange:(f:Form)=>void;kind:Kind;disabled:boolean;lockCompany:boolean}){
 const set=<K extends keyof Form>(key:K,value:Form[K])=>onChange({...form,[key]:value});
 const field=(key:keyof Form,label:string,type='text',required=true)=><label>{label}{required?' *':''}<input type={type} required={required} value={String(form[key]??'')} maxLength={key==='ppiu_address'?1000:500} min={type==='number'?0:undefined} readOnly={(lockCompany||kind==='RETURN')&&['ppiu_name','ppiu_address','ppiu_license_number'].includes(key)&&(key!=='ppiu_license_number'||kind==='RETURN')} onChange={e=>set(key,e.target.value as Form[typeof key])}/></label>;
 const count=Math.min(200,Math.max(0,Math.floor(Number(form.officer_count)||0)));
 return <fieldset className="complaint-fields" disabled={disabled}><fieldset className="operations-group"><legend>Identitas Penyelenggara</legend><div className="form-grid">{field('ppiu_name','Nama Penyelenggara PPIU/PIHK')}{field('ppiu_license_number','Nomor Izin Berusaha PPIU/PIHK')}{field('ppiu_address','Alamat kantor PPIU/PIHK')}{field('ppiu_officer_name','Nama pimpinan/petugas PPIU/PIHK')}{field('supervised_party','Nama perwakilan PPIU')}</div></fieldset><fieldset className="operations-group"><legend>{kind==='DEPARTURE'?'Data Keberangkatan':'Data Kepulangan'}</legend><div className="form-grid">{field('airport','Bandara')}{field('inspection_date','Tanggal pelaporan','date')}{field('travel_date',kind==='DEPARTURE'?'Tanggal keberangkatan':'Tanggal tiba di Indonesia','date')}{field('flight_number','Nomor penerbangan')}<Choice label="Maskapai" options={airlines} value={form.airline} onChange={v=>set('airline',v)}/><Choice label="Rute penerbangan" options={routes} value={form.route} onChange={v=>set('route',v)}/><label>Jenis penerbangan *<select required value={form.flight_type} onChange={e=>set('flight_type',e.target.value)}><option value="">Pilih jenis penerbangan</option><option value="DIRECT">Langsung</option><option value="TRANSIT">Transit 1 kali</option></select></label>{field('pilgrim_count','Jumlah jemaah','number')}<label>Jumlah petugas *<input required type="number" min={0} max={200} step={1} value={form.officer_count??''} onChange={e=>{const value=e.target.value;const n=Math.min(200,Math.max(0,Math.floor(Number(value)||0)));onChange({...form,officer_count:value,officer_names:Array.from({length:n},(_,i)=>form.officer_names[i]||'')})}}/></label></div><div className="form-grid">{Array.from({length:count},(_,i)=><label key={i}>Nama petugas {i+1} *<input required maxLength={150} value={form.officer_names[i]||''} onChange={e=>set('officer_names',Array.from({length:count},(_,j)=>j===i?e.target.value:form.officer_names[j]||''))}/></label>)}</div><p>Total {Number(form.pilgrim_count||0)+count} jemaah dan petugas.</p></fieldset><fieldset className="operations-group"><legend>Dokumen Pendukung</legend><label>Link folder Google Drive<input type="url" maxLength={2000} inputMode="url" value={form.drive_url||''} placeholder="https://drive.google.com/drive/folders/..." onChange={e=>set('drive_url',e.target.value)}/></label><p>Satu folder untuk dokumen perjalanan. Berikan akses lihat kepada petugas.</p>{form.drive_url&&validDriveLink(form.drive_url)&&<a className="btn light" href={form.drive_url.trim()} target="_blank" rel="noopener noreferrer">Buka folder dokumen</a>}{form.items.some(x=>x.drive_url)&&<details><summary>Dokumen per indikator dari laporan lama</summary>{form.items.filter(x=>x.drive_url&&validDriveLink(x.drive_url)).map(x=><p key={x.code}><a href={x.drive_url} target="_blank" rel="noopener noreferrer">{x.code}</a></p>)}</details>}</fieldset>{[...new Set(checklist(kind).map(x=>x.section))].map(section=><fieldset key={section} className="operations-group"><legend>{section}</legend>{checklist(kind).filter(x=>x.section===section).map(x=><label className="airport-indicator" key={x.code}><strong>{form.journey_type==='HAJI_KHUSUS'?x.indicator.replaceAll('Umrah','Haji Khusus').replaceAll('PPIU','PIHK'):x.indicator}</strong><select required value={form.items.find(i=>i.code===x.code)?.result||''} onChange={e=>set('items',form.items.map(i=>i.code===x.code?{...i,result:e.target.value as Item['result']}:i))}><option value="">Pilih Iya / Tidak</option><option value="YES">Iya</option><option value="NO">Tidak</option></select><small>{x.evidence}</small></label>)}</fieldset>)}{kind==='RETURN'&&<fieldset className="operations-group"><legend>Catatan Kepulangan</legend><label>Kendala atau kondisi khusus (opsional)<textarea rows={4} maxLength={4000} value={form.return_notes||''} onChange={e=>set('return_notes',e.target.value)} placeholder="Isi jika ada kendala atau kondisi khusus saat kepulangan"/></label><p>Jika diisi, status tiket menjadi Kepulangan dengan Catatan. Catatan tetap tersimpan setelah Sudah Pulang.</p></fieldset>}</fieldset>;
}
export function UmrahTravelForm({kind='DEPARTURE',base,publicEntry=false}:{kind?:Kind;base?:string;publicEntry?:boolean}){
 const {id}=useParams();const nav=useNavigate(),location=useLocation();const [params,setParams]=useSearchParams();const {user,isAuth}=useAuth();
 const listBase=base||roleBase(user?.role),travel=user?.role==='travel',admin=user?.role==='admin',allowed=Boolean(user&&['travel','admin'].includes(user.role));
 const [report,setReport]=useState<Ticket|null>(null),[loading,setLoading]=useState(Boolean(id)),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const {value:departure,setValue:setDeparture,clear}=useFormDraft<Form>('journey-new-'+(user?.id||'anonymous'),!id,()=>makeForm('DEPARTURE'),v=>Boolean(v&&typeof v==='object'&&Array.isArray((v as Form).items)));
 const [returnForm,setReturnForm]=useState<Form>(()=>makeForm('RETURN')),[review,setReview]=useState<Review>(()=>makeReview());
 const [company,setCompany]=useState<{name:string;office_address:string;organization_type?:string}|null>(null),[companyLoading,setCompanyLoading]=useState(travel);
 const [reason,setReason]=useState(''),[confirmedDeparted,setConfirmedDeparted]=useState(false),[confirmedArrived,setConfirmedArrived]=useState(false);
 const phase=report?.journey_status||'DRAFT',tab=params.get('tab')==='return'?'return':params.get('tab')==='history'?'history':'departure',mode=params.get('mode')||'view';
 function accept(r:Ticket){setReport(r);setDeparture(hydrate(r.form_data,'DEPARTURE'));setReturnForm(r.return_form_data&&Object.keys(r.return_form_data).length?hydrate(r.return_form_data,'RETURN'):makeForm('RETURN',r.form_data));setReview(makeReview(r.review_data,r.form_data.supervised_party));}
 useEffect(()=>{
  if(!id||!allowed)return;let active=true;setLoading(true);setError('');
  api<{report:Ticket;ticket_id?:string}>(root+'/'+id).then(d=>{if(!active)return;if(d.ticket_id){nav(`${listBase}/laporan-umrah/${d.ticket_id}?tab=return`,{replace:true});return}accept(d.report)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[id,allowed,listBase]);
 useEffect(()=>{
  if(!travel){setCompanyLoading(false);return}let active=true;setCompanyLoading(true);
  api<{company:typeof company}>(root+'/company').then(d=>{if(active){setCompany(d.company);if(!d.company)setError('Perusahaan tidak ditemukan. Hubungi administrator.')}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setCompanyLoading(false)});
  return()=>{active=false};
 },[travel,user?.id]);
 useEffect(()=>{if(travel&&phase==='DRAFT'&&company)setDeparture(f=>({...f,ppiu_name:company.name,ppiu_address:company.office_address||'',journey_type:company.organization_type==='PIHK'?'HAJI_KHUSUS':'UMRAH',ppiu_officer_name:f.ppiu_officer_name||user!.name,supervised_party:f.supervised_party||user!.name}))},[company,report?.id,phase,travel,user?.name]);
 function view(nextTab:string=tab,nextMode='view'){const next=new URLSearchParams(params);next.set('tab',nextTab);if(nextMode==='view')next.delete('mode');else next.set('mode',nextMode);setParams(next);}
 function cancel(){if(report)accept(report);setReason('');setError('');setConfirmedArrived(false);setConfirmedDeparted(false);view(tab);}
 async function saveDeparture(){
  const body=hydrate(departure,'DEPARTURE');if(body.drive_url&&!validDriveLink(body.drive_url))throw Error('Gunakan link HTTPS Google Drive yang valid.');
  const key=report?.id||id;const d=await api<{report:Ticket}>(key?root+'/'+key:root,{method:key?'PATCH':'POST',body:key?{form_data:body,updated_at:report?.updated_at}:{kind:'DEPARTURE',form_data:body}});accept(d.report);return d.report;
 }
 const canDeparture=travel&&phase==='DRAFT'&&!companyLoading&&Boolean(company),canReturn=travel&&returnPhases.includes(phase),canReview=admin&&phase==='SUBMITTED';
 const canCorrectDeparture=admin&&['DRAFT','SUBMITTED'].includes(phase),canCorrectReturn=admin&&returnPhases.includes(phase);
 async function departureAction(submit:boolean){
  if(busy||!canDeparture)return;setBusy(true);setError('');setMessage('');
  try{let r=await saveDeparture();if(submit){const d=await api<{report:Ticket}>(`${root}/${r.id}/submit`,{method:'POST',body:{updated_at:r.updated_at}});r=d.report;accept(r)}clear();setMessage(submit?'Tiket dikirim untuk pemeriksaan admin.':'Draft tiket disimpan.');if(!id)nav(`${listBase}/laporan-umrah/${r.id}`,{replace:true});else view('departure');}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function returnAction(close:boolean){
  if(busy||!report||!canReturn)return;setBusy(true);setError('');setMessage('');
  try{if(returnForm.drive_url&&!validDriveLink(returnForm.drive_url))throw Error('Gunakan link HTTPS Google Drive yang valid.');const saved=await api<{report:Ticket}>(`${root}/${report.id}/return`,{method:'PATCH',body:{form_data:returnForm,updated_at:report.updated_at}});accept(saved.report);
   if(close){const d=await api<{report:Ticket}>(`${root}/${report.id}/close`,{method:'POST',body:{updated_at:saved.report.updated_at,confirmed_arrived:confirmedArrived}});accept(d.report);setConfirmedArrived(false)}
   setMessage(close?'Status: Sudah Pulang. Tiket ditutup dan menjadi riwayat perjalanan.':saved.report.journey_status==='RETURN_NOTES'?'Status: Kepulangan dengan Catatan.':'Status: Kepulangan.');view('return');
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function adminAction(changes:boolean){
  if(busy||!report||!canReview)return;setBusy(true);setError('');setMessage('');
  try{const d=await api<{report:Ticket}>(`${root}/${report.id}/${changes?'request-changes':'depart'}`,{method:'POST',body:{...review,confirmed_departed:confirmedDeparted,updated_at:report.updated_at}});accept(d.report);setConfirmedDeparted(false);setMessage(changes?'Tiket dikembalikan ke travel untuk diperbaiki.':'Kanwil mengonfirmasi Sudah Berangkat. Travel dapat melanjutkan kepulangan.');view('departure');}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function correct(section:'departure'|'return'){
  if(!report||busy||!admin)return;setBusy(true);setError('');setMessage('');
  try{const d=await api<{report:Ticket}>(`${root}/${report.id}/correction`,{method:'PATCH',body:{section,reason,form_data:section==='departure'?departure:returnForm,updated_at:report.updated_at}});accept(d.report);setReason('');setMessage('Koreksi tiket disimpan. Alasan dan rincian perubahan tercatat di riwayat.');view(section);}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function withdraw(){
  if(!report||busy||!travel||phase!=='SUBMITTED')return;setBusy(true);setError('');setMessage('');
  try{const d=await api<{report:Ticket}>(`${root}/${report.id}/withdraw`,{method:'POST',body:{updated_at:report.updated_at}});accept(d.report);setMessage('Tiket dibuka kembali. Perbaiki data lalu kirim ulang ke Kanwil.');view('departure','edit');}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 if(!isAuth)return <Navigate to={loginForForm(location.pathname)} replace/>;
 if(!allowed)return <Navigate to="/layanan" replace/>;
 if(!id&&(kind==='RETURN'||params.get('jenis')==='RETURN')){const source=params.get('keberangkatan');return <Navigate to={source?`${listBase}/laporan-umrah/${source}?tab=return`:`${listBase}/tiket-perjalanan?phase=DEPARTED`} replace/>}
 if(!id&&!travel)return <Navigate to={`${listBase}/tiket-perjalanan`} replace/>;
 const editingDeparture=(!id||mode==='edit'&&tab!=='return')&&(canDeparture||canCorrectDeparture),editingReturn=mode==='edit'&&tab==='return'&&(canReturn||canCorrectReturn),reviewing=mode==='review'&&canReview;
 const actions=<>
  {(canDeparture||canCorrectDeparture)&&<button type="button" className="btn primary" disabled={busy} onClick={()=>view('departure','edit')}>Edit tiket</button>}
  {travel&&phase==='SUBMITTED'&&<button type="button" className="btn light" disabled={busy} onClick={()=>void withdraw()}>Perbaiki pengajuan</button>}
  {canReview&&<button type="button" className="btn primary" disabled={busy} onClick={()=>view('departure','review')}>Periksa keberangkatan</button>}
  {canReturn&&<button type="button" className="btn primary" disabled={busy} onClick={()=>view('return','edit')}>{phase==='DEPARTED'?'Lanjutkan kepulangan':'Edit kepulangan'}</button>}
  {canCorrectReturn&&<button type="button" className="btn light" disabled={busy} onClick={()=>view('return','edit')}>Koreksi kepulangan</button>}
  {phase==='DRAFT'&&<p>{admin?'Draft belum dikirim oleh travel. Kanwil dapat mengoreksi data; pemeriksaan dilakukan setelah tiket dikirim.':'Lengkapi keberangkatan lalu kirim tiket kepada Kanwil.'}</p>}
  {phase==='SUBMITTED'&&travel&&<p>Tiket menunggu pemeriksaan Kanwil. Pilih Perbaiki pengajuan jika ada data yang perlu diubah sebelum keberangkatan.</p>}
  {returnPhases.includes(phase)&&<p>Keberangkatan sudah dikonfirmasi. Data keberangkatan terkunci; proses kepulangan dilanjutkan pada tiket ini.</p>}
  {phase==='CLOSED'&&<p>Perjalanan selesai. Tiket menjadi riwayat dan tidak dapat diedit.</p>}
 </>;
 const content=<div className="managed-form journey-page"><ActionFeedback error={error} message={message}/><Link to={`${listBase}/tiket-perjalanan`}>← Daftar tiket perjalanan</Link>
  {error&&<p className="form-error" role="alert">{error}</p>}{message&&<p className="form-notice" role="status">{message}</p>}
  {loading?<p role="status">Memuat tiket…</p>:id&&!report?<p>Tiket tidak dapat dimuat. Kembali ke daftar atau muat ulang halaman.</p>:report&&!editingDeparture&&!editingReturn&&!reviewing?<JourneyTicketView report={report} tab={tab} onTab={value=>view(value)} actions={actions}/>:<>
   <div className="dash-panel-head" style={{marginTop:20}}><div><h1>{reviewing?'Pemeriksaan Keberangkatan':editingReturn?'Edit Kepulangan':id?'Edit Tiket Keberangkatan':'Buat Tiket Perjalanan Jemaah'}</h1>{report&&<p>{report.reference} · {phases[phase]}</p>}</div>{id&&<button type="button" className="btn light" disabled={busy} onClick={cancel}>Kembali ke detail</button>}</div>
   {reviewing?<form className="dash-panel spaced-panel managed-form" onSubmit={e=>{e.preventDefault();void adminAction(false)}}><fieldset disabled={busy}>
    <h2>Pemeriksaan Kanwil</h2><p>Periksa pernyataan travel dan dokumen sebelum mengonfirmasi keberangkatan.</p>
    {checklist('DEPARTURE').map(item=><label className="airport-indicator" key={item.code}><strong>{departure.journey_type==='HAJI_KHUSUS'?item.indicator.replaceAll('Umrah','Haji Khusus').replaceAll('PPIU','PIHK'):item.indicator}</strong><small>Pernyataan travel: {departure.items.find(i=>i.code===item.code)?.result==='YES'?'Iya':departure.items.find(i=>i.code===item.code)?.result==='NO'?'Tidak':'Belum diisi'}</small><select required value={review.verification_items.find(i=>i.code===item.code)?.result||''} onChange={e=>setReview(r=>({...r,verification_items:r.verification_items.map(i=>i.code===item.code?{...i,result:e.target.value as Check['result']}:i)}))}><option value="">Belum diperiksa</option><option value="YES">Memenuhi</option><option value="NO">Tidak memenuhi</option></select></label>)}
    <div className="form-grid">{(['supervisor_1','supervisor_2','supervised_party'] as const).map((key,i)=><label key={key}>{['Pengawas 1','Pengawas 2','Perwakilan PPIU/PIHK'][i]} *<input required maxLength={150} value={review[key]} onChange={e=>setReview(r=>({...r,[key]:e.target.value}))}/></label>)}</div><label>Catatan pemeriksaan<textarea maxLength={4000} rows={4} value={review.notes} onChange={e=>setReview(r=>({...r,notes:e.target.value}))}/></label><label><input type="checkbox" required checked={confirmedDeparted} onChange={e=>setConfirmedDeparted(e.target.checked)}/> Saya memastikan jemaah sudah berangkat.</label><div className="airport-actions"><button type="button" className="btn light" onClick={()=>void adminAction(true)}>Kembalikan untuk perbaikan</button><button type="submit" className="btn primary">Konfirmasi Sudah Berangkat</button></div>
   </fieldset></form>:<form noValidate={admin} onSubmit={e=>{e.preventDefault();if(admin)void correct(editingReturn?'return':'departure');else if(editingReturn)void returnAction(true);else void departureAction(true)}}>
    {admin&&<div className="journey-edit-notice"><strong>Koreksi oleh Admin Kanwil</strong><p>Perubahan tidak mengonfirmasi keberangkatan atau menutup tiket. Identitas organisasi tetap terikat pada pemilik tiket.</p><label>Alasan koreksi *<textarea required rows={3} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} disabled={busy}/></label></div>}
    <TicketFormFields form={editingReturn?returnForm:departure} onChange={editingReturn?setReturnForm:setDeparture} kind={editingReturn?'RETURN':'DEPARTURE'} disabled={busy} lockCompany/>
    {admin?<button type="submit" className="btn primary" disabled={busy}>Simpan koreksi tiket</button>:editingReturn?<><label><input type="checkbox" required checked={confirmedArrived} onChange={e=>setConfirmedArrived(e.target.checked)}/> Saya memastikan jemaah sudah tiba di Indonesia. Konfirmasi ini akan menutup tiket.</label><div className="airport-actions"><button type="button" className="btn light" disabled={busy} onClick={()=>void returnAction(false)}>Simpan proses kepulangan</button><button type="submit" className="btn primary" disabled={busy}>Konfirmasi Sudah Pulang</button></div></>:<div className="airport-actions"><button type="button" className="btn light" disabled={busy||!canDeparture} onClick={()=>void departureAction(false)}>Simpan draft tiket</button><button type="submit" className="btn primary" disabled={busy||!canDeparture}>Kirim tiket ke admin</button></div>}
   </form>}
  </>}
 </div>;
 return publicEntry?<main className="section"><div className="container">{content}</div></main>:content;
}
