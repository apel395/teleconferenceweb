const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/lib/api.ts'),'utf8').replace('import.meta.env.VITE_API_URL','undefined');
const compiled=stripTypeScriptTypes(source).replace(/export /g,'')+'\nObject.assign(exports,{getToken,getUser,isAuthenticated,setSession,clearSession,sessionExpiresAt,expireSession,watchSessionExpiration,api});';
function setup(){
 let now=1000000,nextId=0,fetchCalls=0;
 const storage=new Map(),timers=new Map(),window=new EventTarget(),document=new EventTarget();
 window.setTimeout=(callback,delay)=>{const id=++nextId;timers.set(id,{callback,at:now+delay});return id};
 window.clearTimeout=id=>timers.delete(id);
 const context={exports:{},window,document,Event,atob:s=>Buffer.from(s,'base64').toString('binary'),Date:class extends Date{static now(){return now}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async()=>{fetchCalls++;return {ok:false,status:401,json:async()=>({error:'Expired'})}}};
 vm.runInNewContext(compiled,context);
 const api=context.exports;
 const jwt=seconds=>'e30.'+Buffer.from(JSON.stringify({exp:seconds})).toString('base64url')+'.signature';
 const login=token=>api.setSession({token,user:{name:'Test',role:'admin'}});
 function advance(ms,fire=true){now+=ms;if(fire){for(const [id,t]of [...timers])if(t.at<=now){timers.delete(id);t.callback()}}}
 return {api,context,window,document,timers,jwt,login,advance,get fetchCalls(){return fetchCalls}};
}
test('idle session expires on JWT deadline and removes token and profile',()=>{
 const s=setup();s.login(s.jwt(1002));let expired=0;s.window.addEventListener('kemenhaj-session-expired',()=>expired++);
 const stop=s.api.watchSessionExpiration(()=>{},()=>{});assert.equal(s.api.isAuthenticated(),true);
 s.advance(1999);assert.equal(expired,0);s.advance(1);assert.equal(expired,1);assert.equal(s.api.getToken(),null);assert.equal(s.api.getUser(),null);assert.equal(s.api.isAuthenticated(),false);stop();assert.equal(s.timers.size,0);
});
test('waking a background tab immediately rejects expiry even if timer was suspended',()=>{
 const s=setup();s.login(s.jwt(1001));let expired=0;s.window.addEventListener('kemenhaj-session-expired',()=>expired++);const stop=s.api.watchSessionExpiration(()=>{},()=>{});
 s.advance(2000,false);s.document.dispatchEvent(new Event('visibilitychange'));assert.equal(expired,1);assert.equal(s.api.getToken(),null);stop();
});
test('opening app with an expired or malformed token signs out',()=>{
 for(const token of ['invalid','e30.e30.signature']){const s=setup();s.login(token);let expired=0;s.window.addEventListener('kemenhaj-session-expired',()=>expired++);const stop=s.api.watchSessionExpiration(()=>{},()=>{});assert.equal(expired,1);assert.equal(s.api.getUser(),null);stop()}
});
test('logout and new login in another tab synchronize and rearm expiry',()=>{
 const s=setup();s.login(s.jwt(1001));let removed=0;const stop=s.api.watchSessionExpiration(()=>{},()=>removed++);
 s.login(s.jwt(1010));const event=new Event('storage');Object.defineProperty(event,'key',{value:'kemenhaj-token'});s.window.dispatchEvent(event);s.advance(2000);assert.equal(s.api.isAuthenticated(),true);
 s.api.clearSession();s.window.dispatchEvent(event);assert.equal(removed,1);stop();assert.equal(s.timers.size,0);
});
test('401 signs out, but a late 401 from previous login cannot clear a new session',async()=>{
 const s=setup();s.login(s.jwt(1010));let expired=0;s.window.addEventListener('kemenhaj-session-expired',()=>expired++);
 await assert.rejects(s.api.api('/operations/ppiu'));assert.equal(expired,1);assert.equal(s.api.getToken(),null);
 const old=s.jwt(1010),fresh=s.jwt(1020);s.login(old);let finish;
 s.context.fetch=()=>new Promise(r=>finish=r);const request=s.api.api('/operations/ppiu');s.login(fresh);finish({ok:false,status:401,json:async()=>({error:'Expired'})});await assert.rejects(request);assert.equal(s.api.getToken(),fresh);
});
test('expired token is rejected before protected request; invalid login does not expire session',async()=>{
 const s=setup();s.login(s.jwt(999));await assert.rejects(s.api.api('/users'));assert.equal(s.fetchCalls,0);
 s.login(s.jwt(1010));await assert.rejects(s.api.api('/auth/login',{method:'POST',body:{email:'test',password:'test'}}));assert.equal(s.api.getToken(),s.jwt(1010));
});
