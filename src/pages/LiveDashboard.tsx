import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays, CalendarPlus, CheckCircle2, ClipboardList, FileText, LayoutDashboard,
  LogOut, Menu, MessageSquare, Phone, RefreshCw, Users, Video, X
} from 'lucide-react';
import { api, getUser } from '../lib/api';

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

/* ---------- Shell ---------- */
function useRole(base: string): 'pengguna' | 'konsultan' | 'admin' {
  if (base === '/konsultan') return 'konsultan';
  if (base === '/admin') return 'admin';
  return 'pengguna';
}

export function DashboardShell({ base, children }: { base: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const role = useRole(base);
  const isAdmin = role === 'admin';
  const isCons = role === 'konsultan';

  const nav: { to: string; label: string; icon: React.ReactNode }[] = [];
  if (isAdmin) {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/pengajuan`, label: 'Pengajuan & Laporan', icon: <ClipboardList size={17} /> });
    nav.push({ to: `${base}/konsultasi`, label: 'Konsultasi', icon: <MessageSquare size={17} /> });
  } else if (isCons) {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/penjadwalan`, label: 'Penjadwalan', icon: <CalendarDays size={17} /> });
    nav.push({ to: `${base}/konsultasi`, label: 'Konsultasi', icon: <MessageSquare size={17} /> });
  } else {
    nav.push({ to: `${base}`, label: 'Ringkasan', icon: <LayoutDashboard size={17} /> });
    nav.push({ to: `${base}/konsultasi`, label: 'Konsultasi Saya', icon: <MessageSquare size={17} /> });
  }

  const roleLabel = isAdmin ? 'Administrator' : isCons ? 'Konsultan' : 'Pengguna';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function logout() {
    localStorage.removeItem('kemenhaj-token');
    localStorage.removeItem('kemenhaj-user');
    navigate('/masuk');
  }

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar ${open ? 'open' : ''}`}>
        <div className="dash-side-top">
          <Link to="/" className="dash-brand"><span className="brand-mark">KH</span><span><b>KEMENHAJ</b><small>Portal Riau</small></span></Link>
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
    api<{ consultations: Consultation[] }>('/consultations')
      .then((d) => setList(d.consultations || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);
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
  const stats = useStats();
  const meetings = useMeetings();
  const role = useRole(base);
  const isStaff = role === 'admin' || role === 'konsultan';

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

/* ---------- Consultation list ---------- */
function ConsultationList({ base }: { base: string }) {
  const { list, loading, error, reload } = useConsultations();
  const [q, setQ] = useState('');
  const role = useRole(base);
  const isStaff = role === 'admin' || role === 'konsultan';
  const filtered = list.filter((c) => `${c.topic} ${c.reference || ''} ${nameOf(c)}`.toLowerCase().includes(q.toLowerCase()));

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
  const { list, loading, reload } = useConsultations();
  const [q, setQ] = useState('');
  const filtered = list.filter((c) => `${c.topic} ${c.reference || ''} ${nameOf(c)} ${c.guest_email || ''} ${c.guest_phone || ''}`.toLowerCase().includes(q.toLowerCase()));
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
      <div className="dash-section-title">Pengajuan &amp; laporan masuk</div>
      <div className="dash-panel" style={{ paddingBottom: 8 }}>
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
  const [schedBusy, setSchedBusy] = useState(false);
  const [schedMsg, setSchedMsg] = useState('');

  useEffect(() => {
    setLoading(true);
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
    setSchedBusy(true); setSchedMsg('');
    api<{ meeting: Meeting }>('/meetings', {
      method: 'POST',
      body: { consultation_id: id, scheduled_at: new Date(schedAt).toISOString() },
    })
      .then((d) => { setMeetings((x) => [...x.filter((m) => m.id !== d.meeting.id), d.meeting]); setSched(false); setSchedMsg('Pertemuan berhasil dijadwalkan. Ruang Jitsi otomatis dibuat.'); })
      .catch((e: Error) => setSchedMsg(e.message))
      .finally(() => setSchedBusy(false));
  }

  function setStatus(status: string) {
    api(`/consultations/${id}/status`, { method: 'PATCH', body: { status } })
      .then(() => { setC((cur) => (cur ? { ...cur, status } : cur)); })
      .catch((e: Error) => setErr(e.message));
  }
  function startCall() {
    setStatus(meeting ? 'berlangsung' : 'berlangsung');
    if (meeting?.meeting_url) nav(`${base}/meeting/${meeting.id}`);
  }

  if (loading) return <div className="empty-live"><b>Memuat…</b></div>;
  if (err || !c) return <div className="empty-live"><b>Gagal memuat</b><span>{err}</span></div>;

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
          <div className="dash-panel-head"><h3>Pertemuan daring</h3></div>
          {meeting ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="detail-info">
                <div><div className="field-lbl">Jadwal</div><div className="field-val">{fmtDate(meeting.scheduled_at)} {horario(meeting.scheduled_at)} WIB</div></div>
                <div><div className="field-lbl">Ruang</div><div className="field-val">Jitsi Meet</div></div>
              </div>
              <div style={{ background: '#faf6f0', border: '1px solid var(--line)', borderRadius: 10, padding: 12, fontSize: 10, color: '#8a7e76', wordBreak: 'break-all' }}>{meeting.meeting_url}</div>
              <button className="btn gold full" onClick={startCall}><Video size={16} /> Bergabung ke ruang video</button>
            </div>
          ) : isStaff ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <p style={{ fontSize: 11, color: '#8a7e76', margin: 0 }}>Belum ada jadwal. Buat jadwal dan ruang video konsultasi untuk pemohon ini.</p>
              {sched ? (
                <>
                  <label className="form-label">Tanggal &amp; waktu pertemuan (WIB)
                    <input type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} />
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

          {isStaff && meeting && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14, display: 'grid', gap: 8 }}>
              <button className="btn ghost2 sm" onClick={() => setStatus(c.status === 'selesai' ? 'berlangsung' : 'selesai')}><CheckCircle2 size={15} /> Tandai {c.status === 'selesai' ? 'berlangsung' : 'selesai'}</button>
              <button className="btn ghost2 sm" style={{ color: 'var(--red)' }} onClick={() => setStatus('dibatalkan')}><X size={15} /> Batalkan konsultasi</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Jitsi meeting view ---------- */
function MeetingView({ base }: { base: string }) {
  const { id } = useParams();
  const fmtRoom = (url: string | null): string | null => {
    if (!url) return null;
    return url.includes('meet.jit.si') ? url : null;
  };
  const [room, setRoom] = useState<string | null>(null);
  const [info, setInfo] = useState<string>('');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    api<{ meeting: Meeting }>(`/meetings/${id}`)
      .then((d) => { setRoom(fmtRoom(d.meeting.meeting_url)); setInfo(`${fmtDate(d.meeting.scheduled_at)} ${horario(d.meeting.scheduled_at)} WIB`); })
      .catch(() => setInfo('Tidak dapat memuat pertemuan.'));
  }, [id]);

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
      <div style={{ marginTop: 12 }}>
        {room && !open ? (
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
  const user = getUser();
  const isStaff = role === 'admin' || role === 'konsultan';

  if (!user) return <AuthGuard />;
  if (isStaff && user.role !== role && user.role !== 'admin') return <AuthGuard />;
  if (!isStaff && user.role === 'admin') return <Navigate to="/admin" replace />;
  if (base === '/konsultan' && user.role === 'admin') return null;

  return (
    <DashboardShell base={base}>
      <Routes>
        <Route path="" element={<Overview base={base} />} />
        {role === 'admin' && <Route path="pengajuan" element={<Submissions base={base} />} />}
        <Route path="konsultasi" element={<ConsultationList base={base} />} />
        <Route path="konsultasi/:id" element={<ConsultationDetail base={base} />} />
        <Route path="meeting/:id" element={<MeetingView base={base} />} />
        {role === 'konsultan' && <Route path="penjadwalan" element={<ConsultationList base={base} />} />}
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
