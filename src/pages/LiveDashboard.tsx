import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays, CalendarPlus, CheckCircle2, ClipboardCheck, ClipboardList, FileText, LayoutDashboard,
  LogOut, Menu, MessageSquare, Phone, RefreshCw, Users, Video, X
} from 'lucide-react';
import { api, getUser } from '../lib/api';
import { googleMeetUrl, legacyJitsiUrl } from '../lib/meeting';
import { useAuth } from '../hooks/useAuth';
import { SupervisionForm, SupervisionList } from './SupervisionPages';
import { OperationsDashboard, ReturnReportEditor } from './OperationsPages';

/* ---------- Types ---------- */
type Consultation = {
  id: string;
  user_id: string | null;
  konsultan_id: string | null;
  topic: string;
  description: string;
  reference: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  profiles?: { name?: string; email?: string } | { name?: string; email?: string }[] | null;
  konsultan?: { name?: string } | { name?: string }[] | null;
};
type Meeting = {
  id: string;
  consultation_id: string;
  konsultan_id: string;
  scheduled_at: string;
  meeting_url: string | null;
  created_at: string;
  consultations?: {
    topic?: string;
    reference?: string | null;
    guest_name?: string | null;
    user_id?: string | null;
    status?: string;
    profiles?: { name?: string } | { name?: string }[] | null;
  } | null;
};
type Booking = { consultation: Consultation; meeting?: Meeting };

/* ---------- Helpers ---------- */
function nameOf(c: Consultation): string {
  const p: any = c.profiles;
  const pn = Array.isArray(p) ? p?.[0]?.name : p?.name;
  return c.guest_name || pn || 'Pengguna';
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    menunggu: 'Menunggu', dijadwalkan: 'Dijadwalkan',
    berlangsung: 'Berlangsung', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
  };
  return map[s] || s;
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}
function horario(d: string | null | undefined) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
}
function statusPill(s: string) {
  return <span className={`status-pill ${s}`}>{statusLabel(s)}</span>;
}
function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map((x) => x[0] || '').join('').toUpperCase() || '?';
}

// Pelaporan services are processed as documents (no video call). Konsultasi
// services (perizinan & travel, dst.) use scheduled video meetings.
const PELAPORAN_TOPICS = new Set([
  'Pelaporan Travel Umrah',
  'Pelaporan Jemaah Haji Khusus',
  'Pelaporan Pemulangan',
  'Pemulangan Jemaah Haji Reguler',
  'Pemulangan Petugas Haji',
  'Permasalahan Umrah & Haji Khusus',
  'Pelaporan Manasik Kabupaten/Kota',
  'Pengajuan Perizinan PPIU dan KBIHU',
  'Pelaporan Izin Cabang PPIU',
  'List Travel Umrah',
  'List Travel Umrah (termasuk travel bermasalah)',
]);
function isPelaporan(c: { topic?: string }): boolean {
  return PELAPORAN_TOPICS.has(c.topic || '');
}

/* ---------- Shell ---------- */
function useRole(base: string): 'pengguna' | 'konsultan' | 'admin' | 'pengawas' {
  if (base === '/konsultan') return 'konsultan';
  if (base === '/admin') return 'admin';
  if (base === '/pengawas') return 'pengawas';
  return 'pengguna';
}

