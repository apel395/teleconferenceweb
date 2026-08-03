export type TimelinessStatus='Tepat Waktu'|'Mendekati Batas Waktu'|'Melewati Batas Waktu'|'Belum Selesai';
const minutes=(a:Date,b:Date)=>Math.round((b.getTime()-a.getTime())/60000);
export function calculateTimeliness(target:string,completed?:string,now='2026-08-06T10:30:00+07:00'):TimelinessStatus{const deadline=new Date(target),current=new Date(completed||now);if(completed)return current<=deadline?'Tepat Waktu':'Melewati Batas Waktu';if(current>deadline)return'Melewati Batas Waktu';return minutes(current,deadline)<=120?'Mendekati Batas Waktu':'Belum Selesai'}
export function durationMinutes(start:string,end:string){return Math.max(0,minutes(new Date(start),new Date(end)))}
export function readableMinutes(value:number){if(value<60)return`${value} menit`;const h=Math.floor(value/60),m=value%60;return`${h} jam${m?` ${m} menit`:''}`}
export function remainingTime(target:string,now='2026-08-06T10:30:00+07:00'){const value=minutes(new Date(now),new Date(target));return value>=0?`${readableMinutes(value)} tersisa`:`Terlambat ${readableMinutes(Math.abs(value))}`}
export function completionPercentage(created:string,target:string,completed?:string,now='2026-08-06T10:30:00+07:00'){const total=Math.max(1,minutes(new Date(created),new Date(target)));const used=minutes(new Date(created),new Date(completed||now));return Math.min(100,Math.max(0,Math.round(used/total*100)))}
