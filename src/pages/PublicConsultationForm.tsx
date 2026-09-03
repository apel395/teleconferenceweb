import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { api } from '../lib/api';

type ServiceSummary = {
  slug: string;
  title: string;
};

const services: ServiceSummary[] = [
  { slug:'pelaporan-travel-umrah', title:'Pelaporan Travel Umrah' },
  { slug:'pelaporan-jemaah-haji-khusus', title:'Pelaporan Jemaah Haji Khusus' },
  { slug:'pelaporan-pemulangan', title:'Pelaporan Pemulangan' },
  { slug:'pemulangan-haji-reguler', title:'Pemulangan Jemaah Haji Reguler' },
  { slug:'pemulangan-petugas-haji', title:'Pemulangan Petugas Haji' },
  { slug:'permasalahan-umrah-haji-khusus', title:'Permasalahan Umrah & Haji Khusus' },
  { slug:'manasik-kabupaten-kota', title:'Pelaporan Manasik Kabupaten/Kota' },
  { slug:'perizinan-ppiu', title:'Pengajuan Perizinan PPIU' },
  { slug:'perizinan-kbihu', title:'Pengajuan Perizinan KBIHU' },
  { slug:'izin-cabang-ppiu', title:'Pelaporan Izin Cabang PPIU' },
  { slug:'direktori-travel-umrah', title:'Direktori Travel Umrah' },
];

export default function PublicConsultationForm() {
  const { slug } = useParams();
  const matched = services.find((s) => s.slug === slug);

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<{ reference: string } | null>(null);

  if (!matched) {
    return <Navigate to="/layanan" replace />;
  }
  const service: ServiceSummary = matched;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = await api<{ consultation: { reference: string } }>('/consultations/public', {
        method: 'POST',
        body: {
          topic: service.title,
          description,
          guest_name: name,
          guest_email: email || undefined,
          guest_phone: whatsapp || undefined,
          preferred_date: undefined,
          preferred_time: undefined,
        },
      });
      setSuccess({ reference: data.consultation.reference });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim permohonan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-section">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">KH</span>
          <div><b>Pengajuan Layanan</b><span>Kemenhaj Provinsi Riau</span></div>
        </div>

        {!success ? (
          <>
            <h1>{service.title}</h1>
            <p>Kirim data dan dokumen untuk ditindaklanjuti petugas sesuai proses layanan yang berlaku.</p>
            <form onSubmit={onSubmit}>
              {error && <div className="form-error" role="alert">{error}</div>}
              <label>
                Nama lengkap
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" required />
              </label>
              <label>
                Nomor WhatsApp
                <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08xxxxxxxxxx" required />
              </label>
              <label>
                Email (opsional)
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
              </label>
              <label>
                Penjelasan kebutuhan
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan kebutuhan atau permasalahan yang ingin ditindaklanjuti."
                  required
                  rows={5}
                  style={{ display: 'block', width: '100%', marginTop: 6, border: '1px solid var(--line)', borderRadius: 9, padding: 11, outline: 0, font: 'inherit', resize: 'vertical' }}
                />
              </label>
              <button className="btn primary full" disabled={saving}>
                {saving ? 'Mengirim...' : 'Kirim pengajuan'} <ArrowRight size={16} />
              </button>
            </form>
            <small>Dengan mengirim, Anda menyatakan informasi yang diberikan sesuai kondisi dan dokumen yang tersedia.</small>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginTop: 22 }}>
              <CheckCircle2 size={46} color="#50735a" />
              <h1>Pengajuan terkirim</h1>
              <p>Simpan nomor referensi berikut untuk penelusuran status pengajuan Anda.</p>
              <div style={{ background: '#faf6f0', border: '1px solid var(--line)', borderRadius: 12, padding: '16px', margin: '18px 0', fontSize: 20, fontWeight: 800, letterSpacing: '.04em', color: '#3a2b21', fontFamily: "'Manrope',sans-serif" }}>
                {success.reference}
              </div>
              <Link to="/" className="btn primary full">
                <FileText size={16} /> Kembali ke beranda
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
