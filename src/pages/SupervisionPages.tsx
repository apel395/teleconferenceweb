import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, Plus, RefreshCw, Save } from 'lucide-react';
import { api } from '../lib/api';

type Supervision = {
  id: string; reference: string; airport: string | null; inspection_date: string;
  ppiu_name: string; ppiu_license_number: string | null; ppiu_officer_name: string | null;
  ppiu_address: string | null; flight_number: string | null; airline: string | null;
  route: string | null; flight_type: 'DIRECT'|'TRANSIT'|null; pilgrim_count: number|null;
  officer_count: number|null; findings: string|null; recommendation_notes: string|null;
  decision: string|null; status: 'DRAFT'|'SUBMITTED'|'FINAL';
  supervisor_1: string|null; supervisor_2: string|null; supervised_party: string|null;
  items?: Item[];
};
type Item = { id?:string; item_code:string; section:string; indicator:string; result:'YES'|'NO'|null; notes:string|null; sort_order:number };

const checklist: Omit<Item,'id'|'result'|'notes'>[] = [
  {section:'II. Dokumen Jemaah Umrah',item_code:'DOC-01',indicator:'Paspor masih berlaku minimal 6 bulan',sort_order:10},
  {section:'II. Dokumen Jemaah Umrah',item_code:'DOC-02',indicator:'Visa Umrah sah dan masih berlaku',sort_order:20},
  {section:'II. Dokumen Jemaah Umrah',item_code:'DOC-03',indicator:'Tiket pergi-pulang / boarding pass tersedia',sort_order:30},
  {section:'II. Dokumen Jemaah Umrah',item_code:'DOC-04',indicator:'Dokumen kesehatan jemaah tersedia',sort_order:40},
  {section:'II. Dokumen Jemaah Umrah',item_code:'DOC-05',indicator:'Data jemaah terverifikasi pada sistem informasi Kementerian',sort_order:50},
  {section:'III. Identitas, Pelindungan Asuransi & Penanganan Kesehatan',item_code:'PRO-01',indicator:'Jemaah memiliki identitas Siskopatuh',sort_order:60},
  {section:'III. Identitas, Pelindungan Asuransi & Penanganan Kesehatan',item_code:'PRO-02',indicator:'Identitas PPIU tercantum pada perlengkapan jemaah',sort_order:70},
  {section:'III. Identitas, Pelindungan Asuransi & Penanganan Kesehatan',item_code:'PRO-03',indicator:'Asuransi jemaah aktif',sort_order:80},
  {section:'III. Identitas, Pelindungan Asuransi & Penanganan Kesehatan',item_code:'PRO-04',indicator:'PPIU melakukan pendampingan di bandara keberangkatan',sort_order:90},
  {section:'III. Identitas, Pelindungan Asuransi & Penanganan Kesehatan',item_code:'PRO-05',indicator:'Layanan kesehatan / obat-obatan tersedia',sort_order:100},
  {section:'IV. Pengawasan Bimbingan',item_code:'BIM-01',indicator:'Bimbingan manasik telah dilaksanakan',sort_order:110},
  {section:'IV. Pengawasan Bimbingan',item_code:'BIM-02',indicator:'Pembimbing memiliki sertifikasi yang dipersyaratkan',sort_order:120},
  {section:'IV. Pengawasan Bimbingan',item_code:'BIM-03',indicator:'Edukasi persiapan dan perjalanan diberikan sebelum keberangkatan',sort_order:130},
];

const blank = {airport:'', inspection_date:new Date().toISOString().slice(0,10), ppiu_name:'', ppiu_license_number:'', ppiu_officer_name:'', ppiu_address:'', flight_number:'', airline:'', route:'', flight_type:'', pilgrim_count:'', officer_count:'', supervisor_1:'', supervisor_2:'', supervised_party:''};

