import{createContext,useContext,useState}from'react';import type{ReactNode}from'react';
export type DemoStatus='Diajukan'|'Dijadwalkan'|'Siap Bergabung'|'Sedang Berlangsung'|'Selesai';
type Toast={id:number;message:string;type:'success'|'error'};
const Demo=createContext<{status:DemoStatus;setStatus:(s:DemoStatus)=>void;toast:(m:string,t?:'success'|'error')=>void}>({status:'Siap Bergabung',setStatus:()=>{},toast:()=>{}});
export function DemoProvider({children}:{children:ReactNode}){const[status,setStatusState]=useState<DemoStatus>(()=>(localStorage.getItem('kemenhaj-demo-status')as DemoStatus)||'Siap Bergabung');const[toasts,setToasts]=useState<Toast[]>([]);const setStatus=(s:DemoStatus)=>{setStatusState(s);localStorage.setItem('kemenhaj-demo-status',s)};const toast=(message:string,type:'success'|'error'='success')=>{const id=Date.now();setToasts(x=>[...x,{id,message,type}]);setTimeout(()=>setToasts(x=>x.filter(t=>t.id!==id)),2800)};return <Demo.Provider value={{status,setStatus,toast}}>{children}<div className="toast-stack" aria-live="polite">{toasts.map(t=><div className={'toast '+t.type}>{t.message}</div>)}</div></Demo.Provider>}
export const useDemo=()=>useContext(Demo);
