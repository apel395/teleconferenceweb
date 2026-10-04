import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

type Company = { id:string; name:string; nib:string|null; office_address:string|null };
type Account = { id:string; name:string; email:string; role:string; company_id:string|null };
type Application = { id:string; reference:string; company_name:string; status:string; review_notes:string|null; created_at:string };
const roles = [
  {value:'admin',label:'Administrator',description:'Mengelola akun, peran, perusahaan, dan seluruh layanan.'},
  {value:'staff',label:'Staf',description:'Mengelola laporan kepulangan kloter dan pengajuan awal PPIU.'},
  {value:'travel',label:'Perusahaan travel',description:'Mengajukan dan melihat riwayat PPIU milik satu perusahaan.'},
  {value:'konsultan',label:'Konsultan',description:'Menindaklanjuti konsultasi dan menjadwalkan video call.'},
  {value:'pengawas',label:'Pengawas',description:'Mengisi dan menindaklanjuti pengawasan PPIU.'},
  {value:'pengguna',label:'Jemaah / masyarakat',description:'Mengajukan konsultasi dan mengikuti video call.'},
];
const roleLabel = (role:string) => roles.find(r=>r.value===role)?.label || role;
const emptyAccount = {name:'',email:'',password:'',role:'staff',company_id:''};
const message = (e:unknown,fallback:string) => e instanceof Error ? e.message : fallback;

