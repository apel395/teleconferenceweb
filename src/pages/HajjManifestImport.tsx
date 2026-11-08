import {useEffect,useState} from 'react';
import {api} from '../lib/api';
import {binaryApi,downloadExcel} from '../lib/operations';

type Row=Record<string,string>;
type Preview={rows:Row[];total:number;valid:boolean;errors:{row:number;error:string}[];source_name:string};
type Import={id:string;source_title:string;hajj_year:number;completed_at:string};

export default function HajjManifestImport({year,onView}:{year:string;onView:()=>void}) {
 const [preview,setPreview]=useState<Preview|null>(null);
 const [fileKey,setFileKey]=useState(0);
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [imports,setImports]=useState<Import[]>([]);
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{let alive=true;api<{imports:Import[]}>(`/operations/manifests/meta?year=${encodeURIComponent(year)}`).then(d=>{if(alive)setImports(d.imports)}).catch(e=>{if(alive)setError((e as Error).message)});return()=>{alive=false}},[year,refresh]);
 async function run(fn:()=>Promise<void>){setError('');setMessage('');setBusy(true);try{await fn()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 function reset(){setPreview(null);setConfirmed(false);setFileKey(value=>value+1)}
 async function upload(file?:File){if(!file)return;reset();await run(async()=>{
  if(!/\.(xls|xlsx)$/i.test(file.name)||file.size>16*1024*1024)throw Error('File harus berupa .xls/.xlsx, maksimal 16 MB.');
  const response=await binaryApi('/operations/manifests/preview?year='+encodeURIComponent(year),{method:'POST',body:file,headers:{'Content-Type':'application/octet-stream','x-file-name':encodeURIComponent(file.name)}});
  if(!response.ok){const details=await response.json().catch(()=>({error:'Pratinjau gagal.'}));throw Error(details.error||'Pratinjau gagal.')}
  setPreview({...await response.json(),source_name:file.name});
 })}
 async function commit(){if(!preview||!preview.valid||!confirmed)return;await run(async()=>{
  const result=await api<{import_id:string;already_imported:boolean;total:number}>('/operations/manifests/import',{method:'POST',body:{hajj_year:Number(year),source_name:preview.source_name,rows:preview.rows,confirm:true}});
  reset();setRefresh(value=>value+1);
  setMessage(result.already_imported?'Manifest yang sama sudah tersimpan.':'Berhasil menyimpan '+result.total.toLocaleString('id-ID')+' jemaah ke manifest tahun '+year+'.');
 })}
 return <section className="spaced-panel">
  <h2>Impor jemaah haji · {year}</h2>
  <p>Semua tahun memakai tabel manifest jemaah yang sama. Tahun hanya menjadi filter; tidak ada pemisahan manifest lama dan baru.</p>
  {error&&<p role="alert" className="form-error">{error}</p>}
  {message&&<p role="status">{message}</p>}
  <div className="dash-panel spaced-panel">
   <h3>Unggah manifest Excel</h3>
   <p>Gunakan template agar nomor porsi, nama, jenis kelamin, kloter, dan status terbaca dengan benar. Nomor porsi harus disimpan sebagai teks. Baris 2026 tidak akan diubah saat mengimpor 2027.</p>
   <button type="button" className="btn light" disabled={busy} onClick={()=>void run(()=>downloadExcel('/data/manifests/template?format=xlsx&stage=PRE','template-manifest-haji.xlsx'))}>Unduh template Excel</button>
   <label>Pilih file .xls / .xlsx<input key={fileKey} type="file" accept=".xls,.xlsx" disabled={busy} onChange={e=>void upload(e.target.files?.[0])}/></label>
   {preview&&<div className="spaced-panel"><h4>Pratinjau · {preview.source_name}</h4><p>{preview.total.toLocaleString('id-ID')} baris · {preview.rows.length} valid · {preview.errors.length} kesalahan</p>
    {preview.errors.length>0&&<ul>{preview.errors.slice(0,50).map((item,index)=><li key={index}>Baris {item.row}: {item.error}</li>)}</ul>}
    <div className="table-wrap-live"><table className="table-live"><thead><tr><th>Nomor porsi</th><th>Nama</th><th>Kloter</th><th>Status sumber</th></tr></thead><tbody>{preview.rows.slice(0,30).map((row,index)=><tr key={`${row.porsi_number}-${index}`}><td>{row.porsi_number}</td><td>{row.full_name}</td><td>{row.kloter_code}</td><td>{row.status}</td></tr>)}</tbody></table></div>
    <p>Pratinjau menampilkan 30 baris pertama; impor akan mencakup semua baris valid pada berkas.</p>
    <label><input type="checkbox" checked={confirmed} disabled={busy||!preview.valid} onChange={e=>setConfirmed(e.target.checked)}/> Saya telah memeriksa bahwa data ini untuk tahun haji {year}.</label>
    <button type="button" className="btn primary" disabled={busy||!preview.valid||!confirmed} onClick={()=>void commit()}>Simpan manifest {year}</button>
   </div>}
  </div>
  <section className="dash-panel spaced-panel"><h3>Manifest tersimpan tahun {year}</h3>
   {imports.length?<ul>{imports.map(item=><li key={item.id}>{item.source_title} · {new Date(item.completed_at).toLocaleDateString('id-ID')}</li>)}</ul>:<p>Belum ada data manifest yang selesai diimpor untuk tahun ini.</p>}
   <button type="button" className="btn light" onClick={onView}>Lihat daftar jemaah</button>
  </section>
 </section>;
}