export function DashboardShell({ base, children }: { base: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout: clearAuth } = useAuth();
  const role = useRole(base);
  const isAdmin = role === 'admin';
  const isCons = role === 'konsultan';
  const isSupervisor = role === 'pengawas';

  const nav: { to: string; label: string; icon: React.ReactNode }[] = [];
  if (isAdmin) {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/pengajuan`, label: 'Pengajuan & Laporan', icon: <ClipboardList size={17} /> });
    nav.push({ to: `${base}/laporan-kloter`, label: 'Kepulangan Kloter', icon: <FileText size={17} /> });
    nav.push({ to: `${base}/izin-ppiu`, label: 'Izin PPIU', icon: <ClipboardCheck size={17} /> });
    nav.push({ to: `${base}/pengawasan`, label: 'Pengawasan', icon: <ClipboardCheck size={17} /> });
    nav.push({ to: `${base}/konsultasi`, label: 'Konsultasi', icon: <MessageSquare size={17} /> });
    nav.push({ to: `${base}/video`, label: 'Video Call', icon: <Video size={17} /> });
  } else if (isCons) {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/penjadwalan`, label: 'Penjadwalan', icon: <CalendarDays size={17} /> });
    nav.push({ to: `${base}/konsultasi`, label: 'Konsultasi', icon: <MessageSquare size={17} /> });
    nav.push({ to: `${base}/video`, label: 'Video Call', icon: <Video size={17} /> });
  } else if (isSupervisor) {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/pengawasan`, label: 'Pengawasan', icon: <ClipboardCheck size={17} /> });
  } else {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/konsultasi`, label: 'Konsultasi Saya', icon: <MessageSquare size={17} /> });
    nav.push({ to: `${base}/video`, label: 'Video Call', icon: <Video size={17} /> });
  }

  const roleLabel = isAdmin ? 'Administrator' : isCons ? 'Konsultan' : isSupervisor ? 'Pengawas' : 'Pengguna';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function logout() {
    clearAuth();
    navigate('/masuk');
  }

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar ${open ? 'open' : ''}`}>
        <div className="dash-side-top">
          <Link to="/" className="dash-brand"><img className="brand-logo" src="/logo-kemenhaj.png" alt="Logo Kemenhaj Riau"/><span className="brand-copy"><b>KEMENHAJ&nbsp;Riau</b><small>Portal Riau</small></span></Link>
          <div className="dash-role"><Users size={14} /> {roleLabel}</div>
        </div>
        <nav className="dash-nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setOpen(false)}>
              {n.icon}{n.label}
            </NavLink>
          ))}
          <Link to="/" onClick={() => setOpen(false)}><FileText size={17} /> Situs publik</Link>
        </nav>
        <div className="dash-side-foot">
          <div className="dash-user">
            <span className="avatar">{initials(user?.name || '?')}</span>
            <div><b>{user?.name || 'Pengguna'}</b><span>{user?.email}</span></div>
          </div>
          <button className="dash-logout" onClick={logout}><LogOut size={14} /> Keluar</button>
        </div>
      </aside>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 55 }} onClick={() => setOpen(false)} />}
      <div className="dash-main">
        <header className="dash-topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={18} /></button>
          <div>
            <h1>{nav[0]?.label}</h1>
            <p>{today}</p>
          </div>
          <div className="dash-top-actions">
            <span className="dash-date">{roleLabel}</span>
            <span className="dash-avatar">{initials(user?.name || '?')}</span>
          </div>
        </header>
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Data hooks ---------- */
function useConsultations() {
  const [list, setList] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = () => {
    setLoading(true);
    setError('');
    api<{ consultations: Consultation[] }>('/consultations')
      .then((d) => setList(d.consultations || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
    const refresh = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(interval);
    };
  }, []);
  return { list, loading, error, reload };
}
function useStats() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    api<{ stats: Record<string, number> }>('/consultations/stats')
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, []);
  return stats;
}
function useMeetings() {
  const [list, setList] = useState<Meeting[]>([]);
  useEffect(() => {
    api<{ meetings: Meeting[] }>('/meetings')
      .then((d) => setList(d.meetings || []))
      .catch(() => {});
  }, []);
  return list;
}

/* ---------- Overview ---------- */
function Overview({ base }: { base: string }) {
  const { list, reload } = useConsultations();
  const meetings: Meeting[] = [];
  const role = useRole(base);
  const isStaff = role === 'admin' || role === 'konsultan' || role === 'pengawas';

  const menunggu = list.filter((c) => c.status === 'menunggu').length;
  const dijadwalkan = list.filter((c) => c.status === 'dijadwalkan').length;
  const berlangsung = list.filter((c) => c.status === 'berlangsung').length;
  const selesai = list.filter((c) => c.status === 'selesai').length;
  const next = list.filter((c) => c.status === 'menunggu' || c.status === 'dijadwalkan')[0];

  const statCards = isStaff
    ? [
        { label: 'Total konsultasi', value: String(list.length), cls: '' },
        { label: 'Menunggu', value: String(menunggu), cls: 'gold' },
        { label: 'Dijadwalkan', value: String(dijadwalkan), cls: 'green' },
        { label: 'Berlangsung', value: String(berlangsung), cls: 'red' },
      ]
    : [
        { label: 'Konsultasi saya', value: String(list.length), cls: '' },
        { label: 'Menunggu', value: String(menunggu), cls: 'gold' },
        { label: 'Dijadwalkan', value: String(dijadwalkan), cls: 'green' },
        { label: 'Selesai', value: String(selesai), cls: 'green' },
      ];

  return (
    <>
      <div className="dash-grid cols-4">
        {statCards.map((s) => (
          <div className={`stat-card ${s.cls}`} key={s.label}>
            <span className="stat-icon"><CheckCircle2 size={20} /></span>
            <div><b>{s.value}</b><span>{s.label}</span></div>
          </div>
        ))}
      </div>

      <div className="dash-grid cols-2" style={{ marginTop: 16 }}>
        <div className="dash-panel">
          <div className="dash-panel-head"><h3>Konsultasi terbaru</h3><Link className="btn ghost sm" to={`${base}/konsultasi`}>Lihat semua</Link></div>
          {list.length === 0 ? (
            <div className="empty-live"><span>Belum ada konsultasi.</span></div>
          ) : (
            <div className="table-wrap-live">
              <table className="table-live">
                <thead><tr><th>Ref</th><th>Topik</th><th>Pemohon</th><th>Status</th></tr></thead>
                <tbody>
                  {list.slice(0, 6).map((c) => (
                    <tr className="row-link" key={c.id} onClick={() => (window.location.href = `${base}/konsultasi/${c.id}`)}>
                      <td><b>{c.reference || '—'}</b></td>
                      <td>{c.topic}</td>
                      <td>{nameOf(c)}</td>
                      <td>{statusPill(c.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head"><h3>Jadwal pertemuan</h3><span className="count">{meetings.length}</span></div>
          {meetings.length === 0 ? (
            <div className="empty-live"><span>Belum ada pertemuan yang dijadwalkan.</span></div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {meetings.slice(0, 6).map((m) => (
                <Link to={`${base}/konsultasi/${m.consultation_id}`} key={m.id} className="dash-panel" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <span className="stat-icon gold"><Video size={18} /></span>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 12, color: '#33251d' }}>{fmtDate(m.scheduled_at)} {horario(m.scheduled_at)} WIB</b>
                    <small style={{ display: 'block', color: '#8a7e76', fontSize: 10 }}>Pertemuan daring</small>
                  </div>
                  <span className="status-pill siap">Siap</span>
                </Link>
              ))}
            </div>
          )}
          {isStaff && menunggu > 0 && (
            <Link className="btn primary full" style={{ marginTop: 14 }} to={`${base}/konsultasi?filter=menunggu`}>
              <CalendarPlus size={16} /> Atur jadwal menunggu
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Scheduling (konsultan) ---------- */
function SchedulingView({ base }: { base: string }) {
  const { list, loading, reload } = useConsultations();
  const [q, setQ] = useState('');
  const [schedAt, setSchedAt] = useState<Record<string, string>>({});
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  const waiting = list
    .filter((c) => c.status === 'menunggu')
    .filter((c) => !isPelaporan(c))
    .filter((c) => `${c.topic} ${c.reference || ''} ${nameOf(c)}`.toLowerCase().includes(q.toLowerCase()));

  function jadwalkan(c: Consultation) {
    const at = schedAt[c.id];
    if (!at) { setMsg((m) => ({ ...m, [c.id]: { ok: false, text: 'Pilih tanggal dan waktu pertemuan dahulu.' } })); return; }
    const link = googleMeetUrl(meetLinks[c.id]);
    if (!link) { setMsg((m) => ({ ...m, [c.id]: { ok: false, text: 'Masukkan link Google Meet yang valid.' } })); return; }
    setBusy((b) => ({ ...b, [c.id]: true }));
    setMsg((m) => ({ ...m, [c.id]: { ok: true, text: '' } }));
    api<{ meeting: Meeting }>('/meetings', { method: 'POST', body: { consultation_id: c.id, scheduled_at: new Date(at).toISOString(), meeting_url: link } })
      .then(() => { setMsg((m) => ({ ...m, [c.id]: { ok: true, text: 'Jadwal dan link Google Meet tersimpan.' } })); setSchedAt((s) => ({ ...s, [c.id]: '' })); reload(); })
      .catch((e: Error) => setMsg((m) => ({ ...m, [c.id]: { ok: false, text: e.message } })))
      .finally(() => setBusy((b) => ({ ...b, [c.id]: false })));
  }

  return (
    <>
      <div className="dash-section-title">Penjadwalan pertemuan</div>
      <div className="dash-panel" style={{ paddingBottom: 8 }}>
        <div className="dash-panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3>Pengajuan menunggu jadwal</h3>
            <span className="count">{waiting.length}</span>
          </div>
          <button className="btn ghost2 sm" onClick={reload}><RefreshCw size={14} /> Muat ulang</button>
        </div>
        <p style={{ fontSize: 11, color: '#8a7e76' }}>Buat link di <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer">Google Meet</a> → Rapat baru → Buat rapat untuk nanti, lalu tempel link di bawah.</p>
        <div className="search-box" style={{ width: '100%', maxWidth: 'none', margin: '0 0 14px' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari ref, topik, atau pemohon…" />
        </div>
        {loading ? (
          <div className="empty-live"><b>Memuat…</b></div>
        ) : waiting.length === 0 ? (
          <div className="empty-live"><ClipboardList size={26} /><b>Tidak ada pengajuan menunggu</b><span>Semua permintaan sudah dijadwalkan.</span></div>
        ) : (
          <div className="table-wrap-live">
            <table className="table-live">
              <thead><tr><th>Ref</th><th>Topik / pemohon</th><th>Status</th><th>Jadwal &amp; link Meet</th><th></th></tr></thead>
              <tbody>
                {waiting.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.reference || '—'}</b></td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{c.topic}</div>
                      <small style={{ color: '#9a8c83', fontSize: 10 }}>
                        {nameOf(c)}{c.preferred_date ? ` · ${fmtDate(c.preferred_date)}${c.preferred_time ? ` ${c.preferred_time}` : ''}` : ' · tanpa preferensi'}
                      </small>
                    </td>
                    <td>{statusPill(c.status)}</td>
                    <td>
                      <input type="datetime-local" value={schedAt[c.id] || ''} onChange={(e) => setSchedAt((s) => ({ ...s, [c.id]: e.target.value }))} style={{ maxWidth: 215 }} />
                      <input type="url" value={meetLinks[c.id] || ''} onChange={(e) => setMeetLinks((s) => ({ ...s, [c.id]: e.target.value }))} placeholder="https://meet.google.com/xxx-xxxx-xxx" aria-label="Link Google Meet" style={{ marginTop: 6, minWidth: 250 }} />
                      {msg[c.id]?.text && <small style={{ display: 'block', color: msg[c.id].ok ? 'var(--green)' : 'var(--red)', fontSize: 10, marginTop: 4 }}>{msg[c.id].text}</small>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn gold sm" disabled={busy[c.id]} onClick={() => jadwalkan(c)}>{busy[c.id] ? 'Membuat…' : 'Jadwalkan'} <CalendarPlus size={14} /></button>
                        <Link className="btn ghost2 sm" to={`${base}/konsultasi/${c.id}`}>Detail</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Video call list (separate menu) ---------- */
function MeetingList({ base }: { base: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  const reload = () => {
    setLoading(true);
    setErr('');
    api<{ meetings: Meeting[] }>('/meetings')
      .then((d) => setMeetings(d.meetings || []))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const mName = (m: Meeting) => {
    const co = m.consultations;
    if (!co) return 'Pemohon';
    const p: any = co.profiles;
    const pn = Array.isArray(p) ? p?.[0]?.name : p?.name;
    return co.guest_name || pn || 'Pemohon';
  };
  const filtered = meetings.filter((m) =>
    `${m.consultations?.reference || ''} ${m.consultations?.topic || ''} ${mName(m)}`.toLowerCase().includes(q.toLowerCase())
  );
  const upcoming = filtered.filter((m) => !['selesai', 'dibatalkan'].includes(m.consultations?.status || ''));
  const done = filtered.filter((m) => ['selesai', 'dibatalkan'].includes(m.consultations?.status || ''));

  const render = (rows: Meeting[]) => (
    <div className="table-wrap-live">
      <table className="table-live">
        <thead><tr><th>Jadwal</th><th>Ref / topik</th><th>Pemohon</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td><b>{fmtDate(m.scheduled_at)} {horario(m.scheduled_at)}</b><br /><small style={{ color: '#9a8c83', fontSize: 9 }}>WIB</small></td>
              <td><b>{m.consultations?.reference || '—'}</b><br /><small style={{ color: '#9a8c83', fontSize: 10 }}>{m.consultations?.topic || ''}</small></td>
              <td>{mName(m)}</td>
              <td>{statusPill(m.consultations?.status || 'dijadwalkan')}</td>
              <td>
                {m.consultations?.status === 'selesai' || m.consultations?.status === 'dibatalkan' ? (
                  <small style={{ color: '#9a8c83', fontWeight: 700 }}>Selesai</small>
                ) : base === '/dashboard' ? (
                  (googleMeetUrl(m.meeting_url) || legacyJitsiUrl(m.meeting_url)) ?
                    <a className="btn gold join-call" href={(googleMeetUrl(m.meeting_url) || legacyJitsiUrl(m.meeting_url))!}><Video size={20} /> Masuk Video Call</a> :
                    <small>Link belum tersedia</small>
                ) : (
                  <Link className="btn gold sm" to={`${base}/meeting/${m.id}`}><Video size={13} /> Gabung</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="dash-section-title">Konsultasi video</div>
      <div className="dash-panel" style={{ paddingBottom: 8 }}>
        <div className="dash-panel-head">
          <h3>Panggilan video terjadwal</h3>
          <button className="btn ghost2 sm" onClick={reload}><RefreshCw size={14} /> Muat ulang</button>
        </div>
        <div className="search-box" style={{ width: '100%', maxWidth: 'none', margin: '0 0 14px' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari jadwal, ref, topik, atau pemohon…" />
        </div>
        {loading ? (
          <div className="empty-live"><b>Memuat…</b></div>
        ) : err ? (
          <div className="empty-live"><b>Gagal memuat</b><span>{err}</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-live"><Video size={26} /><b>Belum ada panggilan video</b><span>Jadwal pertemuan yang dibuat untuk konsultasi akan muncul di sini.</span></div>
        ) : (
          <>
            {upcoming.length > 0 && <div className="dash-panel-head"><h3>Akan datang</h3><span className="count">{upcoming.length}</span></div>}
            {upcoming.length > 0 && render(upcoming)}
            {done.length > 0 && <div className="dash-panel-head" style={{ marginTop: 26 }}><h3>Riwayat</h3><span className="count">{done.length}</span></div>}
            {done.length > 0 && render(done)}
          </>
        )}
      </div>
    </>
  );
}

/* ---------- Consultation list ---------- */
function ConsultationList({ base }: { base: string }) {
  const { list, loading, error, reload } = useConsultations();
  const [q, setQ] = useState('');
  const role = useRole(base);
  const isStaff = role === 'admin' || role === 'konsultan';
  const filtered = list
    .filter((c) => (isStaff ? !isPelaporan(c) : true))
    .filter((c) => `${c.topic} ${c.reference || ''} ${nameOf(c)}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="dash-section-title">{isStaff ? 'Semua konsultasi' : 'Konsultasi saya'}</div>
      <div className="dash-panel" style={{ paddingBottom: 8 }}>
        <div className="dash-panel-head" style={{ gap: 14 }}>
          <div className="search-box" style={{ minWidth: 0, flex: 1 }}><RefreshCw size={16} /> <span style={{ fontSize: 10, color: '#9a8c83' }}>Cari topik, ref, atau pemohon</span></div>
          <button className="btn ghost2 sm" onClick={reload}><RefreshCw size={14} /> Muat ulang</button>
        </div>
        <div className="search-box" style={{ width: '100%', maxWidth: 'none', margin: '0 0 14px' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari konsultasi…" />
        </div>
        {loading ? (
          <div className="empty-live"><b>Memuat…</b></div>
        ) : error ? (
          <div className="empty-live"><b>Gagal memuat</b><span>{error}</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-live"><ClipboardList size={26} /><b>Tidak ada konsultasi</b><span>Belum ada data untuk ditampilkan.</span></div>
        ) : (
          <div className="table-wrap-live">
            <table className="table-live">
              <thead><tr><th>Ref</th><th>Topik</th><th>Pemohon</th><th>Tanggal</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr className="row-link" key={c.id} onClick={() => (window.location.href = `${base}/konsultasi/${c.id}`)}>
                    <td><b>{c.reference || '—'}</b></td>
                    <td>{c.topic}</td>
                    <td>{nameOf(c)}</td>
                    <td>{fmtDate(c.created_at)}</td>
                    <td>{statusPill(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Submissions (admin) ---------- */
function Submissions({ base }: { base: string }) {
  const { list, loading, error, reload } = useConsultations();
  const [q, setQ] = useState('');
  const filtered = list
    .filter((c) => isPelaporan(c))
    .filter((c) => `${c.topic} ${c.reference || ''} ${nameOf(c)} ${c.guest_email || ''} ${c.guest_phone || ''}`.toLowerCase().includes(q.toLowerCase()));
  const public_ = filtered.filter((c) => !c.user_id);
  const registered = filtered.filter((c) => c.user_id);
  const render = (rows: Consultation[]) => (
    <div className="table-wrap-live">
      <table className="table-live">
        <thead><tr><th>Ref</th><th>Topik</th><th>Pemohon</th><th>Kontak</th><th>Tanggal</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr className="row-link" key={c.id} onClick={() => (window.location.href = `${base}/konsultasi/${c.id}`)}>
              <td><b>{c.reference || '—'}</b></td>
              <td>{c.topic}</td>
              <td>{nameOf(c)}</td>
              <td>{c.guest_email || c.guest_phone || '—'}</td>
              <td>{fmtDate(c.created_at)}</td>
              <td>{statusPill(c.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="dash-panel-head"><div className="dash-section-title">Pengajuan &amp; laporan masuk</div><button className="btn ghost2 sm" onClick={reload} disabled={loading}><RefreshCw size={14}/> Muat ulang</button></div>
      <div className="dash-panel" style={{ paddingBottom: 8 }}>
        {error && <div className="dash-msg" role="alert">Gagal memuat pengajuan: {error} <button className="btn ghost2 sm" onClick={reload}>Coba lagi</button></div>}
        <div className="search-box" style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pengajuan, ref, pemohon, kontak…" />
        </div>
        {loading ? (
          <div className="empty-live"><b>Memuat…</b></div>
        ) : (
          <>
            <div className="dash-panel-head"><h3>Pengajuan publik (tanpa akun)</h3><span className="count">{public_.length}</span></div>
            {public_.length === 0 ? <div className="empty-live"><span>Belum ada pengajuan publik.</span></div> : render(public_)}
            <div className="dash-panel-head" style={{ marginTop: 26 }}><h3>Pengajuan terdaftar</h3><span className="count">{registered.length}</span></div>
            {registered.length === 0 ? <div className="empty-live"><span>Belum ada pengajuan terdaftar.</span></div> : render(registered)}
          </>
        )}
      </div>
    </>
  );
}

/* ---------- Consultation detail ---------- */
function ConsultationDetail({ base }: { base: string }) {
  const { id } = useParams();
  const nav = useNavigate();
  const role = useRole(base);
  const isStaff = role === 'admin' || role === 'konsultan';
  const [c, setC] = useState<Consultation | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [sched, setSched] = useState(false);
  const [schedAt, setSchedAt] = useState('');
  const [schedLink, setSchedLink] = useState('');
  const [replacementLink, setReplacementLink] = useState('');
  const [schedBusy, setSchedBusy] = useState(false);
  const [schedMsg, setSchedMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [busyStatus, setBusyStatus] = useState(false);

  useEffect(() => {
    setLoading(true);
    setStatusMsg('');
    setNotes('');
    Promise.all([
      api<{ consultation: Consultation }>(`/consultations/${id}`),
      api<{ meetings: Meeting[] }>('/meetings'),
    ])
      .then(([d, m]) => { setC(d.consultation); setMeetings(m.meetings || []); })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const meeting = meetings.find((m) => m.consultation_id === id);

  function schedule() {
    if (!schedAt) { setSchedMsg('Pilih tanggal dan waktu terlebih dahulu.'); return; }
    const link = googleMeetUrl(schedLink);
    if (!link) { setSchedMsg('Masukkan link Google Meet yang valid.'); return; }
    setSchedBusy(true); setSchedMsg('');
    api<{ meeting: Meeting }>('/meetings', {
      method: 'POST',
      body: { consultation_id: id, scheduled_at: new Date(schedAt).toISOString(), meeting_url: link },
    })
      .then((d) => { setMeetings((x) => [...x.filter((m) => m.id !== d.meeting.id), d.meeting]); setSched(false); setSchedMsg('Pertemuan berhasil dijadwalkan dengan Google Meet.'); })
      .catch((e: Error) => setSchedMsg(e.message))
      .finally(() => setSchedBusy(false));
  }

  function replaceLink() {
    if (!meeting) return;
    const link = googleMeetUrl(replacementLink);
    if (!link) { setSchedMsg('Masukkan link Google Meet yang valid.'); return; }
    setSchedBusy(true); setSchedMsg('');
    api<{ meeting: Meeting }>(`/meetings/${meeting.id}/link`, { method: 'PATCH', body: { meeting_url: link } })
      .then((d) => { setMeetings((all) => all.map((m) => m.id === d.meeting.id ? d.meeting : m)); setReplacementLink(''); setSchedMsg('Link Google Meet berhasil disimpan.'); })
      .catch((e: Error) => setSchedMsg(e.message))
      .finally(() => setSchedBusy(false));
  }

  function setStatus(status: string, notesText?: string) {
    setBusyStatus(true);
    setStatusMsg('');
    api(`/consultations/${id}/status`, { method: 'PATCH', body: { status, completion_notes: notesText || undefined } })
      .then(() => {
        setC((cur) => (cur ? { ...cur, status, completion_notes: notesText || cur.completion_notes, completed_at: status === 'selesai' ? new Date().toISOString() : cur.completed_at } : cur));
        setStatusMsg(status === 'selesai' ? 'Konsultasi ditandai selesai. Catatan penyelesaian disimpan.' : status === 'dibatalkan' ? 'Konsultasi berhasil dibatalkan.' : 'Status konsultasi diperbarui.');
      })
      .catch((e: Error) => setStatusMsg('Gagal memperbarui status: ' + e.message))
      .finally(() => setBusyStatus(false));
  }
  function startCall() {
    if (c?.status !== 'berlangsung') setStatus('berlangsung');
    if (meeting?.meeting_url) nav(`${base}/meeting/${meeting.id}`);
  }

  if (loading) return <div className="empty-live"><b>Memuat…</b></div>;
  if (err || !c) return <div className="empty-live"><b>Gagal memuat</b><span>{err}</span></div>;
  const pel = isPelaporan(c);

  return (
    <>
      <Link to={`${base}/konsultasi`} className="btn ghost sm" style={{ marginBottom: 14 }}>← Kembali</Link>
      {schedMsg && (
        <div style={{ background: schedMsg.includes('berhasil') ? 'var(--green-soft)' : 'var(--red-soft)', color: schedMsg.includes('berhasil') ? 'var(--green)' : 'var(--red)', borderRadius: 9, padding: '10px 14px', fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
          {schedMsg}
        </div>
      )}
      <div className="dash-grid cols-2" style={{ marginBottom: 16 }}>
        <div className="dash-panel">
          <div className="dash-panel-head"><h3>{c.topic}</h3><span className="count">{c.reference || '—'}</span></div>
          <div className="detail-info">
            <div><div className="field-lbl">Pemohon</div><div className="field-val">{nameOf(c)}</div></div>
            <div><div className="field-lbl">Status</div><div>{statusPill(c.status)}</div></div>
            <div><div className="field-lbl">Diajukan</div><div className="field-val">{fmtDate(c.created_at)}</div></div>
            <div><div className="field-lbl">Tanggal pilihan</div><div className="field-val">{c.preferred_date ? fmtDate(c.preferred_date) : '—'}{c.preferred_time ? ` · ${c.preferred_time}` : ''}</div></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="field-lbl">Deskripsi</div>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: '#5f534b', margin: '6px 0 0' }}>{c.description}</p>
          </div>
          {(c.guest_email || c.guest_phone) && (
            <div style={{ marginTop: 16, background: '#faf6f0', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontSize: 11, color: '#5f534b' }}>
              <b>Kontak pengajuan publik:</b> {c.guest_email || ''}{c.guest_phone ? ` · ${c.guest_phone}` : ''}
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head"><h3>{pel ? 'Proses layanan' : 'Pertemuan daring'}</h3></div>
          {pel ? (
            <div className="empty-live" style={{ padding: '22px 10px', textAlign: 'left', alignItems: 'flex-start' }}>
              <FileText size={22} />
              <b>Jenis pelaporan</b>
              <span>Pengajuan ini ditindaklanjuti sebagai dokumen/laporan. Tidak ada pertemuan video yang dijadwalkan.</span>
            </div>
          ) : meeting ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="detail-info">
                <div><div className="field-lbl">Jadwal</div><div className="field-val">{fmtDate(meeting.scheduled_at)} {horario(meeting.scheduled_at)} WIB</div></div>
                <div><div className="field-lbl">Ruang</div><div className="field-val">{googleMeetUrl(meeting.meeting_url) ? 'Google Meet' : 'Jitsi (jadwal lama)'}</div></div>
              </div>
              {isStaff && <div style={{ background: '#faf6f0', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontSize: 10, color: '#8a7e76', wordBreak: 'break-all' }}>{meeting.meeting_url}</div>}
              {!['selesai', 'dibatalkan'].includes(c.status) && (isStaff ?
                <button className="btn gold full" onClick={startCall}><Video size={16} /> Bergabung ke ruang video</button> :
                (googleMeetUrl(meeting.meeting_url) || legacyJitsiUrl(meeting.meeting_url)) &&
                <a className="btn gold join-call" href={(googleMeetUrl(meeting.meeting_url) || legacyJitsiUrl(meeting.meeting_url))!}><Video size={22} /> Masuk Video Call</a>
              )}
              {isStaff && !['selesai', 'dibatalkan'].includes(c.status) && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>Buat link Google Meet baru ↗</a>
                  <input type="url" aria-label="Link Google Meet pengganti" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={replacementLink} onChange={(e) => setReplacementLink(e.target.value)} />
                  <button className="btn ghost2 sm" disabled={schedBusy} onClick={replaceLink}>{schedBusy ? 'Menyimpan…' : 'Ganti link meeting'}</button>
                </div>
              )}
            </div>
          ) : isStaff ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <p style={{ fontSize: 11, color: '#8a7e76', margin: 0 }}>Belum ada jadwal. Buat jadwal dan ruang video konsultasi untuk pemohon ini.</p>
              {sched ? (
                <>
                  <label className="form-label">Tanggal &amp; waktu pertemuan (WIB)
                    <input type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} />
                  </label>
                  <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>Buka Google Meet → Rapat baru → Buat rapat untuk nanti ↗</a>
                  <label className="form-label">Link Google Meet
                    <input type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={schedLink} onChange={(e) => setSchedLink(e.target.value)} />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn gold" disabled={schedBusy} onClick={schedule}>{schedBusy ? 'Membuat…' : 'Konfirmasi jadwal'} <CalendarPlus size={16} /></button>
                    <button className="btn ghost2" onClick={() => setSched(false)}>Batal</button>
                  </div>
                </>
              ) : (
                <button className="btn primary" onClick={() => setSched(true)}><CalendarPlus size={16} /> Atur jadwal &amp; ruang video</button>
              )}
            </div>
          ) : (
            <div className="empty-live"><span>Menunggu petugas menjadwalkan pertemuan Anda.</span></div>
          )}

          {isStaff && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14, display: 'grid', gap: 8 }}>
              {statusMsg && <div className={'dash-msg ' + (statusMsg.startsWith('Gagal') ? 'err' : 'ok')}>{statusMsg}</div>}
              {c.status === 'selesai' ? (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CheckCircle2 size={16} /> Konsultasi telah ditandai selesai dan tidak dapat diubah lagi.
                </div>
              ) : c.status === 'dibatalkan' ? (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <X size={16} /> Konsultasi ini telah dibatalkan.
                </div>
              ) : (
                <>
                  <label className="form-label" style={{ marginTop: 4 }}>Catatan penyelesaian / hasil
                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis ringkasan hasil atau alasan pembatalan (opsional)" />
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn ghost2 sm" disabled={busyStatus} onClick={() => setStatus('selesai', notes)}><CheckCircle2 size={15} /> Tandai selesai</button>
                    <button className="btn ghost2 sm" disabled={busyStatus} style={{ color: 'var(--red)' }} onClick={() => setStatus('dibatalkan', notes)}><X size={15} /> Batalkan konsultasi</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Meeting view ---------- */
function MeetingView({ base }: { base: string }) {
  const { id } = useParams();
  const [room, setRoom] = useState<string | null>(null);
  const [info, setInfo] = useState<string>('');
  const [closed, setClosed] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    api<{ meeting: Meeting }>(`/meetings/${id}`)
      .then((d) => {
        const link = googleMeetUrl(d.meeting.meeting_url) || legacyJitsiUrl(d.meeting.meeting_url);
        const isClosed = ['selesai', 'dibatalkan'].includes(d.meeting.consultations?.status || '');
        if (base === '/dashboard' && link && !isClosed) {
          window.location.replace(link);
          return;
        }
        setRoom(link);
        setClosed(isClosed);
        setInfo(`${fmtDate(d.meeting.scheduled_at)} ${horario(d.meeting.scheduled_at)} WIB`);
      })
      .catch(() => setInfo('Tidak dapat memuat pertemuan.'));
  }, [id, base]);

  const meet = googleMeetUrl(room);

  return (
    <div className="meeting-view">
      <div className="meeting-view-side">
        <div>
          <b>Ruang Konsultasi Daring</b>
          <small>{info}</small>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link className="btn ghost2 sm" to={`${base}/konsultasi`}>← Kembali</Link>
        </div>
      </div>
      {room && !meet && (base === '/admin' || base === '/konsultan') && (
        <div className="dash-msg" role="status" style={{ marginTop: 12 }}>
          <b>Petugas memulai ruang sebagai moderator.</b> Jitsi meminta orang pertama masuk dengan akun Google, GitHub, atau Facebook. Akun admin Kemenhaj tidak otomatis menjadi moderator Jitsi.{' '}
          <a href={room} target="_blank" rel="noopener noreferrer">Buka ruang Jitsi untuk masuk</a>, lalu peserta dapat bergabung.
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {closed ? (
          <div className="empty-live"><b>Pertemuan telah ditutup</b><span>Hubungi petugas bila perlu menjadwalkan konsultasi baru.</span></div>
        ) : meet ? (
          <div className="dash-panel" style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <b>Gabung melalui Google Meet</b>
            <span>Ruang video terbuka di tab baru. Masuk dengan akun Google petugas yang membuat link agar dapat mengelola peserta.</span>
            <a className="btn gold" href={meet} target="_blank" rel="noopener noreferrer"><Video size={16} /> Buka Google Meet ↗</a>
          </div>
        ) : room && !open ? (
          <button className="btn gold" style={{ marginBottom: 12 }} onClick={() => setOpen(true)}><Phone size={16} /> Saya siap, buka ruang video</button>
        ) : open ? (
          <div className="meeting-frame-wrap">
            <iframe
              src={`${room}#userInfo.displayName=${encodeURIComponent(getUser()?.name || 'Peserta')}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; speaker"
              title="Ruang konsultasi video"
            />
          </div>
        ) : (
          <div className="empty-live"><Video size={30} /><b>Belum siap bergabung</b><span>Klik tombol untuk membuka ruang video.</span></div>
        )}
        {!room && info && <div className="empty-live"><b>Pertemuan belum tersedia</b><span>{info}</span></div>}
      </div>
    </div>
  );
}

/* ---------- Router ---------- */
export function LiveDashboard({ base }: { base: string }) {
  const role = useRole(base);
  const { user, isAuth } = useAuth();
  const isStaff = role === 'admin' || role === 'konsultan';

  if (!user || !isAuth) return <Navigate to="/masuk?sesi=berakhir" replace />;
  if (isStaff && user.role !== role && user.role !== 'admin') return <AuthGuard />;
  if (!isStaff && user.role !== role) return <AuthGuard />;
  if (role === 'admin' && user.role === 'admin') return (
    <DashboardShell base={base}>
      <Routes>
        <Route path="" element={<Overview base={base} />} />
        <Route path="pengajuan" element={<Submissions base={base} />} />
        <Route path="laporan-kloter" element={<OperationsDashboard base={base} kind="returns" />} />
        <Route path="laporan-kloter/:id" element={<ReturnReportEditor base={base} />} />
        <Route path="izin-ppiu" element={<OperationsDashboard base={base} kind="ppiu" />} />
        <Route path="pengawasan" element={<SupervisionList base={base} />} />
        <Route path="pengawasan/baru" element={<SupervisionForm base={base} />} />
        <Route path="pengawasan/:id" element={<SupervisionForm base={base} />} />
        <Route path="konsultasi" element={<ConsultationList base={base} />} />
        <Route path="konsultasi/:id" element={<ConsultationDetail base={base} />} />
        <Route path="meeting/:id" element={<MeetingView base={base} />} />
        <Route path="video" element={<MeetingList base={base} />} />
      </Routes>
    </DashboardShell>
  );
  if (role === 'pengawas' && user.role === 'pengawas') return (
    <DashboardShell base={base}>
      <Routes>
        <Route path="" element={<SupervisionList base={base} />} />
        <Route path="pengawasan" element={<SupervisionList base={base} />} />
        <Route path="pengawasan/baru" element={<SupervisionForm base={base} />} />
        <Route path="pengawasan/:id" element={<SupervisionForm base={base} />} />
      </Routes>
    </DashboardShell>
  );
  if (role === 'konsultan' && user.role === 'admin') return <Navigate to={`${base.replace('konsultan', 'admin')}`} replace />;
  if (role === 'konsultan' && user.role === 'konsultan') return (
    <DashboardShell base={base}>
      <Routes>
        <Route path="" element={<Overview base={base} />} />
        <Route path="penjadwalan" element={<SchedulingView base={base} />} />
        <Route path="konsultasi" element={<ConsultationList base={base} />} />
        <Route path="konsultasi/:id" element={<ConsultationDetail base={base} />} />
        <Route path="meeting/:id" element={<MeetingView base={base} />} />
        <Route path="video" element={<MeetingList base={base} />} />
      </Routes>
    </DashboardShell>
  );
  if (role === 'pengguna' && user.role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'pengguna' && user.role === 'konsultan') return <Navigate to="/konsultan" replace />;

  return (
    <DashboardShell base={base}>
      <Routes>
        <Route path="" element={<Overview base={base} />} />
        <Route path="konsultasi" element={<ConsultationList base={base} />} />
        <Route path="konsultasi/:id" element={<ConsultationDetail base={base} />} />
        <Route path="meeting/:id" element={<MeetingView base={base} />} />
        <Route path="video" element={<MeetingList base={base} />} />
      </Routes>
    </DashboardShell>
  );
}

function AuthGuard() {
  const navigate = useNavigate();
  return (
    <div className="auth-guard">
      <div className="auth-guard-card">
        <div className="auth-guard-icon"><LockIcon /></div>
        <h1>Akses area petugas</h1>
        <p>Silakan masuk dengan akun petugas untuk mengakses dashboard operasional.</p>
        <button className="btn primary full" onClick={() => navigate('/masuk')}>Masuk</button>
      </div>
    </div>
  );
}
function LockIcon() { return <MessageSquare size={26} />; }
