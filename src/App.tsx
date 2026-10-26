import PublicForm,{PublicFeedback} from './components/PublicForm';
import TravelAccountRequest from './pages/TravelAccountRequest';
import {HelpPage,PilgrimLookupPage} from './pages/ServiceHelpPages';
import { useMemo, useState,Suspense } from 'react';
import {
  AlertTriangle, ArrowRight, BookOpenText, Building2, CalendarDays,
  CheckCircle2, ChevronRight, ClipboardCheck, ClipboardList, FileCheck2,
  FilePlus2, FileText, GraduationCap, Home, Landmark, ListChecks,
  LogIn, MapPinned, Menu, MessageCircleQuestion, MoonStar, Plane,
  Search, ShieldCheck, Users, X, Phone, Globe, Mail, Video
} from 'lucide-react';
import { BrowserRouter, Link, Navigate, Route, Routes, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { api } from './lib/api';
import { formContinuation, registrationForForm, loginForForm } from './lib/formDraft';
import VideoRequestPage from './pages/VideoRequestPage';
import { UmrahTravelForm } from './pages/UmrahTravelPages';
import {ContactAdminPage} from './pages/AccessSettings';
import PublicConsultationForm from './pages/PublicConsultationForm';
import { PpiuForm, PpiuTrack, ReturnReportEditor } from './pages/OperationsPages';
import ComplaintForm from './pages/ComplaintPages';
import {DirectoryPage,KnowledgePage,dashboardFor} from './pages/PortalPages';
import {DashboardEntry as LiveDashboard,preloadDashboard} from './components/DashboardEntry'; 
import { googleMeetUrl, legacyJitsiUrl } from './lib/meeting';
import './dashboard.css';

type Category = 'Pelaporan' | 'Perizinan & Travel' | 'Edukasi' | 'Konsultasi' | 'Informasi';
type Service = {
  slug: string;
  title: string;
  category: Category;
  description: string;
  audience: string;
  icon: typeof FileText;
  status?: 'public' | 'internal';
};

const services: Service[] = [
  {slug:'pengajuan-akun-travel',title:'Pengajuan Akun Admin Travel',category:'Perizinan & Travel',description:'Ajukan akun PPIU/PIHK: pemeriksaan izin terbit atau persyaratan izin dan visitasi.',audience:'Travel PPIU / PIHK',icon:FilePlus2,status:'public'},
  { slug:'pelaporan-travel-umrah', title:'Tiket Perjalanan Jemaah', category:'Pelaporan', description:'Pelaporan kegiatan operasional PPIU, keberangkatan, kepulangan, dan informasi layanan jemaah umrah.', audience:'PPIU / Travel Umrah', icon:Plane },
  { slug:'permasalahan-umrah-haji-khusus', title:'Pengaduan Jemaah', status:'public', category:'Pelaporan', description:'Kanal resmi untuk mencatat permasalahan penyelenggaraan, dokumen pendukung, dan tindak lanjut petugas.', audience:'Masyarakat / Penyelenggara', icon:AlertTriangle },
  { slug:'pemulangan-haji-reguler', title:'Pemulangan Jemaah Haji Reguler', category:'Pelaporan', description:'Monitoring kepulangan jemaah reguler berdasarkan kloter, jadwal, debarkasi, serta kabupaten/kota.', audience:'Petugas Haji', icon:ClipboardCheck },
  { slug:'manasik-kabupaten-kota', title:'Pelaporan Manasik Kabupaten/Kota', category:'Pelaporan', description:'Rekap pelaksanaan bimbingan manasik dari kabupaten/kota termasuk lokasi, jadwal, peserta, dan dokumentasi.', audience:'Kankemenag Kab/Kota', icon:GraduationCap },
  { slug:'perizinan-ppiu', title:'Pengajuan Perizinan PPIU', category:'Perizinan & Travel', description:'Pengajuan awal administrasi PPIU ke petugas Riau. Penerbitan izin mengikuti sistem nasional.', audience:'Penyelenggara', icon:FilePlus2 },
  { slug:'perizinan-kbihu', title:'Pengajuan Perizinan KBIHU', category:'Perizinan & Travel', description:'Pengajuan data dan dokumen KBIHU sebagai dasar konsultasi dan pemeriksaan administrasi di kantor.', audience:'KBIHU', icon:Landmark },
  { slug:'izin-cabang-ppiu', title:'Pelaporan Izin Cabang PPIU', category:'Perizinan & Travel', description:'Registrasi dan pelaporan kantor cabang PPIU di Provinsi Riau beserta dokumen pendukung.', audience:'PPIU', icon:Building2 },
  { slug:'direktori-travel-umrah', title:'Direktori Travel Umrah', category:'Perizinan & Travel', description:'Panduan memeriksa izin PPIU dan menyampaikan laporan jika ada travel yang bermasalah.', audience:'Masyarakat', icon:ListChecks, status:'public' },
  { slug:'tanya-jawab-fikih-haji', title:'Tanya Jawab Fikih Haji', category:'Edukasi', description:'Pusat pertanyaan dan jawaban fikih haji dan umrah yang disusun untuk kebutuhan praktis jemaah.', audience:'Masyarakat / Jemaah', icon:MessageCircleQuestion, status:'public' },
  { slug:'tutorial-manasik', title:'Tutorial Manasik', category:'Edukasi', description:'Panduan tahapan manasik haji dan umrah dalam format yang mudah dipelajari sebelum keberangkatan.', audience:'Jemaah', icon:GraduationCap, status:'public' },
  { slug:'bacaan-doa', title:'Bacaan Doa', category:'Edukasi', description:'Kumpulan bacaan doa perjalanan, ibadah haji, umrah, dan rangkaian manasik.', audience:'Jemaah', icon:MoonStar, status:'public' },
  {slug:'cek-data-jemaah',title:'Cek Data Jemaah',category:'Informasi',description:'Lihat kloter, tanggal dan jam keberangkatan menggunakan nomor porsi.',audience:'Jemaah',icon:Users,status:'public'},
  {slug:'bantuan',title:'Bantuan Penggunaan Layanan',category:'Informasi',description:'Petunjuk memakai layanan, FAQ, dan kontak petugas.',audience:'Masyarakat / Jemaah',icon:BookOpenText,status:'public'},
  {slug:'video-call',title:'Minta Video Call',category:'Konsultasi',description:'Ajukan konsultasi haji atau umrah dengan petugas tanpa membuat akun. Lihat jadwal dan masuk melalui Google Meet.',audience:'Jemaah / Masyarakat',icon:Video,status:'public'},
];

const globalCategories: {name:Category; desc:string; icon:typeof FileText}[] = [
  {name:'Pelaporan', desc:'Pelaporan operasional haji dan umrah dalam format yang seragam dan mudah ditelusuri.', icon:ClipboardList},
  {name:'Perizinan & Travel', desc:'Pengajuan dokumen, pelaporan cabang, dan informasi penyelenggara perjalanan ibadah.', icon:Landmark},
  {name:'Edukasi', desc:'Fikih, manasik, dan doa sebagai pusat pengetahuan resmi bagi jemaah.', icon:BookOpenText},
  {name:'Informasi',desc:'Cek data jemaah dan panduan menggunakan layanan.',icon:Users},
  {name:'Konsultasi',desc:'Minta video call untuk berbicara langsung dengan petugas mengenai haji dan umrah.',icon:Video},
];

const ORG_NAME='Kementerian Haji dan Umrah RI';
const ORG_OFFICE='Kantor Wilayah Kementerian Haji dan Umrah Provinsi Riau';
const ORG_ADDRESS='Jl. Mustafa Sari (Komplek Hotel Ratu Mayang Garden)';
const ORG_PHONE='0821-8428-2450';
const ORG_WEB='https://riau.haji.go.id';
const ORG_EMAIL='riau@haji.go.id';

function serviceRoles(slug:string){return slug==='pemulangan-haji-reguler'?['admin','operator']:slug==='manasik-kabupaten-kota'?['admin','operator','kabkota','kbihu']:slug==='perizinan-kbihu'?['admin','operator','kbihu']:['admin','operator','travel']}
function useVisibleServices(){return services.filter(s=>s.status==='public')}
function ServiceAccess({children,slug:fixed}:{children:React.ReactNode;slug?:string}){const {slug:routeSlug}=useParams();const slug=fixed||routeSlug||'';const {user,isAuth}=useAuth();if(slug==='permasalahan-umrah-haji-khusus')return <>{children}</>;if(!services.some(s=>s.slug===slug))return <Navigate to="/layanan" replace/>;if(!isAuth||!user)return <Navigate to="/masuk" replace/>;if(!serviceRoles(slug).includes(user.role))return <Navigate to={dashboardFor(user.role)} replace/>;const path=slug==='pelaporan-travel-umrah'?'tiket-perjalanan':slug==='pemulangan-haji-reguler'?'laporan-kloter':slug==='manasik-kabupaten-kota'?'manasik':'perizinan';return <Navigate to={`${dashboardFor(user.role)}/${path}`} replace/>}

function Brand({light}:{light?:boolean}){
  return <Link to="/" className={'brand'+(light?' light':'')} aria-label={ORG_OFFICE}><img className="brand-logo" src="/logo-kemenhaj.png" alt="Logo Kemenhaj Riau"/><span className="brand-copy"><b>KEMENHAJ&nbsp;Riau</b><small>{light?ORG_OFFICE:'Kantor Wilayah Provinsi Riau'}</small></span></Link>;
}

function Header(){
  const [open,setOpen]=useState(false);
  return <header className="site-header"><div className="header-inner"><Brand/><nav className={open?'main-nav open':'main-nav'}><Link to="/" onClick={()=>setOpen(false)}>Beranda</Link><Link to="/layanan" onClick={()=>setOpen(false)}>Layanan</Link><Link to="/bantuan" onClick={()=>setOpen(false)}>Bantuan</Link><Link className="mobile-nav-account" to="/masuk" onClick={()=>setOpen(false)}>Masuk</Link><Link className="mobile-nav-account" to="/hubungi-admin" onClick={()=>setOpen(false)}>Hubungi Admin</Link><Link to="/tentang" onClick={()=>setOpen(false)}>Tentang</Link><Link className="nav-video" to="/request-video-call" onClick={()=>setOpen(false)}><Video size={17}/> Minta Video Call</Link></nav><div className="header-actions"><Link className="btn primary header-video" to="/request-video-call"><Video size={17}/> Video Call</Link><Link to="/masuk" className="btn ghost header-login"><LogIn size={16}/> Masuk</Link><Link to="/hubungi-admin" className="btn gold header-register">Hubungi Admin</Link></div><button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label={open?'Tutup menu':'Buka menu'} aria-expanded={open}>{open?<X/>:<Menu/>}</button></div></header>
}

function Footer(){return <footer className="site-footer"><div className="footer-grid"><div className="footer-brand"><Brand light/><p>Portal layanan digital untuk pelaporan, administrasi penyelenggara, dan edukasi haji & umrah di Provinsi Riau.</p><div className="footer-contact"><span><strong>{ORG_NAME}</strong></span><span>{ORG_OFFICE}</span><span>{ORG_ADDRESS}, Pekanbaru, Riau</span><span>Telp: {ORG_PHONE}</span><span><a href={ORG_WEB} target="_blank" rel="noreferrer">{ORG_WEB}</a> · <a href={'mailto:'+ORG_EMAIL}>{ORG_EMAIL}</a></span></div></div><div><b>Layanan</b><Link to="/layanan">Semua layanan</Link><Link to="/direktori-travel">Direktori travel</Link><Link to="/bantuan">Bantuan penggunaan</Link><Link to="/layanan/cek-data-jemaah">Cek Data Jemaah</Link></div><div><b>Informasi</b><Link to="/tentang">Tentang layanan</Link><Link to="/cek-status">Cek status pengajuan</Link><Link to="/layanan/permasalahan-umrah-haji-khusus">Laporkan masalah</Link><Link to="/masuk">Area petugas</Link></div><div><b>Prinsip layanan</b><p>Data terstruktur, status dapat ditelusuri, dan proses administrasi tetap mengikuti ketentuan serta verifikasi petugas.</p></div></div><div className="footer-bottom"><span>© 2026 {ORG_OFFICE}</span><span>Portal Layanan Haji & Umrah · {ORG_WEB}</span></div></footer>}

function Layout({children}:{children:React.ReactNode}){ return <><Header/><main>{children}</main><Footer/></> }

function HomePage(){const visible=useVisibleServices();return <Layout><section className="hero"><div className="hero-content"><span className="eyebrow"><ShieldCheck size={15}/> Portal layanan wilayah Riau</span><h1>Layanan <em>Haji & Umrah</em> dalam satu pintu.</h1><p>Sampaikan pengaduan, pelajari materi ibadah, cek data jemaah, atau berbicara dengan petugas. Pilih layanan yang Anda perlukan.</p><div className="hero-actions"><Link to="/layanan/permasalahan-umrah-haji-khusus" className="btn primary large">Pengaduan Jemaah</Link><Link to="/request-video-call" className="btn gold large"><Video size={21}/> Minta Video Call</Link></div><p><Link to="/bantuan">Pertama kali menggunakan aplikasi? Baca panduan layanan</Link></p></div><div className="hero-panel"><h2>Layanan untuk masyarakat</h2><p>Layanan publik dapat diakses tanpa membuat akun.</p><Link className="summary-row" to="/layanan/cek-data-jemaah"><Users/><span><b>Cek Data Jemaah</b><small>Nomor porsi untuk kloter dan jadwal keberangkatan</small></span><ChevronRight/></Link><Link className="summary-row" to="/layanan/tanya-jawab-fikih-haji"><BookOpenText/><span><b>Tanya Jawab Fikih Haji</b><small>Materi, FAQ dan chat dengan petugas</small></span><ChevronRight/></Link><Link className="summary-row" to="/bantuan"><MessageCircleQuestion/><span><b>Bantuan Penggunaan</b><small>Langkah menggunakan setiap layanan</small></span><ChevronRight/></Link></div></section><section className="section soft"><div className="section-heading"><div><span className="kicker">Layanan publik</span><h2>Apa yang dapat kami bantu?</h2></div><p>Semua layanan untuk masyarakat tersedia di bawah ini.</p></div><div className="service-grid">{visible.map(service=><ServiceCard key={service.slug} service={service}/>)}</div></section><section className="travel-banner"><div><span className="kicker light">Untuk lembaga dan petugas</span><h2>Pelaporan dan administrasi sesuai kewenangan.</h2><p>Travel PPIU/PIHK, KBIHU, Kemenhaj kabupaten/kota, serta petugas dapat masuk ke dashboard masing-masing.</p></div><Link className="btn gold" to="/masuk">Masuk ke dashboard <ArrowRight size={16}/></Link></section></Layout>}

function ServiceCard({service}:{service:Service}){const I=service.icon;return <Link to={service.slug==='video-call'?'/request-video-call':`/layanan/${service.slug}`} className="service-card"><div className="service-card-top"><span className="service-icon"><I size={21}/></span>{service.status==='public'&&<span className="public-badge">Publik</span>}</div><h3>{service.title}</h3><p>{service.description}</p><div className="service-meta"><span>{service.audience}</span><ArrowRight size={16}/></div></Link>}

function ServicesPage(){const services=useVisibleServices();const categories=globalCategories.filter(c=>services.some(s=>s.category===c.name));const [query,setQuery]=useState('');const [params,setParams]=useSearchParams();const selected=params.get('category');const cat:'Semua'|Category=categories.some(c=>c.name===selected)?selected as Category:'Semua';const setCat=(value:'Semua'|Category)=>{const next=new URLSearchParams(params);if(value==='Semua')next.delete('category');else next.set('category',value);setParams(next);};const filtered=useMemo(()=>services.filter(s=>(cat==='Semua'||s.category===cat)&&(`${s.title} ${s.description} ${s.audience}`.toLowerCase().includes(query.toLowerCase()))),[query,cat,services]);return <Layout><PageHero kicker="Katalog layanan" title="Layanan Haji & Umrah" text="Pilih layanan berdasarkan kebutuhan pelaporan, administrasi penyelenggara, atau edukasi jemaah."/><section className="section catalog"><div className="catalog-toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari layanan..."/></div><div className="filter-tabs">{(['Semua',...categories.map(c=>c.name)] as const).map(x=><button className={cat===x?'active':''} onClick={()=>setCat(x)} key={x}>{x}</button>)}</div></div><div className="service-grid">{filtered.map(s=><ServiceCard service={s} key={s.slug}/>)}</div>{!filtered.length&&<div className="empty-state"><Search/><b>Layanan tidak ditemukan</b><span>Coba kata kunci atau kategori lain.</span></div>}</section></Layout>}

function ServiceDetail(){const {slug}=useParams();const category=slug==='tanya-jawab-fikih-haji'?'FIKIH':slug==='tutorial-manasik'?'MANASIK':slug==='bacaan-doa'?'DOA':null;if(category)return <Layout><section className="section"><KnowledgePage key={category} category={category}/></section></Layout>;if(slug==='bantuan')return <Layout><section className="section"><HelpPage/></section></Layout>;if(slug==='cek-data-jemaah')return <Layout><section className="section"><PilgrimLookupPage/></section></Layout>;if(slug==='video-call')return <Navigate to="/request-video-call" replace/>;if(slug==='direktori-travel-umrah')return <Navigate to="/direktori-travel" replace/>;if(slug==='permasalahan-umrah-haji-khusus')return <Layout><ComplaintForm/></Layout>;return <ServiceAccess><></></ServiceAccess>}

function TravelDirectory(){return <Layout><section className="section"><DirectoryPage/></section></Layout>}
function EducationPage(){return <Layout><section className="section"><KnowledgePage/></section></Layout>}

function LoginPage(){
  const { login, isAuth, user } = useAuth();
  const [params]=useSearchParams();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function onSubmit(e:React.FormEvent){e.preventDefault();setError('');setLoading(true);void preloadDashboard().catch(()=>{});try{await login(email,password)}catch(err){setError(err instanceof Error?err.message:'Gagal masuk')}finally{setLoading(false)}}
  const dest = dashboardFor(user?.role);
  const requested=params.get('lanjut');
  const continuation=formContinuation(requested,user?.role)||dest;
  if (isAuth && user) return <Navigate to={continuation} replace />;
  return <Layout><section className="login-section"><div className="login-card"><div className="login-brand"><img className="brand-logo" src="/logo-kemenhaj.png" alt="Logo Kemenhaj Riau"/><div><b>Area Petugas</b><span>Kantor Wilayah Kemenhaj Provinsi Riau</span></div></div>
  <><h1>Masuk ke sistem</h1><p>Akses dashboard operasional, register laporan, dan tindak lanjut layanan.</p>{!error&&params.get('sesi')==='berakhir'&&<div className="form-error" role="status">Sesi Anda telah berakhir. Silakan masuk kembali untuk melihat pengajuan dan laporan.</div>}<form onSubmit={onSubmit}>{error&&<div className="form-error" role="alert">{error}</div>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@kemenhaj.go.id" required/></label><label>Kata sandi<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></label><button className="btn primary full" disabled={loading}>{loading?'Memproses...':'Masuk'} <ArrowRight size={16}/></button></form><section className="signup-callout" aria-label="Pembuatan akun"><h2>Butuh akun lembaga?</h2><p>Untuk travel PPIU/PIHK, ajukan akun dan berkas melalui layanan publik. Akun dibuat Kanwil setelah verifikasi.</p><Link className="btn gold full" to="/pengajuan-akun-travel">Ajukan Akun Admin Travel <ArrowRight size={18}/></Link></section><small>Akses diberikan sesuai akun dan kewenangan petugas yang terdaftar.</small></>
  </div></section></Layout>}

function AboutPage(){return <Layout><PageHero kicker="Tentang portal" title="Portal Layanan Haji & Umrah Provinsi Riau" text="Layanan informasi jemaah dan administrasi penyelenggara dalam satu aplikasi."/><section className="section prose"><h2>Untuk jemaah dan masyarakat</h2><p>Gunakan pengaduan, direktori penyelenggara, materi fikih, tutorial manasik, bacaan doa, cek data jemaah, serta konsultasi dengan petugas.</p><h2>Untuk lembaga dan petugas</h2><p>Dashboard mendukung pemantauan perjalanan, manifest jemaah, pelaporan manasik, administrasi perizinan, penugasan petugas dan tindak lanjut layanan sesuai kewenangan masing-masing.</p><h2>Profil dan pejabat Kanwil</h2><p>Informasi pejabat dapat dilihat pada situs resmi Kanwil Kementerian Haji dan Umrah Provinsi Riau.</p><a className="btn primary" href="https://riau.haji.go.id/profil/pejabat" target="_blank" rel="noopener noreferrer">Lihat profil pejabat Kanwil</a><p><Link to="/bantuan">Bantuan penggunaan layanan</Link> · <Link to="/hubungi-admin">Hubungi Admin</Link></p></section></Layout>}

function PageHero({kicker,title,text}:{kicker:string;title:string;text:string}){return <section className="page-hero"><span className="kicker">{kicker}</span><h1>{title}</h1><p>{text}</p></section>}

const TRACK_STATUS:Record<string,string>={menunggu:'Menunggu',dijadwalkan:'Dijadwalkan',berlangsung:'Berlangsung',selesai:'Selesai',dibatalkan:'Dibatalkan'};

function TrackStatus(){
  const [params]=useSearchParams();
  const [ref,setRef]=useState(params.get('ref')||'');
  const [email,setEmail]=useState(params.get('email')||'');
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const [result,setResult]=useState<{consultation:any;meeting:any}|null>(null);

  function fmt(d:string|null){if(!d)return '—';try{return new Date(d).toLocaleString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch{return d}}
  const meetingURL = !['selesai','dibatalkan'].includes(result?.consultation?.status || '') ? (googleMeetUrl(result?.meeting?.meeting_url) || legacyJitsiUrl(result?.meeting?.meeting_url)) : null;

  async function search(e:React.FormEvent){
    e.preventDefault();
    setErr('');setResult(null);
    if(!ref.trim()||!email.trim()){setErr('Masukkan nomor referensi dan email pengajuan Anda.');return}
    setBusy(true);
    try{
      const q=`reference=${encodeURIComponent(ref.trim())}&guest_email=${encodeURIComponent(email.trim())}`;
      const d=await api<{consultation:any;meeting:any}>(`/consultations/track?${q}`);
      setResult(d);
    }catch(ex){setErr(ex instanceof Error?ex.message:'Gagal memuat status pengajuan.')}
    finally{setBusy(false)}
  }

  return <Layout><PageHero kicker="Cek status pengajuan" title="Lacak pengajuan layanan Anda" text="Masukkan nomor referensi dan email yang dipakai saat mengajukan layanan untuk melihat status dan jadwal pertemuan."/><section className="section"><div className="track-wrap"><PublicFeedback error={err} busy={busy} message={result?"Status pengajuan berhasil dimuat.":""}/><PublicForm className="track-form" onSubmit={search}><label>Nomor referensi<input value={ref} onChange={e=>setRef(e.target.value)} placeholder="KHU-RIAU-2026XXXX-XXXX" required/></label><label>Email pengajuan<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required/></label>{err&&<div className="form-error" role="alert">{err}</div>}<button className="btn primary" disabled={busy}>{busy?'Memeriksa…':'Cek status'} <ArrowRight size={16}/></button></PublicForm>{result&&(<div className="track-result"><div className="track-head"><div><b>{result.consultation.reference}</b><span>{result.consultation.topic}</span></div><span className={'track-status '+result.consultation.status}>{TRACK_STATUS[result.consultation.status]||result.consultation.status}</span></div><dl><div><dt>Diajukan</dt><dd>{fmt(result.consultation.created_at)}</dd></div><div><dt>Pemohon</dt><dd>{result.consultation.guest_name||'—'}</dd></div><div><dt>Deskripsi</dt><dd>{result.consultation.description}</dd></div>{result.meeting?<div><dt>Jadwal pertemuan</dt><dd>{fmt(result.meeting.scheduled_at)}</dd></div>:<div><dt>Jadwal pertemuan</dt><dd>Belum dijadwalkan</dd></div>}</dl>{meetingURL?(<a className="btn gold join-call" href={meetingURL}><Video size={22}/> Masuk Video Call</a>):<div className="track-wait"><CalendarDays size={18}/><span>{['selesai','dibatalkan'].includes(result.consultation.status)?'Pertemuan telah ditutup.':'Petugas kantor akan menghubungi Anda setelah jadwal pertemuan dibuat.'}</span></div>}{result.consultation.completion_notes&&<div className="track-notes"><b>Catatan tindak lanjut:</b> {result.consultation.completion_notes}</div>}</div>)}</div></section></Layout>;
}

function App(){return <BrowserRouter><AuthProvider><Suspense fallback={<main className="section"><p role="status">Memuat layanan…</p></main>}><Routes><Route path="/" element={<HomePage/>}/><Route path="/bantuan" element={<Layout><section className="section"><HelpPage/></section></Layout>}/><Route path="/layanan/cek-data-jemaah" element={<Layout><section className="section"><PilgrimLookupPage/></section></Layout>}/><Route path="/layanan/pengaduan-jemaah" element={<Navigate to="/layanan/permasalahan-umrah-haji-khusus" replace/>}/><Route path="/layanan/direktori-travel" element={<Navigate to="/direktori-travel" replace/>}/><Route path="/layanan/minta-video-call" element={<Navigate to="/request-video-call" replace/>}/><Route path="/layanan" element={<ServicesPage/>}/><Route path="/layanan/:slug" element={<ServiceDetail/>}/><Route path="/layanan/pelaporan-pemulangan/pengajuan" element={<ServiceAccess slug="pelaporan-pemulangan"><ReturnReportEditor publicEntry/></ServiceAccess>}/><Route path="/layanan/pemulangan-haji-reguler/pengajuan" element={<ServiceAccess slug="pemulangan-haji-reguler"><ReturnReportEditor publicEntry/></ServiceAccess>}/><Route path="/layanan/pelaporan-travel-umrah/pengajuan" element={<ServiceAccess slug="pelaporan-travel-umrah"><UmrahTravelForm key="departure-public" kind="DEPARTURE" publicEntry/></ServiceAccess>}/><Route path="/layanan/pemulangan-travel-umrah/pengajuan" element={<ServiceAccess slug="pemulangan-travel-umrah"><UmrahTravelForm key="return-public" kind="RETURN" publicEntry/></ServiceAccess>}/><Route path="/daftar-travel" element={<Navigate to="/pengajuan-akun-travel" replace/>}/><Route path="/layanan/perizinan-ppiu" element={<Navigate to="/pengajuan-akun-travel" replace/>}/><Route path="/pengajuan-akun-travel" element={<Layout><section className="section"><TravelAccountRequest/></section></Layout>}/><Route path="/layanan/pengajuan-akun-travel" element={<Navigate to="/pengajuan-akun-travel" replace/>}/><Route path="/layanan/perizinan-ppiu/pengajuan" element={<Navigate to="/pengajuan-akun-travel" replace/>}/><Route path="/hubungi-admin" element={<Layout><ContactAdminPage/></Layout>}/><Route path="/operator/*" element={<LiveDashboard base="/operator"/>}/><Route path="/petugas-haji/*" element={<LiveDashboard base="/petugas-haji"/>}/><Route path="/layanan/permasalahan-umrah-haji-khusus/pengajuan" element={<Layout><ComplaintForm/></Layout>}/><Route path="/layanan/:slug/pengajuan" element={<ServiceAccess><PublicConsultationForm/></ServiceAccess>}/><Route path="/cek-izin-ppiu" element={<PpiuTrack/>}/><Route path="/direktori-travel" element={<TravelDirectory/>}/><Route path="/edukasi" element={<EducationPage/>}/><Route path="/masuk" element={<LoginPage/>}/><Route path="/tentang" element={<AboutPage/>}/><Route path="/cek-status" element={<TrackStatus/>}/><Route path="/request-video-call" element={<VideoRequestPage/>}/><Route path="/dashboard/*" element={<LiveDashboard base="/dashboard"/>}/><Route path="/konsultan/*" element={<LiveDashboard base="/konsultan"/>}/><Route path="/admin/*" element={<LiveDashboard base="/admin"/>}/><Route path="/kabkota/*" element={<LiveDashboard base="/kabkota"/>}/><Route path="/kbihu/*" element={<LiveDashboard base="/kbihu"/>}/><Route path="/staff/*" element={<LiveDashboard base="/staff"/>}/><Route path="/travel/*" element={<LiveDashboard base="/travel"/>}/><Route path="/pengawas/*" element={<LiveDashboard base="/pengawas"/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense></AuthProvider></BrowserRouter>}
export default App;

