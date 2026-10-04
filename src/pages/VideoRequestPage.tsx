import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function VideoRequestPage() {
  const {user} = useAuth();
  const [form,setForm] = useState({guest_name:user?.name || '',guest_phone:'',guest_email:user?.email || '',description:'',preferred_date:'',preferred_time:''});
  const [reference,setReference] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const localToday = new Date();
  const today = `${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
  function field(key:keyof typeof form,value:string) {setForm(old=>({...old,[key]:value}))}
  async function submit(e:React.FormEvent) {
    e.preventDefault();setError('');setBusy(true);
    try {
      const d = await api<{consultation:{reference:string}}>('/consultations/public',{method:'POST',body:{...form,guest_name:form.guest_name.trim(),guest_phone:form.guest_phone.trim(),guest_email:form.guest_email.trim().toLowerCase(),description:form.description.trim(),topic:'Konsultasi Video Call',preferred_date:form.preferred_date || null,preferred_time:form.preferred_time || null}});
      setReference(d.consultation.reference);
    } catch(e) {setError(e instanceof Error?e.message:'Permintaan belum terkirim. Silakan coba lagi.')}
    finally {setBusy(false)}
  }
  return <main className="login-section video-request managed-forms"><div className="login-card">
    <Link to="/">← Beranda</Link>
    {reference ? <div role="status"><CheckCircle2 size={42} color="#50735a"/><h1>Permintaan terkirim</h1><p>Simpan nomor ini. Petugas akan menentukan jadwal video call Anda.</p><div className="request-reference">{reference}</div><p>Gunakan email <strong>{form.guest_email}</strong> untuk melihat jadwal. Setelah dijadwalkan, tekan <strong>Masuk Video Call</strong>.</p><Link className="btn primary full" to={`/cek-status?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(form.guest_email.trim().toLowerCase())}`}>Lihat jadwal saya</Link></div> : <>
      <h1><Video size={28}/> Minta Video Call</h1><p>Ingin berbicara dengan petugas tentang haji atau umrah? Isi formulir ini. Tidak perlu membuat akun.</p>
      <form className="managed-form" onSubmit={submit}><fieldset disabled={busy}>
        <label>Nama lengkap<input required maxLength={150} autoComplete="name" value={form.guest_name} onChange={e=>field('guest_name',e.target.value)}/></label>
        <label>Nomor WhatsApp<input required type="tel" maxLength={30} autoComplete="tel" placeholder="08xxxxxxxxxx" value={form.guest_phone} onChange={e=>field('guest_phone',e.target.value)}/></label>
        <label>Email untuk cek jadwal<input required type="email" maxLength={254} autoComplete="email" value={form.guest_email} onChange={e=>field('guest_email',e.target.value)}/><small>Boleh menggunakan email keluarga yang membantu Anda.</small></label>
        <label>Apa yang ingin ditanyakan?<textarea required rows={3} maxLength={4000} placeholder="Contoh: Saya ingin bertanya tentang persiapan keberangkatan haji." value={form.description} onChange={e=>field('description',e.target.value)}/></label>
        <details><summary>Pilih waktu yang diinginkan (opsional)</summary><p>Jadwal akhir akan dikonfirmasi oleh petugas.</p><div className="form-grid"><label>Tanggal<input type="date" min={today} value={form.preferred_date} onChange={e=>field('preferred_date',e.target.value)}/></label><label>Jam (WIB)<input type="time" disabled={!form.preferred_date} value={form.preferred_time} onChange={e=>field('preferred_time',e.target.value)}/></label></div></details>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary full">{busy?'Mengirim…':'Kirim permintaan video call'}</button>
      </fieldset></form>
      <p>Sudah mengirim? <Link to="/cek-status">Lihat jadwal saya</Link></p>
    </>}
  </div></main>;
}
