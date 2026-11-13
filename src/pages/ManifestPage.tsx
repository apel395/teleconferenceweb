import { useEffect, useRef, useState } from 'react';
import { Search, RefreshCw, Users, AlertTriangle, X } from 'lucide-react';
import { api } from '../lib/api';

type Import = {id:string;source_title:string;hajj_year:number;completed_at:string};
type Summary = {total:number;unique_porsi:number;male:number;female:number;age_60_plus:number;needs_review:number;regions:string[];kloters:{code:string;total:number}[]};
type Entry = {id:string;seat_number:number|null;porsi_number:string;full_name:string;region:string|null;gender:string|null;age:number|null;pilgrim_status:string|null;journey_status:string|null;data_quality:string[];group:{kloter_code:string;source_sheet?:string};[key:string]:unknown};
const flags:Record<string,string> = {duplicate_porsi_across_kloters:'Nomor porsi tercatat di beberapa kloter',gender_missing:'Jenis kelamin belum lengkap',region_missing:'Daerah asal belum lengkap'};
const number = (n:number) => n.toLocaleString('id-ID');
const initialFilters = {q:'',kloter:'',region:'',gender:'',review:'',status:''};
const journeyStatuses:Record<string,string>={BELUM_BERANGKAT:'Belum berangkat',SUDAH_BERANGKAT:'Sudah berangkat',SUDAH_PULANG:'Sudah pulang',DIBATALKAN:'Dibatalkan'};
const journeyText=(value:string|null|undefined)=>value?journeyStatuses[value]||'Belum dikonfirmasi':'Belum dikonfirmasi';