export function SupervisionList({base}:{base:string}) {
  const [rows,setRows]=useState<Supervision[]>([]); const [loading,setLoading]=useState(true); const [q,setQ]=useState('');
  const load=()=>{setLoading(true);api<{supervisions:Supervision[]}>('/supervisions').then(d=>setRows(d.supervisions||[])).finally(()=>setLoading(false));};
  useEffect(load,[]);
  const filtered=useMemo(()=>rows.filter(x=>`${x.reference} ${x.ppiu_name} ${x.airport||''} ${x.airline||''}`.toLowerCase().includes(q.toLowerCase())),[rows,q]);
  return <><div className="dash-panel-head"><div><div className="dash-section-title">Pengawasan PPIU di Bandara</div><small>Instrumen pemeriksaan keberangkatan PPIU dan jemaah.</small></div><Link className="btn primary" to={`${base}/pengawasan/baru`}><Plus size={16}/> Pengawasan baru</Link></div>
    <div className="dash-panel"><div style={{display:'flex',gap:8,marginBottom:14}}><div className="search-box" style={{flex:1,maxWidth:'none'}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari PPIU, referensi, bandara, maskapai…"/></div><button className="btn ghost2 sm" onClick={load}><RefreshCw size={14}/> Muat ulang</button></div>
    {loading?<div className="empty-live"><b>Memuat…</b></div>:filtered.length===0?<div className="empty-live"><ClipboardCheck/><b>Belum ada pengawasan</b></div>:<div className="table-wrap-live"><table className="table-live"><thead><tr><th>Ref</th><th>Tanggal</th><th>PPIU</th><th>Bandara</th><th>Penerbangan</th><th>Status</th></tr></thead><tbody>{filtered.map(x=><tr className="row-link" key={x.id} onClick={()=>location.href=`${base}/pengawasan/${x.id}`}><td><b>{x.reference}</b></td><td>{new Date(x.inspection_date).toLocaleDateString('id-ID')}</td><td>{x.ppiu_name}</td><td>{x.airport||'—'}</td><td>{[x.airline,x.flight_number].filter(Boolean).join(' · ')||'—'}</td><td><span className={`status-pill ${x.status.toLowerCase()}`}>{x.status}</span></td></tr>)}</tbody></table></div>}</div></>;
}

export function SupervisionForm({base}:{base:string}) {
  const {id}=useParams(); const nav=useNavigate(); const editing=Boolean(id);
  const [form,setForm]=useState<any>(blank); const [items,setItems]=useState<Item[]>(checklist.map(x=>({...x,result:null,notes:null})));
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState(''); const [status,setStatus]=useState<'DRAFT'|'SUBMITTED'|'FINAL'>('DRAFT');
  useEffect(()=>{if(!id)return;api<{supervision:Supervision}>(`/supervisions/${id}`).then(d=>{const s=d.supervision;setStatus(s.status);setForm({...blank,...s,pilgrim_count:s.pilgrim_count??'',officer_count:s.officer_count??''});const saved=new Map((s.items||[]).map(x=>[x.item_code,x]));setItems(checklist.map(x=>saved.get(x.item_code)||({...x,result:null,notes:null})));}).catch((e:Error)=>setMsg(e.message));},[id]);
  const set=(k:string,v:any)=>setForm((f:any)=>({...f,[k]:v}));
  async function saveHeader(){
    if(!form.ppiu_name){setMsg('Nama PPIU wajib diisi.');return null;} setBusy(true);setMsg('');
    try {const body={...form,pilgrim_count:form.pilgrim_count===''?null:Number(form.pilgrim_count),officer_count:form.officer_count===''?null:Number(form.officer_count),flight_type:form.flight_type||null}; const d=editing?await api<{supervision:Supervision}>(`/supervisions/${id}`,{method:'PATCH',body}):await api<{supervision:Supervision}>('/supervisions',{method:'POST',body}); if(!editing){nav(`${base}/pengawasan/${d.supervision.id}`,{replace:true});} setMsg('Draft tersimpan.');return d.supervision.id;}catch(e:any){setMsg(e.message);return null;}finally{setBusy(false);}
  }
  async function saveItem(item:Item,result:'YES'|'NO'){
    if(!id){setMsg('Simpan data utama terlebih dahulu.');return;} const next={...item,result};setItems(xs=>xs.map(x=>x.item_code===item.item_code?next:x));
    try{await api(`/supervisions/${id}/items/${item.item_code}`,{method:'PUT',body:next});}catch(e:any){setMsg(e.message);}
  }
  async function finalize(){
    if(!id)return; if(!form.decision){setMsg('Pilih keputusan pengawasan sebelum finalisasi.');return;}
    setBusy(true);try{await api(`/supervisions/${id}/finalize`,{method:'POST',body:{decision:form.decision,findings:form.findings||null,recommendation_notes:form.recommendation_notes||null}});setStatus('FINAL');setMsg('Pengawasan berhasil difinalisasi.');}catch(e:any){setMsg(e.message);}finally{setBusy(false);}
  }
  const disabled=status==='FINAL';
  return <><Link to={`${base}/pengawasan`} className="btn ghost sm" style={{marginBottom:14}}>← Kembali</Link>{msg&&<div className="dash-msg" style={{marginBottom:12}}>{msg}</div>}
    <div className="dash-panel"><div className="dash-panel-head"><div><h3>{editing?'Detail Pengawasan':'Pengawasan Baru'}</h3>{editing&&<small>{form.reference} · {status}</small>}</div><button className="btn primary" disabled={busy||disabled} onClick={saveHeader}><Save size={15}/> Simpan draft</button></div>
    <div className="dash-grid cols-2">
      <label className="form-label">Nama PPIU *<input disabled={disabled} value={form.ppiu_name} onChange={e=>set('ppiu_name',e.target.value)}/></label>
      <label className="form-label">Nomor izin PPIU<input disabled={disabled} value={form.ppiu_license_number} onChange={e=>set('ppiu_license_number',e.target.value)}/></label>
      <label className="form-label">Petugas / penanggung jawab PPIU<input disabled={disabled} value={form.ppiu_officer_name} onChange={e=>set('ppiu_officer_name',e.target.value)}/></label>
      <label className="form-label">Bandara<input disabled={disabled} value={form.airport} onChange={e=>set('airport',e.target.value)}/></label>
      <label className="form-label">Tanggal pemeriksaan<input type="date" disabled={disabled} value={form.inspection_date} onChange={e=>set('inspection_date',e.target.value)}/></label>
      <label className="form-label">Maskapai<input disabled={disabled} value={form.airline} onChange={e=>set('airline',e.target.value)}/></label>
      <label className="form-label">Nomor penerbangan<input disabled={disabled} value={form.flight_number} onChange={e=>set('flight_number',e.target.value)}/></label>
      <label className="form-label">Rute<input disabled={disabled} value={form.route} onChange={e=>set('route',e.target.value)}/></label>
      <label className="form-label">Jenis penerbangan<select disabled={disabled} value={form.flight_type} onChange={e=>set('flight_type',e.target.value)}><option value="">Pilih</option><option value="DIRECT">Direct</option><option value="TRANSIT">Transit</option></select></label>
      <label className="form-label">Jumlah jemaah<input type="number" min="0" disabled={disabled} value={form.pilgrim_count} onChange={e=>set('pilgrim_count',e.target.value)}/></label>
      <label className="form-label">Jumlah petugas<input type="number" min="0" disabled={disabled} value={form.officer_count} onChange={e=>set('officer_count',e.target.value)}/></label>
      <label className="form-label">Alamat kantor PPIU<textarea rows={2} disabled={disabled} value={form.ppiu_address} onChange={e=>set('ppiu_address',e.target.value)}/></label>
    </div></div>
    {editing&&<div className="dash-panel" style={{marginTop:16}}><div className="dash-panel-head"><h3>Checklist Pengawasan</h3><small>Iya / Tidak dan catatan pemeriksaan</small></div>{Array.from(new Set(items.map(x=>x.section))).map(section=><div key={section} style={{marginBottom:20}}><b style={{fontSize:12}}>{section}</b>{items.filter(x=>x.section===section).map(item=><div key={item.item_code} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,padding:'12px 0',borderBottom:'1px solid var(--line)'}}><div><div style={{fontSize:12,fontWeight:700}}>{item.indicator}</div><input disabled={disabled} style={{marginTop:7,width:'100%'}} placeholder="Catatan pemeriksaan…" value={item.notes||''} onChange={e=>setItems(xs=>xs.map(x=>x.item_code===item.item_code?{...x,notes:e.target.value}:x))}/></div><div style={{display:'flex',gap:6,alignItems:'center'}}><button disabled={disabled} className={`btn sm ${item.result==='YES'?'primary':'ghost2'}`} onClick={()=>saveItem(item,'YES')}>Iya</button><button disabled={disabled} className={`btn sm ${item.result==='NO'?'primary':'ghost2'}`} onClick={()=>saveItem(item,'NO')}>Tidak</button></div></div>)}</div>)}</div>}
    {editing&&<div className="dash-panel" style={{marginTop:16}}><div className="dash-panel-head"><h3>Rekapitulasi Evaluasi & Temuan Khusus</h3></div><label className="form-label">Catatan / deskripsi temuan<textarea rows={4} disabled={disabled} value={form.findings||''} onChange={e=>set('findings',e.target.value)}/></label><label className="form-label">Rekomendasi pengawas<textarea rows={3} disabled={disabled} value={form.recommendation_notes||''} onChange={e=>set('recommendation_notes',e.target.value)}/></label><label className="form-label">Keputusan<select disabled={disabled} value={form.decision||''} onChange={e=>set('decision',e.target.value)}><option value="">Pilih keputusan</option><option value="DIIZINKAN_BERANGKAT">DIIZINKAN BERANGKAT</option><option value="CATATAN_PERBAIKAN">CATATAN / PERBAIKAN</option><option value="PENUNDAAN_PENINDAKAN">PENUNDAAN / PENINDAKAN</option></select></label><div className="dash-grid cols-2"><label className="form-label">Pengawas 1<input disabled={disabled} value={form.supervisor_1||''} onChange={e=>set('supervisor_1',e.target.value)}/></label><label className="form-label">Pengawas 2<input disabled={disabled} value={form.supervisor_2||''} onChange={e=>set('supervisor_2',e.target.value)}/></label></div><label className="form-label">Pihak yang diawasi<input disabled={disabled} value={form.supervised_party||''} onChange={e=>set('supervised_party',e.target.value)}/></label>{!disabled?<div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><button className="btn ghost2" onClick={saveHeader}>Simpan perubahan</button><button className="btn primary" disabled={busy} onClick={finalize}><CheckCircle2 size={16}/> Finalisasi Pengawasan</button></div>:<div className="dash-msg ok"><CheckCircle2 size={15}/> Pengawasan telah final dan dikunci.</div>}</div>}
  </>;
}
