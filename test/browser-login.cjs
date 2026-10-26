// Fresh login against a production build; no saved session and no production writes.
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const base='http://127.0.0.1:4178',server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4178'],{stdio:'ignore'});let browser;
const user={id:'00000000-0000-0000-0000-000000000001',email:'ops@example.org',name:'Testing Admin',role:'admin',company_id:null,access_version:4,account_provisioned:true};
const cache=()=>({scope_key:'testing-admin-scope',revision:1,max_age_seconds:30,server_time:new Date().toISOString()});
const token='e30.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.testing';
async function scenario({legacy=false,chunkFailure=false,dashboardFailure=false}={}){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),calls=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route(/LiveDashboard-.*\.js/,async route=>{if(chunkFailure)return route.abort('failed');await new Promise(r=>setTimeout(r,250));await route.continue();});
 await context.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.slice(4),method=req.method();calls.push({path,method});let body;try{body=req.postDataJSON()}catch{}let data={},status=200;
  if(path==='/auth/login'){
   if(body.password==='wrong-password'){status=401;data={error:'Email atau password salah'};}
   else {await new Promise(r=>setTimeout(r,450));data={token,user,...(legacy?{}:{access:{role:'admin',company_id:null,modules:['overview','accounts','settings'],access_version:2}})};}
  }else if(path==='/settings/access/me'){await new Promise(r=>setTimeout(r,250));data={user,role:'admin',company_id:null,modules:['overview','accounts','settings'],cache:cache()};}
  else if(path==='/workspace/dashboard'){if(dashboardFailure){status=503;data={error:'Testing ringkasan sementara tidak tersedia'};}else data={dashboard:{role:'admin',year:2026,cache:cache(),summary:{system:{accounts:1,unprovisioned:0}}}};}
  else if(path==='/workspace/notifications')data={notifications:[]};
  else if(path==='/settings/contact')data={contact:{}};
  else{status=404;data={error:`Unexpected ${method} ${path}`};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });return {page,context,calls,errors};
}
async function login(s,password='testing-password'){
 await s.page.getByLabel('Email',{exact:true}).fill('ops@example.org');await s.page.getByLabel('Kata sandi',{exact:true}).fill(password);await s.page.getByRole('button',{name:'Masuk',exact:true}).click();
}
async function run(){
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const a=await scenario();await a.page.goto(base+'/masuk');await login(a,'wrong-password');await a.page.getByRole('alert').filter({hasText:'Email atau password salah'}).waitFor();assert.equal(await a.page.evaluate(()=>localStorage.getItem('kemenhaj-token')),null);
 await login(a);await a.page.getByRole('heading',{name:'Ringkasan Admin Kanwil',exact:true}).waitFor();await a.page.getByRole('link',{name:/Akun terdaftar/}).waitFor();assert.equal(new URL(a.page.url()).pathname,'/admin');assert.equal(a.calls.filter(c=>c.path==='/settings/access/me').length,0);assert.equal(a.calls.filter(c=>c.path==='/auth/me').length,0);assert.equal(a.calls.filter(c=>c.path==='/workspace/dashboard').length,1);assert.deepEqual(a.errors,[]);
 await a.page.reload();await a.page.getByRole('heading',{name:'Ringkasan Admin Kanwil',exact:true}).waitFor();assert.equal(a.calls.filter(c=>c.path==='/settings/access/me').length,1);assert.equal(a.calls.filter(c=>c.path==='/workspace/dashboard').length,1);assert.equal(await a.page.evaluate(()=>sessionStorage.getItem('kemenhaj-dashboard-cache-v1').includes('testing-password')),false);assert.deepEqual(a.errors,[]);await a.context.close();
 const old=await scenario({legacy:true});await old.page.goto(base+'/masuk');await login(old);await old.page.getByRole('heading',{name:'Ringkasan Admin Kanwil',exact:true}).waitFor();assert.equal(old.calls.filter(c=>c.path==='/settings/access/me').length,1);assert.deepEqual(old.errors,[]);await old.context.close();
 const failed=await scenario({chunkFailure:true});await failed.page.goto(base+'/masuk');await login(failed);await failed.page.getByRole('heading',{name:'Dashboard belum dapat ditampilkan',exact:true}).waitFor();assert.equal(await failed.page.getByRole('button',{name:'Muat ulang dashboard',exact:true}).isVisible(),true);await failed.context.close();
 const partial=await scenario({dashboardFailure:true});await partial.page.goto(base+'/masuk');await login(partial);await partial.page.getByRole('alert').filter({hasText:'Testing ringkasan sementara tidak tersedia'}).waitFor();assert.equal(await partial.page.getByRole('button',{name:'Muat ulang dashboard',exact:true}).isVisible(),true);assert.deepEqual(partial.errors,[]);await partial.context.close();
 console.log('PASS production fresh admin login: wrong-password retry, atomic access bootstrap without extra auth reads, dashboard without reload, reload restoration, legacy backend, chunk-error recovery and dashboard API failure.');
}
run().catch(async e=>{console.error(e);if(browser)for(const c of browser.contexts())for(const p of c.pages())console.error('FAIL PAGE',p.url(),await p.locator('body').innerText().catch(()=>''));process.exitCode=1;}).finally(async()=>{await browser?.close();server.kill('SIGTERM');});