export default function ManifestPage({year,embedded=false}:{year?:string;embedded?:boolean}={}) {
  const [imports,setImports] = useState<Import[]>([]);
  const [selected,setSelected] = useState('');
  const [summary,setSummary] = useState<Summary|null>(null);
  const [filters,setFilters] = useState(initialFilters);
  const [search,setSearch] = useState('');
  const [page,setPage] = useState(1);
  const [size,setSize] = useState(50);
  const [rows,setRows] = useState<Entry[]>([]);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [reload,setReload] = useState(0);
  const [detail,setDetail] = useState<Entry|null>(null);
  const [detailLoading,setDetailLoading] = useState(false);
  const [detailError,setDetailError] = useState('');
  const [statusDraft,setStatusDraft] = useState('');
  const [statusSaving,setStatusSaving] = useState(false);
  const [statusMessage,setStatusMessage] = useState('');
  const detailPanel = useRef<HTMLDivElement>(null);
  const detailTrigger = useRef<HTMLButtonElement|null>(null);
  const detailRequest = useRef(0);
  useEffect(()=>{if(detail || detailLoading || detailError)detailPanel.current?.focus()},[detail,detailLoading,detailError]);
  function closeDetail(){detailRequest.current++;setDetailLoading(false);setDetail(null);setDetailError('');detailTrigger.current?.focus()}
  function detailKeyDown(e:React.KeyboardEvent<HTMLDivElement>){
    if(e.key==='Escape'){closeDetail();return}
    if(e.key!=='Tab')return;
    const focusable=detailPanel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),a[href]');
    if(!focusable?.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
  useEffect(()=>{
    let alive = true;setError('');setSummary(null);setLoading(true);
    const metadataFilter = new URLSearchParams();
    if(year)metadataFilter.set('year',year);
    if(selected && !year)metadataFilter.set('import_id',selected);
    api<{imports:Import[];selected:Import|null;summary:Summary|null}>(`/operations/manifests/meta?${metadataFilter}`)
      .then(d=>{if(alive){
        const options=d.imports.filter(item=>!year||String(item.hajj_year)===year);
        const chosen=options.find(item=>item.id===selected)||options[0];
        setImports(options);
        if(!chosen){setSelected('');setSummary(null);setRows([]);setTotal(0);setLoading(false);return}
        if(!year && chosen.id!==selected){setSelected(chosen.id);return}
        setSummary(d.summary);
      }})
      .catch(e=>{if(alive){setError(e.message);setLoading(false)}});
    return ()=>{alive=false};
  },[selected,reload,year]);
  useEffect(()=>{
    if(!selected && !year)return;
    let alive = true;setLoading(true);setError('');setRows([]);
    const params = new URLSearchParams({page:String(page),size:String(size),...filters});
    if(selected && !year)params.set('import_id',selected);
    if(year)params.set('year',year);
    api<{entries:Entry[];total:number}>(`/operations/manifests?${params}`)
      .then(d=>{if(alive){setRows(d.entries);setTotal(d.total)}})
      .catch(e=>{if(alive)setError(e.message)})
      .finally(()=>{if(alive)setLoading(false)});
    return ()=>{alive=false};
  },[selected,page,size,filters,reload,year]);
  function filter(key:keyof typeof filters,value:string){setPage(1);setFilters(old=>({...old,[key]:value}))}
  async function openDetail(id:string,trigger:HTMLButtonElement){const request=++detailRequest.current;detailTrigger.current=trigger;setDetail(null);setDetailError('');setStatusMessage('');setDetailLoading(true);try{const d=await api<{entry:Entry}>(`/operations/manifests/${id}`);if(request===detailRequest.current){setDetail(d.entry);setStatusDraft(d.entry.journey_status||'')}}catch(e){if(request===detailRequest.current)setDetailError(e instanceof Error?e.message:'Gagal memuat rincian.')}finally{if(request===detailRequest.current)setDetailLoading(false)}}
  async function saveStatus(){if(!detail||!statusDraft)return;setStatusSaving(true);setDetailError('');setStatusMessage('');try{await api(`/operations/manifests/${detail.id}/status`,{method:'PATCH',body:{status:statusDraft}});setDetail({...detail,journey_status:statusDraft});setStatusMessage('Status perjalanan berhasil diperbarui.');setReload(value=>value+1)}catch(e){setDetailError((e as Error).message)}finally{setStatusSaving(false)}}
  const pages = Math.max(1,Math.ceil(total/size));
  const detailFields:[string,string][] = [['porsi_number','Nomor porsi'],['gender','Jenis kelamin'],['age','Usia'],['region','Kabupaten / kota'],['pilgrim_status','Peran jemaah'],['seat_number','Nomor urut'],['embarkation','Embarkasi'],['rombongan_number','Rombongan'],['regu_number','Regu'],['passport_number','Nomor paspor'],['visa_number','Nomor visa'],['syarikah','Syarikah'],['preliminary_kloter','Kloter pra'],['remarks','Keterangan'],['additional_notes','Catatan tambahan']];
  return <div className="dash-page managed-forms manifest-page">
    <div className="dash-page-head"><div>{!embedded&&<h1>Data Jemaah</h1>}<p>Daftar jemaah {year||'haji'} dari seluruh impor yang selesai. Nomor porsi ganda ditampilkan sekali; riwayat sumber tetap tersimpan.</p></div><button className="btn light" onClick={()=>setReload(n=>n+1)} disabled={loading}><RefreshCw size={16}/> Muat ulang</button></div>
    {embedded&&<p className="pilgrim-filter-help" role="status">Status perjalanan diverifikasi oleh Kanwil sesuai musim haji. Kolom peran jemaah berbeda dari status perjalanan.</p>}
    {!embedded&&imports.length>0 && <label className="manifest-source">Sumber data<select value={selected} onChange={e=>{setSelected(e.target.value);setPage(1);setFilters(initialFilters);setSearch('');closeDetail()}}>{imports.map(i=><option value={i.id} key={i.id}>{i.source_title} · {new Date(i.completed_at).toLocaleDateString('id-ID')}</option>)}</select></label>}
    {summary && <div className="manifest-stats">{[['Catatan jemaah',summary.total],['Nomor porsi unik',summary.unique_porsi],['Laki-laki',summary.male],['Perempuan',summary.female],['Usia 60+',summary.age_60_plus],['Perlu diperiksa',summary.needs_review]].map(([label,value])=><div key={label}><span>{label}</span><strong>{number(Number(value))}</strong></div>)}</div>}
    <section className="dash-panel">
      <form className="manifest-filters" onSubmit={e=>{e.preventDefault();filter('q',search)}}><label>Nama / nomor porsi<input type="search" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari jemaah…"/></label><label>Kloter<select value={filters.kloter} onChange={e=>filter('kloter',e.target.value)}><option value="">Semua kloter</option>{summary?.kloters.map(k=><option value={k.code} key={k.code}>{k.code} ({number(k.total)})</option>)}</select></label><label>Daerah asal<select value={filters.region} onChange={e=>filter('region',e.target.value)}><option value="">Semua daerah</option>{summary?.regions.map(r=><option value={r} key={r}>{r}</option>)}</select></label><label>Jenis kelamin<select value={filters.gender} onChange={e=>filter('gender',e.target.value)}><option value="">Semua</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></label><label>Status perjalanan<select value={filters.status} onChange={e=>filter('status',e.target.value)}><option value="">Semua status</option>{Object.entries(journeyStatuses).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label><label>Pemeriksaan<select value={filters.review} onChange={e=>filter('review',e.target.value)}><option value="">Semua data</option><option value="1">Perlu diperiksa</option></select></label><button className="btn primary"><Search size={16}/> Cari</button><button className="btn light" type="button" onClick={()=>{setFilters(initialFilters);setSearch('');setPage(1)}}>Reset</button></form>
      {error ? <p className="form-error" role="alert">{error}</p> : loading ? <p role="status">Memuat data jemaah…</p> : !selected && !year ? <div className="empty-live"><Users/><b>Belum ada manifest selesai diimpor.</b></div> : <>
        <p className="manifest-count">{number(total)} catatan sesuai filter · Klik Rincian untuk melihat dokumen dan data rombongan.</p>
        {!rows.length ? <div className="empty-live"><Search/><b>Jemaah tidak ditemukan</b><span>Coba ubah pencarian atau filter.</span></div> : <div className="table-wrap-live"><table className="table-live manifest-table"><thead><tr><th>Kloter</th><th>Nama jemaah / nomor porsi</th><th>Daerah asal</th><th>L/P</th><th>Usia</th><th>Peran</th><th>Status perjalanan</th><th>Pemeriksaan</th><th>Aksi</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.group.kloter_code}</td><td><strong>{r.full_name}</strong><small>{r.porsi_number}</small></td><td>{r.region || '—'}</td><td>{r.gender || '—'}</td><td>{r.age ?? '—'}</td><td>{r.pilgrim_status || '—'}</td><td>{journeyText(r.journey_status)}</td><td>{r.data_quality.length ? <span className="manifest-warning" title={r.data_quality.map(f=>flags[f]||f).join('; ')}><AlertTriangle size={14}/> Periksa</span> : '—'}</td><td><button className="btn light sm" onClick={e=>void openDetail(r.id,e.currentTarget)} disabled={detailLoading}>Rincian</button></td></tr>)}</tbody></table></div>}
        <div className="manifest-pagination"><label>Baris per halaman<select value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1)}}>{[25,50,100].map(n=><option key={n} value={n}>{n}</option>)}</select></label><span>Halaman {page} / {pages}</span><div><button className="btn light" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Sebelumnya</button> <button className="btn light" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Berikutnya</button></div></div>
      </>}
    </section>
    {(detail || detailLoading || detailError) && <div className="manifest-detail-overlay" onClick={e=>{if(e.target===e.currentTarget)closeDetail()}}><div className="dash-panel manifest-detail-panel" ref={detailPanel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Rincian jemaah" onKeyDown={detailKeyDown}><div className="dash-panel-head"><h2>{detail?.full_name || 'Rincian jemaah'}</h2><button className="btn light" aria-label="Tutup rincian" onClick={closeDetail}><X size={18}/></button></div>{detailLoading?<p>Memuat rincian…</p>:!detail?<p className="form-error" role="alert">{detailError}</p>:<><p><strong>{detail.group.kloter_code}</strong> · {detail.group.source_sheet} · Baris sumber {String(detail.source_row)}</p>{detail.data_quality.length>0 && <p className="form-error">{detail.data_quality.map(f=>flags[f]||f).join('; ')}</p>}<div className="spaced-panel"><label>Status perjalanan<select value={statusDraft} onChange={e=>setStatusDraft(e.target.value)} disabled={statusSaving}><option value="">Belum dikonfirmasi</option>{Object.entries(journeyStatuses).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label><button type="button" className="btn primary" disabled={statusSaving||!statusDraft||statusDraft===detail.journey_status} onClick={()=>void saveStatus()}>Simpan status</button>{statusMessage&&<p role="status">{statusMessage}</p>}{detailError&&<p role="alert" className="form-error">{detailError}</p>}</div><dl className="manifest-details">{detailFields.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{detail[key]==null || detail[key]===''?'—':String(detail[key])}</dd></div>)}</dl></>}</div></div>}
  </div>;
}
