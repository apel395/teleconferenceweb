import {createContext,useContext,useState,useCallback,useEffect,useRef} from 'react';
import type {ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {api,configureApiCache,resetApiCache,type CacheContext,getUser,getToken,setSession,clearSession,isAuthenticated,watchSessionExpiration,type AuthSession,type User} from '../lib/api';
export type TravelRegistrationInput={email:string;password:string;name:string;company_name:string;nib:string;office_address:string;organization_type:string;phone:string;address:string;position:string;employee_number:string};
type AuthContextValue={scopeKey?:string;user:User|null;isAuth:boolean;accessLoading:boolean;accessError:string;modules:string[];can:(module:string)=>boolean;refreshAccess:()=>Promise<void>;login:(email:string,password:string)=>Promise<void>;logout:()=>void;registerTravel:(input:TravelRegistrationInput)=>Promise<void>};
export const AuthContext=createContext<AuthContextValue>({user:null,isAuth:false,accessLoading:true,accessError:'',modules:[],can:()=>false,refreshAccess:async()=>{},login:async()=>{},logout:()=>{},registerTravel:async()=>{throw Error('Hubungi admin untuk pembuatan akun.')}});
export function AuthProvider({children}:{children:ReactNode}){
 const navigate=useNavigate();
 const [user,setUser]=useState<User|null>(()=>isAuthenticated()?getUser():null),[isAuth,setIsAuth]=useState(isAuthenticated),[modules,setModules]=useState<string[]>([]),[accessLoading,setLoading]=useState(()=>isAuthenticated()),[accessError,setError]=useState('');
 const [scopeKey,setScopeKey]=useState('');
 const observedToken=useRef(getToken());
 const loginAccessToken=useRef<string|null>(null);
 const pending=useRef<{token:string;promise:Promise<void>}|null>(null);
 const refreshAccess=useCallback(async()=>{
  const token=getToken();if(!token||!isAuthenticated()){setModules([]);setLoading(false);return;}
  if(pending.current?.token===token)return pending.current.promise;
  const promise=(async()=>{
   try{
    const access=await api<{user?:User;cache?:CacheContext|null;role:User['role'];company_id:string|null;modules:string[]}>('/settings/access/me',{timeoutMs:20000});
    const [profile,context]=access.user?[{user:access.user},{cache:access.cache||null}]:await Promise.all([api<{user:User}>('/auth/me'),api<{cache:CacheContext}>('/workspace/cache-context',{cache:'no-store'}).catch(()=>null)]);
    if(getToken()!==token)return;
    if(profile.user.role!==access.role||(profile.user.company_id||null)!==(access.company_id||null))throw Error('Akses berubah. Silakan muat ulang.');
    setSession({token,user:profile.user});configureApiCache(context?.cache||null,token);setScopeKey(context?.cache?.scope_key||'');setUser(profile.user);setModules(access.modules);setError('');
   }catch(e){if(getToken()===token){resetApiCache();setModules([]);setError((e as Error).message);}}
   finally{if(getToken()===token)setLoading(false);if(pending.current?.token===token)pending.current=null;}
  })();pending.current={token,promise};return promise;
 },[]);
 const logout=useCallback(()=>{clearSession();setUser(null);setIsAuth(false);setModules([]);setLoading(false);setError('');},[]);
 const login=useCallback(async(email:string,password:string)=>{
  const session=await api<AuthSession>('/auth/login',{method:'POST',body:{email:email.trim(),password},timeoutMs:60000});
  const access=session.access;
  const ready=access&&access.role===session.user.role&&(access.company_id||null)===(session.user.company_id||null)&&Array.isArray(access.modules)&&access.modules.every(m=>typeof m==='string');
  observedToken.current=session.token;setSession(session);setScopeKey('');setUser(session.user);setError('');
  if(ready){loginAccessToken.current=session.token;setModules(access.modules);setLoading(false);setIsAuth(true);}
  else{loginAccessToken.current=null;setModules([]);setLoading(true);setIsAuth(true);await refreshAccess();}
 },[refreshAccess]);
 useEffect(()=>{
  const expired=()=>{logout();navigate('/masuk?sesi=berakhir',{replace:true});};
  const denied=()=>{resetApiCache();setModules([]);void refreshAccess();};
  const sync=()=>{const token=getToken(),changed=observedToken.current!==token;observedToken.current=token;const authenticated=isAuthenticated();setIsAuth(authenticated);setUser(authenticated?getUser():null);if(!authenticated){setModules([]);setLoading(false);}else if(changed){setModules([]);setLoading(true);void refreshAccess();}};
  window.addEventListener('kemenhaj-session-expired',expired);window.addEventListener('kemenhaj-access-denied',denied);
  const stop=watchSessionExpiration(sync,expired);
  return()=>{stop();window.removeEventListener('kemenhaj-session-expired',expired);window.removeEventListener('kemenhaj-access-denied',denied);};
 },[logout,navigate,refreshAccess]);
 useEffect(()=>{
  if(!isAuth)return;
  if(loginAccessToken.current===getToken())loginAccessToken.current=null;else void refreshAccess();
  const refresh=()=>{if(!document.hidden)void refreshAccess();};
  const timer=window.setInterval(refresh,30000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[isAuth,refreshAccess]);
 const registerTravel=async(_input:TravelRegistrationInput)=>{throw Error('Pendaftaran mandiri ditutup. Hubungi admin untuk pembuatan akun.');};
 return <AuthContext.Provider value={{scopeKey,user,isAuth,modules,can:module=>modules.includes(module),accessLoading,accessError,refreshAccess,login,logout,registerTravel}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
