import {Component,lazy,Suspense} from 'react';
import type {ReactNode} from 'react';

let dashboardImport:Promise<typeof import('../pages/LiveDashboard')>|null=null;
// Share the in-flight download between login and React.lazy. Allow a later attempt
// after a failed prefetch; never block authentication on this optional download.
export function preloadDashboard(){
 if(!dashboardImport)dashboardImport=import('../pages/LiveDashboard').catch(error=>{dashboardImport=null;throw error;});
 return dashboardImport;
}
const Dashboard=lazy(()=>preloadDashboard().then(module=>({default:module.LiveDashboard})));
class DashboardBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){
  if(this.state.failed)return <main className="section managed-form"><h1>Dashboard belum dapat ditampilkan</h1><p role="alert">Terjadi kendala saat membuka dashboard. Silakan muat ulang halaman.</p><button className="btn primary" onClick={()=>window.location.reload()}>Muat ulang dashboard</button><p><a href="/">Kembali ke beranda</a></p></main>;
  return this.props.children;
 }
}
export function DashboardEntry({base}:{base:string}){
 return <DashboardBoundary><Suspense fallback={<main className="section managed-form"><h1>Membuka dashboard</h1><p role="status">Menyiapkan halaman akun Anda…</p></main>}><Dashboard base={base}/></Suspense></DashboardBoundary>;
}
