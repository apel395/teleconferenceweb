import {useState} from 'react';
import {api} from '../lib/api';
export default function EvidenceLink({path,label}:{path:string;label:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[fallback,setFallback]=useState('');
 async function open(){
  // Reserve the tab during the click to avoid asynchronous popup blocking.
  const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;
  setBusy(true);setError('');setFallback('');
  try{const d=await api<{url:string}>(path);const u=new URL(d.url);if(u.protocol!=='https:'||u.username||u.password)throw Error('Tautan bukti tidak valid.');if(tab)tab.location.replace(u.href);else setFallback(u.href)}catch(e){tab?.close();setError((e as Error).message)}finally{setBusy(false)}
 }
 return <span><button type="button" className="btn light" disabled={busy} onClick={()=>void open()}>{busy?'Menyiapkan bukti…':label}</button>{fallback&&<a href={fallback} target="_blank" rel="noopener noreferrer">Buka bukti di tab baru</a>}{error&&<span role="alert">{error}</span>}</span>;
}
