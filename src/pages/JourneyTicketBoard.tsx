import { Link } from 'react-router-dom';
import type { Phase, Ticket } from './UmrahTravelPages';
const columns:{key:string;label:string;phases:Phase[]}[]=[
 {key:'departure',label:'Keberangkatan',phases:['DRAFT','SUBMITTED']},
 {key:'departed',label:'Sudah Berangkat',phases:['DEPARTED']},
 {key:'return',label:'Kepulangan',phases:['RETURNING']},
 {key:'notes',label:'Kepulangan dengan Catatan',phases:['RETURN_NOTES']},
 {key:'closed',label:'Sudah Pulang',phases:['CLOSED']},
];
const displayDate=(value?:string)=>value?new Date(value+'T00:00:00+07:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}):'Belum diisi';
export default function JourneyTicketBoard({rows,base}:{rows:Ticket[];base:string}){
 return <div className="journey-board" aria-label="Papan monitoring perjalanan">{columns.map(column=>{
  const tickets=rows.filter(row=>column.phases.includes(row.journey_status));
  return <section className={'journey-column journey-column-'+column.key} key={column.key} aria-label={column.label}>
   <header><h3>{column.label}</h3><span aria-label={`${tickets.length} tiket pada halaman ini`}>{tickets.length}</span></header>
   {tickets.length?tickets.map(ticket=><Link className="journey-board-card" key={ticket.id} to={`${base}/laporan-umrah/${ticket.id}${['RETURNING','RETURN_NOTES'].includes(ticket.journey_status)?'?tab=return':''}`}>
    <small>{ticket.reference}</small><h4>{ticket.form_data.ppiu_name||'Identitas travel belum diisi'}</h4>
    <span>{ticket.form_data.journey_type==='HAJI_KHUSUS'?'Haji Khusus':'Umrah'} · {ticket.form_data.pilgrim_count||0} jemaah</span>
    <dl><dt>Berangkat</dt><dd>{displayDate(ticket.form_data.travel_date)}</dd><dt>Maskapai</dt><dd>{ticket.form_data.airline||'Belum diisi'}</dd><dt>Rute</dt><dd>{ticket.form_data.route||'Belum diisi'}</dd></dl>
    {ticket.journey_status==='DRAFT'&&<p className="journey-card-label">Draft travel</p>}
    {ticket.journey_status==='SUBMITTED'&&<p className="journey-card-label">Menunggu pemeriksaan Kanwil</p>}
    {ticket.return_form_data?.return_notes&&<p className="journey-card-note">{ticket.return_form_data.return_notes}</p>}
    <strong>{ticket.journey_status==='CLOSED'?'Lihat riwayat':'Buka detail tiket'} →</strong>
   </Link>):<p className="journey-column-empty">Belum ada tiket pada halaman ini.</p>}
  </section>;
 })}</div>;
}