function RoleEditor({account,companies,onSave,disabled}:{account:Account;companies:Company[];onSave:(role:string,company:string)=>Promise<void>;disabled:boolean}) {
  const [role,setRole] = useState(account.role);
  const [company,setCompany] = useState(account.company_id || '');
  const [busy,setBusy] = useState(false);
  useEffect(()=>{setRole(account.role);setCompany(account.company_id || '')},[account.role,account.company_id]);
  const changed = role!==account.role || (role==='travel' && company!==account.company_id);
  async function submit(e:React.FormEvent) { e.preventDefault();setBusy(true);try{await onSave(role,company)}finally{setBusy(false)} }
  return <form className="role-editor" onSubmit={submit}>
    <label>Peran<select aria-label={`Peran ${account.name}`} value={role} disabled={busy} onChange={e=>{setRole(e.target.value);setCompany(account.company_id || '')}}>{roles.map(r=><option key={r.value} value={r.value} disabled={disabled && r.value!=='admin'}>{r.label}</option>)}</select></label>
    {role==='travel' && <label>Perusahaan<select aria-label={`Perusahaan ${account.name}`} required value={company} disabled={busy} onChange={e=>setCompany(e.target.value)}><option value="">Pilih perusahaan</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
    <button className="btn primary" disabled={busy || !changed || (disabled && role!=='admin')}>{busy?'Menyimpan…':'Simpan peran'}</button>
  </form>;
}

export function AccountsPage() {
  const {user} = useAuth();
  const [companies,setCompanies] = useState<Company[]>([]);
  const [users,setUsers] = useState<Account[]>([]);
  const [company,setCompany] = useState({name:'',nib:'',office_address:''});
  const [account,setAccount] = useState(emptyAccount);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState<'company'|'account'|null>(null);
  const [query,setQuery] = useState('');
  async function load() {
    setLoading(true);
    try {
      const [c,u] = await Promise.all([api<{companies:Company[]}>('/users/companies'),api<{users:Account[]}>('/users')]);
      setCompanies(c.companies);setUsers(u.users);
    } catch(e) { setError(message(e,'Gagal memuat akun.')); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load()},[]);
  async function addCompany(e:React.FormEvent) {
    e.preventDefault();setBusy('company');setError('');setNotice('');
    try { await api('/users/companies',{method:'POST',body:company});setCompany({name:'',nib:'',office_address:''});setNotice('Perusahaan ditambahkan. Anda dapat memilihnya untuk akun travel.');await load(); }
    catch(e) { setError(message(e,'Gagal menyimpan perusahaan.')); }
    finally { setBusy(null); }
  }
  async function addAccount(e:React.FormEvent) {
    e.preventDefault();setBusy('account');setError('');setNotice('');
    try { await api('/users',{method:'POST',body:account});setAccount(emptyAccount);setNotice('Akun dibuat. Sampaikan akses awal melalui kanal resmi.');await load(); }
    catch(e) { setError(message(e,'Gagal membuat akun.')); }
    finally { setBusy(null); }
  }
  async function change(target:Account,role:string,company_id:string) {
    setError('');setNotice('');
    try { await api(`/users/${target.id}/role`,{method:'PATCH',body:{role,company_id:role==='travel'?company_id:null}});setNotice(`Peran ${target.name} disimpan: ${roleLabel(role)}.`);await load(); }
    catch(e) { setError(message(e,'Gagal mengubah akses.')); }
  }
  const filtered = users.filter(u=>`${u.name} ${u.email} ${roleLabel(u.role)}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="dash-page managed-forms">
    <div className="dash-page-head"><div><h1>Akun & pengaturan peran</h1><p>Buat akun, tentukan kewenangan, dan hubungkan akun travel ke perusahaannya.</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-notice" role="status">{notice}</p>}
    <div className="account-panels">
      <section className="dash-panel"><h2>Tambah perusahaan travel</h2><p>Daftarkan perusahaan sebelum membuat akun travel.</p>
        <form className="managed-form" onSubmit={addCompany}><fieldset disabled={busy!==null}>
          <label>Nama perusahaan<input required maxLength={200} value={company.name} placeholder="Contoh: Travel Company Test" onChange={e=>setCompany({...company,name:e.target.value})}/></label>
          <label>NIB (opsional)<input maxLength={40} value={company.nib} onChange={e=>setCompany({...company,nib:e.target.value})}/></label>
          <label>Alamat kantor<textarea rows={3} maxLength={1000} value={company.office_address} onChange={e=>setCompany({...company,office_address:e.target.value})}/></label>
          <button className="btn primary">{busy==='company'?'Menyimpan…':'Simpan perusahaan'}</button>
        </fieldset></form>
        {!loading && !error && <p>{companies.length} perusahaan terdaftar.</p>}
      </section>
      <section className="dash-panel"><h2>Buat akun</h2><form className="managed-form" onSubmit={addAccount}><fieldset disabled={busy!==null || loading}>
        <div className="form-grid"><label>Nama lengkap<input required value={account.name} placeholder="Contoh: Staff Test" onChange={e=>setAccount({...account,name:e.target.value})}/></label>
        <label>Email<input required type="email" autoComplete="off" value={account.email} onChange={e=>setAccount({...account,email:e.target.value})}/></label></div>
        <label>Sandi awal<input required minLength={12} type="password" autoComplete="new-password" value={account.password} onChange={e=>setAccount({...account,password:e.target.value})}/><small>Minimal 12 karakter.</small></label>
        <label>Peran<select value={account.role} onChange={e=>setAccount({...account,role:e.target.value,company_id:''})}>{roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select><small>{roles.find(r=>r.value===account.role)?.description}</small></label>
        {account.role==='travel' && <label>Perusahaan<select required value={account.company_id} onChange={e=>setAccount({...account,company_id:e.target.value})}><option value="">Pilih perusahaan</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{!companies.length && <small>Tambahkan perusahaan terlebih dahulu.</small>}</label>}
        <button className="btn primary">{busy==='account'?'Membuat…':'Buat akun'}</button>
      </fieldset></form></section>
    </div>
    <section className="dash-panel spaced-panel"><h2>Pengaturan peran akun</h2><p>Pilih peran dan klik Simpan peran. Akun travel wajib terhubung ke perusahaan. Peran admin akun sendiri tetap dipertahankan.</p>
      <label className="account-search">Cari akun<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama, email, atau peran"/></label>
      {loading ? <p role="status">Memuat akun…</p> : error ? <button className="btn light" onClick={()=>{setError('');void load()}}>Muat ulang data</button> : <>
        {!filtered.length && <p>Tidak ada akun yang sesuai.</p>}
        {filtered.map(u=><article className="account-row" key={u.id}><div className="account-identity"><strong>{u.name}{u.id===user?.id?' (Anda)':''}</strong><span>{u.email}</span><span className="role-badge">{roleLabel(u.role)}</span>{u.company_id && <small>{companies.find(c=>c.id===u.company_id)?.name || 'Perusahaan tidak ditemukan'}</small>}</div><RoleEditor account={u} companies={companies} disabled={u.id===user?.id} onSave={(role,c)=>change(u,role,c)}/></article>)}
      </>}
      <details className="role-guide"><summary>Rincian kewenangan peran</summary>{roles.map(r=><p key={r.value}><strong>{r.label}:</strong> {r.description}</p>)}</details>
    </section>
  </div>;
}

export function TravelPage() {
  const [items,setItems]=useState<Application[]>([]);const [form,setForm]=useState({applicant_name:'',applicant_phone:'',office_address:'',description:''});
  const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);try{const d=await api<{applications:Application[]}>('/operations/ppiu/my');setItems(d.applications)}catch(e){setError(message(e,'Gagal memuat pengajuan.'))}finally{setLoading(false)}}
  useEffect(()=>{void load()},[]);
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setNotice('');try{const d=await api<{application:Application}>('/operations/ppiu/my',{method:'POST',body:form});setNotice(`Pengajuan ${d.application.reference} diterima.`);setForm({applicant_name:'',applicant_phone:'',office_address:'',description:''});await load()}catch(e){setError(message(e,'Gagal mengirim.'))}finally{setBusy(false)}}
  return <div className="dash-page managed-forms"><div className="dash-page-head"><div><h1>Pengajuan perusahaan travel</h1><p>Pengajuan dan riwayat terhubung dengan perusahaan akun ini. Pengajuan awal belum menerbitkan izin.</p></div></div>{error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-notice" role="status">{notice}</p>}<section className="dash-panel"><h2>Pengajuan awal PPIU</h2><form className="managed-form" onSubmit={submit}><fieldset disabled={busy}><div className="form-grid"><label>Nama penanggung jawab<input required value={form.applicant_name} onChange={e=>setForm({...form,applicant_name:e.target.value})}/></label><label>Telepon / WhatsApp<input type="tel" required value={form.applicant_phone} onChange={e=>setForm({...form,applicant_phone:e.target.value})}/></label></div><label>Alamat kantor (bila belum tercatat)<input value={form.office_address} onChange={e=>setForm({...form,office_address:e.target.value})}/></label><label>Uraian pengajuan<textarea required rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><button className="btn primary">{busy?'Mengirim…':'Kirim pengajuan'}</button></fieldset></form></section><section className="dash-panel spaced-panel"><h2>Riwayat perusahaan</h2>{loading?<p>Memuat riwayat…</p>:!error&&!items.length&&<p>Belum ada pengajuan perusahaan ini.</p>}{items.map(item=><article className="account-row" key={item.id}><div><strong>{item.reference}</strong><p>{item.company_name} · {item.status}</p>{item.review_notes&&<p>Catatan petugas: {item.review_notes}</p>}</div></article>)}</section></div>;
}
