import { useState } from 'react';
import { api } from '../lib/api';
import {OrganizationAccounts} from './OrganizationAccounts';
import {LicensingPage} from './PortalPages';
type Account={id:string;name:string};
const message=(e:unknown,fallback:string)=>e instanceof Error?e.message:fallback;
function PasswordForm({account}:{account?:Account}) {
 const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setNotice('');try{const d=await api<{message:string}>(account?`/users/${account.id}/password`:'/users/me/password',{method:'PATCH',body:{password}});setPassword('');setNotice(d.message)}catch(e){setError(message(e,'Gagal mengubah kata sandi.'))}finally{setBusy(false)}}
 return <form className="managed-form" onSubmit={submit}><fieldset disabled={busy}><label>{account?'Kata sandi pengganti':'Kata sandi baru'}<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/><small>Minimal 8 karakter. Langsung tersimpan tanpa konfirmasi email.</small></label>{error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-notice" role="status">{notice}</p>}<button type="submit" className="btn primary">{busy?'Menyimpan…':account?'Reset kata sandi':'Simpan kata sandi'}</button></fieldset></form>;
}
export function MyPasswordPage(){return <div className="managed-form"><h1>Kata Sandi Saya</h1><PasswordForm/></div>;}


export const AccountsPage=OrganizationAccounts;
export const TravelPage=LicensingPage;
