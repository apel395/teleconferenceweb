import {useEffect,useState,type FormEvent} from 'react';

const PAGE_SIZE=50;

export function PilgrimPager({page,total,busy,onChange}:{page:number;total:number;busy:boolean;onChange:(page:number)=>void}){
 const pageCount=Math.max(1,Math.ceil(total/PAGE_SIZE));
 const [target,setTarget]=useState(String(page));
 useEffect(()=>setTarget(String(page)),[page]);
 const start=total?(page-1)*PAGE_SIZE+1:0;
 const end=Math.min(page*PAGE_SIZE,total);

 function jump(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const next=Number(target);
  if(busy||!Number.isSafeInteger(next)||next<1||next>pageCount)return;
  if(next!==page)onChange(next);
 }

 return <nav className="manifest-pagination pilgrim-pagination" aria-label="Navigasi halaman data jemaah">
  <span>{total.toLocaleString('id-ID')} data · Menampilkan {start.toLocaleString('id-ID')}–{end.toLocaleString('id-ID')} · Halaman {page.toLocaleString('id-ID')} / {pageCount.toLocaleString('id-ID')}</span>
  <div className="pilgrim-pagination-actions">
   <button type="button" className="btn light" disabled={busy||page===1} onClick={()=>onChange(1)}>Pertama</button>
   <button type="button" className="btn light" disabled={busy||page===1} onClick={()=>onChange(page-1)}>Sebelumnya</button>
   <button type="button" className="btn light" disabled={busy||page>=pageCount} onClick={()=>onChange(page+1)}>Berikutnya</button>
   <button type="button" className="btn light" disabled={busy||page>=pageCount} onClick={()=>onChange(pageCount)}>Terakhir</button>
  </div>
  <form className="pilgrim-page-jump" onSubmit={jump}>
   <label htmlFor="pilgrim-page-target">Ke halaman</label>
   <input id="pilgrim-page-target" type="number" inputMode="numeric" min={1} max={pageCount} step={1} required value={target} disabled={busy} onChange={event=>setTarget(event.target.value)}/>
   <button type="submit" className="btn light" disabled={busy}>Buka halaman</button>
  </form>
 </nav>;
}
