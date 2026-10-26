import {useEffect,useState,type ComponentProps,type FormEvent} from 'react';
import {createPortal} from 'react-dom';

export function PublicFeedback({error='',message='',busy=false}:{error?:string;message?:string;busy?:boolean}){
 const friendlyError=/failed to fetch|networkerror|load failed/i.test(error)?'Koneksi terputus. Data belum dapat dikirim. Periksa internet lalu coba kembali.':error;
 const text=friendlyError||(busy?'Sedang memproses. Mohon tunggu…':message);
 const [closed,setClosed]=useState('');
 useEffect(()=>setClosed(''),[text]);
 if(!text||closed===text)return null;
 return createPortal(<aside className={'public-form-notice '+(error?'notice-error':'notice-success')} aria-label="Notifikasi layanan publik"><div role={error?'alert':'status'} aria-live={error?'assertive':'polite'} aria-atomic="true"><strong>{error?'Periksa kembali':busy?'Sedang diproses':'Informasi layanan'}</strong><p>{text}</p></div><button type="button" aria-label="Tutup notifikasi layanan" onClick={()=>setClosed(text)}>Tutup</button></aside>,document.body);
}
export default function PublicForm({onSubmit,onInput,children,...props}:ComponentProps<'form'>){
 const [validation,setValidation]=useState('');
 function invalid(e:FormEvent<HTMLFormElement>){
  const field=e.target as HTMLInputElement;
  if(e.currentTarget.querySelector('input:invalid,select:invalid,textarea:invalid')!==field)return;
  const label=field.labels?.[0]?.firstChild?.textContent?.replace(/\s+/g,' ').trim()||field.getAttribute('aria-label')||'Kolom ini';
  const v=field.validity;
  setValidation(v.valueMissing?`Formulir belum lengkap. Isi ${label}.`:v.typeMismatch||v.patternMismatch?`Format ${label} salah. Periksa kembali isian Anda.`:v.tooShort?`${label} terlalu pendek.`:v.rangeUnderflow||v.rangeOverflow?`Nilai ${label} di luar batas yang diizinkan.`:`Periksa ${label}. ${field.validationMessage}`);
 }
 return <form {...props} onInvalidCapture={invalid} onInput={e=>{setValidation('');onInput?.(e)}} onSubmit={e=>{setValidation('');onSubmit?.(e)}}><PublicFeedback error={validation}/>{children}</form>;
}
