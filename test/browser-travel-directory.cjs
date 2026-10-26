// Updated travel entry UI only; explicit API mocks, no production writes.
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const base='http://127.0.0.1:4177',server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4177'],{env:{...process.env,VITE_API_URL:base+'/api'},stdio:'ignore'});
const id='00000000-0000-0000-0000-000000000123';let browser,companies=[];
async function scenario(role=null,mobile=false){
 const user=role?{id:'00000000-0000-0000-0000-000000000001',email:'testing@example.org',name:'Testing Admin',role,company_id:null,account_provisioned:true}:null;
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}}),page=await context.newPage(),calls=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(user)await context.addInitScript(user=>{localStorage.setItem('kemenhaj-token','e30.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600}))+'.testing');localStorage.setItem('kemenhaj-user',JSON.stringify(user));},user);
 await context.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.slice(4),method=req.method();let body;try{body=req.postDataJSON();}catch{}calls.push({path,method,body});let data={},status=200;
  if(path==='/settings/access/me')data={user,role,company_id:null,modules:role==='admin'?['overview','accounts']:['overview'],cache:null};
  else if(path==='/workspace/notifications')data={notifications:[]};
  else if(path==='/settings/contact')data={contact:{}};
  else if(path==='/users/companies'&&method==='GET')data={companies};
  else if(path==='/users/companies'&&method==='POST'){
   assert.equal(role,'admin');assert.equal(body.region,'Riau');assert.match(body.nib,/^[0-9]{13}$/);assert.equal(body.license_status,undefined);
   const company={...body,id,license_status:'UNVERIFIED',license_number:'',license_source:'',license_valid_until:null};companies.push(company);data={company};status=201;
  }else if(path===`/users/companies/${id}/identity`&&method==='PATCH'){companies[0]={...companies[0],...body};data={company:companies[0]};}
  else if(path===`/users/companies/${id}`&&method==='PATCH'){
   assert.equal(role,'admin');assert.equal(body.license_status,'VERIFIED');assert.ok(body.license_number);assert.ok(body.license_source.startsWith('https://'));
   companies[0]={...companies[0],...body};data={company:companies[0]};
  }else if(path==='/portal/directory')data={companies:companies.filter(c=>c.license_status==='VERIFIED')};
  else{status=404;data={error:`Unexpected contract ${method} ${path}`};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });return {page,context,calls,errors};
}
async function finish(s){assert.deepEqual(s.errors,[]);await s.context.close();}
async function run(){
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const a=await scenario('admin',true);await a.page.goto(base+'/admin/data-travel');
 await a.page.getByRole('heading',{name:'Data Travel PPIU/PIHK',exact:true}).waitFor();await a.page.getByRole('button',{name:'Tambah Travel',exact:true}).click();
 await a.page.getByLabel('Jenis travel *',{exact:true}).selectOption('PIHK');
 await a.page.getByLabel('Nama travel *',{exact:true}).fill('Testing Travel Riau');
 await a.page.getByLabel('NIB travel (13 digit) *',{exact:true}).fill('123');
 await a.page.getByLabel('Alamat kantor travel *',{exact:true}).fill('Uji coba Pekanbaru');
 await a.page.getByRole('button',{name:'Simpan data travel',exact:true}).click();assert.equal(a.calls.filter(c=>c.method==='POST').length,0);
 await a.page.getByLabel('NIB travel (13 digit) *',{exact:true}).fill('1234567890123');
 await a.page.getByRole('button',{name:'Simpan data travel',exact:true}).click();await a.page.getByRole('heading',{name:'Verifikasi izin travel',exact:true}).waitFor();
 assert.equal(a.calls.filter(c=>c.method==='POST').length,1);await a.page.getByRole('cell',{name:'Belum tampil',exact:true}).waitFor();
 await a.page.getByLabel('Nama travel *',{exact:true}).fill('Uji coba Travel Riau');await a.page.getByRole('button',{name:'Simpan identitas travel',exact:true}).click();await a.page.getByText('Identitas travel diperbarui.',{exact:true}).waitFor();
 await a.page.getByLabel('Status izin',{exact:true}).selectOption('VERIFIED');await a.page.getByRole('button',{name:'Simpan verifikasi izin',exact:true}).click();assert.equal(a.calls.filter(c=>c.method==='PATCH'&&c.path.endsWith(id)).length,0);
 await a.page.getByLabel('Nomor izin',{exact:true}).fill('TESTING-PIHK-123');await a.page.getByLabel('Sumber verifikasi / dokumen izin (HTTPS)',{exact:true}).fill('https://drive.google.com/testing-license');
 await a.page.getByRole('button',{name:'Simpan verifikasi izin',exact:true}).click();await a.page.getByText('Verifikasi izin travel disimpan.',{exact:true}).waitFor();await a.page.getByRole('cell',{name:'Tampil',exact:true}).waitFor();
 await a.page.getByLabel('Cari travel',{exact:true}).fill('tidak ditemukan');await a.page.getByText('Tidak ada travel yang sesuai filter.',{exact:true}).waitFor();await a.page.getByLabel('Cari travel',{exact:true}).fill('');await a.page.getByLabel('Jenis travel',{exact:true}).selectOption('PPIU');await a.page.getByText('Tidak ada travel yang sesuai filter.',{exact:true}).waitFor();await a.page.getByLabel('Jenis travel',{exact:true}).selectOption('PIHK');await a.page.getByRole('cell',{name:'Tampil',exact:true}).waitFor();
 await a.page.goto(base+'/direktori-travel');await a.page.getByRole('link',{name:'Tambah / Kelola Travel',exact:true}).click();await a.page.getByRole('heading',{name:'Data Travel PPIU/PIHK',exact:true}).waitFor();assert.equal(a.calls.some(c=>c.path==='/users'),false);await finish(a);
 const guest=await scenario(null,true);await guest.page.goto(base+'/direktori-travel');await guest.page.getByRole('heading',{name:'Uji coba Travel Riau',exact:true}).waitFor();assert.equal(await guest.page.getByRole('link',{name:'Tambah / Kelola Travel',exact:true}).count(),0);assert.equal(guest.calls.some(c=>c.path==='/users/companies'),false);await finish(guest);
 for(const role of ['travel','operator']){const other=await scenario(role);await other.page.goto(base+`/${role}/data-travel`);assert.equal(await other.page.getByRole('button',{name:'Tambah Travel',exact:true}).count(),0);assert.equal(other.calls.some(c=>c.path==='/users/companies'),false);await finish(other);}
 console.log('PASS travel entry: mobile create/NIB validation, identity edit, explicit license verification, table filters, admin shortcut, guest directory and non-admin guards.');
}
run().catch(async e=>{console.error(e);if(browser)for(const c of browser.contexts())for(const p of c.pages())console.error('FAIL PAGE',p.url(),await p.locator('body').innerText().catch(()=>''));process.exitCode=1;}).finally(async()=>{await browser?.close();server.kill('SIGTERM');});
