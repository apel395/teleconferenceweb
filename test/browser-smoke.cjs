// Focused browser integration against explicit mocked v7 API contracts. No production writes.
const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const {chromium}=require('playwright');
const checks=require('../src/lib/airportChecklist.json').filter(x=>x.code!=='DOC-05');
const base='http://127.0.0.1:4173';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173'],{env:{...process.env,VITE_API_URL:base+'/api'},stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
const tomorrow=new Date(Date.now()+86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
const form={ppiu_name:'Testing Travel',ppiu_license_number:'VERIFIED-001',ppiu_officer_name:'Testing Officer',ppiu_address:'Testing Riau',supervised_party:'Testing Representative',airport:'CGK',inspection_date:today,travel_date:today,travel_time:'00:01',flight_number:'TEST-001',airline:'Saudia',route:'Jakarta → Jeddah',flight_type:'DIRECT',pilgrim_count:23,officer_count:2,officer_names:['Testing One','Uji coba Two'],drive_url:'https://drive.google.com/drive/folders/testing',items:checks.map(c=>({code:c.code,result:'YES',notes:''}))};
const org={id:'60000000-0000-0000-0000-000000000001',name:'Testing Travel',office_address:'Testing Riau',organization_type:'PPIU',nib:'0123456789012',license_number:'VERIFIED-001',license_source:'https://example.org/testing',license_status:'VERIFIED',region:'Riau'};
let browser;
async function scenario(role,phase='PENDING_REVIEW',mobile=false){
 const user={id:'10000000-0000-0000-0000-000000000001',name:'Testing User',email:'testing@example.org',role,company_id:org.id,access_version:1,account_provisioned:true};
 let modules=role==='admin'?['overview','settings','accounts','journeys','licenses']:role==='operator'?['journeys','licenses']:role==='petugas_haji'?['hajj_staff']:['journeys','licenses'];
 let ticket={id:'20000000-0000-0000-0000-000000000001',reference:'TESTING-TICKET-001',kind:'DEPARTURE',journey_status:phase,form_data:{...form},return_form_data:{},review_data:{},journey_history:[],updated_at:'2026-10-20T00:00:00.000Z',created_at:'2026-10-20T00:00:00.000Z'};
 const calls=[],errors=[];const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(({user})=>{localStorage.setItem('kemenhaj-token','e30.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+86400}))+'.testing');localStorage.setItem('kemenhaj-user',JSON.stringify(user));},{user});
 await context.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.slice(4),method=request.method();let body;try{body=request.postDataJSON();}catch{}
  calls.push({path,method,body});if(method!=='GET')console.log('TEST MUTATION',role,method,path);let result={},status=200;
  if(path==='/auth/me')result={user};
  else if(path==='/settings/access/me')result={user,role,company_id:org.id,modules,access_version:1,cache:{scope_key:role+':'+user.id,revision:1,max_age_seconds:30,server_time:new Date().toISOString()}};
  else if(path==='/workspace/notifications')result={notifications:[]};
  else if(path==='/settings/contact')result={contact:{name:'Testing Admin',phone:'6281234567890',email:'testing@example.org',hours:'Testing hours',whatsapp_url:'https://wa.me/6281234567890',configured:true}};
  else if(path==='/settings/admin/contact')result={setting:{version:1,value:{name:'Testing Admin',phone:'6281234567890',email:'testing@example.org',hours:'Testing hours'}}};
  else if(path==='/settings/admin/roles')result={roles:[{role:'travel',modules:['journeys','licenses'],version:1}],bounds:{travel:['journeys','licenses']},labels:{travel:'Admin Travel PPIU/PIHK'},locked:{}};
  else if(path==='/settings/admin/roles/travel'){assert.equal(body.version,1);assert.ok(body.reason);result={role:{}};}
  else if(path==='/users/companies')result={companies:[org,{...org,id:'60000000-0000-0000-0000-000000000002',name:'Testing Unverified',license_status:'UNVERIFIED'}]};
  else if(path==='/users')result={users:[user]};
  else if(path==='/hajj-staff/assignments')result={assignments:[]};
  else if(path==='/operations/umrah-travel/company')result={company:org};
  else if(path==='/operations/umrah-travel/options')result={airlines:[],routes:[]};
  else if(path==='/operations/umrah-travel'&&method==='GET')result={reports:[ticket],total:1};
  else if(path.startsWith('/operations/umrah-travel/')){
   if(method==='GET')result={report:ticket};else{
    assert.equal(body.updated_at,ticket.updated_at,'Every existing-ticket mutation carries current revision');
    if(path.endsWith('/review-submit')){assert.equal(role,'operator');assert.equal(body.supervisor_1,'Testing Inspector 1');assert.equal(body.supervisor_2,'Uji coba Inspector 2');assert.ok(body.verification_items.every(x=>x.result==='YES'));ticket.journey_status='SUBMITTED';ticket.review_data=body;}
    else if(path.endsWith('/depart')){assert.equal(body.confirmed_departed,true);ticket.journey_status='DEPARTED';}
    else if(path.endsWith('/submit'))ticket.journey_status='PENDING_REVIEW';
    else if(path.endsWith('/return-submit')){ticket.journey_status='RETURNING';ticket.return_submitted_at=new Date().toISOString();}
    else if(path.endsWith('/return')){ticket.return_form_data=body.form_data;ticket.journey_status='RETURNING';}
    else if(method==='PATCH')ticket.form_data=body.form_data;
    ticket.updated_at=new Date(Date.parse(ticket.updated_at)+1000).toISOString();result={report:ticket};
   }
  }else{status=404;result={error:'Unexpected mocked endpoint: '+path};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 return {context,page,calls,errors,get ticket(){return ticket},revoke(){modules=[];}};
}
async function run(){
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await delay(100);}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 // Operator review is distinct from day-of-departure confirmation.
 const o=await scenario('operator');await o.page.goto(base+'/operator/laporan-umrah/'+o.ticket.id);await o.page.getByRole('button',{name:'Periksa & tetapkan siap berangkat'}).waitFor();assert.equal(await o.page.getByRole('link',{name:'Akun & Organisasi',exact:true}).count(),0);assert.equal(await o.page.locator('main input').count(),0);
 await o.page.getByRole('button',{name:'Periksa & tetapkan siap berangkat'}).click();await o.page.getByRole('heading',{name:'Pemeriksaan Operator Kanwil',exact:true}).waitFor();assert.equal(await o.page.locator('form select').count(),checks.length);for(const select of await o.page.locator('form select').all())await select.selectOption('YES');await o.page.getByLabel('Pengawas 1',{exact:false}).fill('Testing Inspector 1');await o.page.getByLabel('Pengawas 2',{exact:false}).fill('Uji coba Inspector 2');await o.page.getByRole('button',{name:'Submit operator — Siap Berangkat'}).click();await o.page.getByRole('button',{name:'Konfirmasi hari keberangkatan',exact:true}).waitFor();await o.page.getByRole('checkbox',{name:'Kesiapan keberangkatan hari ini telah dikonfirmasi.'}).check();await o.page.getByRole('button',{name:'Konfirmasi hari keberangkatan',exact:true}).click();await o.page.locator('.journey-status.phase-departed').waitFor();assert.equal(o.errors.length,0);await o.context.close();
 // A provincial administrator can inspect a pending ticket but cannot impersonate operator submission.
 const a=await scenario('admin');await a.page.goto(base+'/admin/laporan-umrah/'+a.ticket.id);await a.page.getByRole('button',{name:'Edit tiket',exact:true}).waitFor();assert.equal(await a.page.getByRole('button',{name:'Periksa & tetapkan siap berangkat'}).count(),0);
 await a.page.goto(base+'/admin/pengaturan');await a.page.getByText('Admin Travel PPIU/PIHK · 2 akses').click();await a.page.getByRole('checkbox',{name:'Perjalanan jemaah',exact:true}).uncheck();await a.page.getByLabel('Alasan perubahan *',{exact:true}).last().fill('Testing module restriction');await a.page.getByRole('button',{name:'Simpan hak akses',exact:true}).click();await a.page.getByText('Hak akses disimpan.',{exact:false}).first().waitFor();
 await a.page.goto(base+'/admin/akun');await a.page.getByRole('heading',{name:'Buat akun admin organisasi'}).waitFor();assert.equal(await a.page.locator('option:disabled').filter({hasText:'Testing Unverified'}).count(),1);assert.equal(a.errors.length,0);await a.context.close();
 // Travel detail is readable; company identity remains locked on mobile edit.
 const t=await scenario('travel','DRAFT',true);await t.page.goto(base+'/travel/laporan-umrah/'+t.ticket.id);await t.page.getByRole('button',{name:'Edit tiket',exact:true}).click();await t.page.getByLabel('Nama Penyelenggara PPIU/PIHK').waitFor();for(const label of ['Nama Penyelenggara PPIU/PIHK','Nomor Izin Berusaha PPIU/PIHK','Alamat kantor PPIU/PIHK'])assert.equal(await t.page.getByLabel(label,{exact:false}).getAttribute('readonly'),'');assert.equal(await t.page.getByLabel('Nomor Izin Berusaha PPIU/PIHK').inputValue(),'VERIFIED-001');await t.page.getByRole('button',{name:'Kirim ke Operator Kanwil',exact:true}).click();await t.page.locator('.journey-status.phase-pending_review').waitFor();
 await t.page.goto(base+'/travel/akun');await t.page.getByRole('heading',{name:'Admin Travel PPIU/PIHK',exact:true}).waitFor();assert.equal(t.calls.some(c=>c.path==='/users'),false);
 await t.page.goto(base+'/daftar-travel');await t.page.getByRole('heading',{name:'Hubungi Admin',exact:true}).waitFor();assert.equal(await t.page.getByRole('link',{name:'Daftar Akun',exact:true}).count(),0);assert.equal(await t.page.getByRole('link',{name:'Hubungi melalui WhatsApp'}).getAttribute('target'),'_blank');assert.equal(t.errors.length,0);await t.context.close();
 const ret=await scenario('travel','DEPARTED',true);await ret.page.goto(base+'/travel/laporan-umrah/'+ret.ticket.id);await ret.page.getByRole('button',{name:'Siapkan kepulangan',exact:true}).click();await ret.page.getByRole('textbox',{name:'Bandara *',exact:true}).fill('CGK');await ret.page.getByLabel('Tanggal tiba di Indonesia',{exact:false}).fill(tomorrow);await ret.page.getByLabel('Jam tiba di Indonesia (WIB)',{exact:false}).fill('09:00');await ret.page.getByLabel('Nomor penerbangan',{exact:false}).fill('TEST-RETURN');await ret.page.getByRole('combobox',{name:'Maskapai',exact:true}).selectOption('Saudia');await ret.page.getByRole('combobox',{name:'Rute penerbangan',exact:true}).selectOption('Jeddah → Jakarta');await ret.page.getByRole('combobox',{name:'Jenis penerbangan',exact:true}).selectOption('DIRECT');for(const select of await ret.page.locator('select').all()){if((await select.locator('option[value="YES"]').count())>0)await select.selectOption('YES');}await ret.page.getByRole('button',{name:'Kirim persiapan kepulangan',exact:true}).click();await ret.page.locator('.journey-status.phase-returning').waitFor();assert.ok(ret.calls.some(c=>c.path.endsWith('/return-submit')));assert.equal(ret.errors.length,0);await ret.context.close();
 const p=await scenario('petugas_haji');await p.page.goto(base+'/petugas-haji/penugasan');await p.page.getByRole('heading',{name:'Penugasan Petugas Haji'}).waitFor();assert.equal(await p.page.getByRole('link',{name:'Perjalanan Jemaah',exact:true}).count(),0);assert.equal(p.errors.length,0);await p.context.close();
 console.log('PASS: operator review/departure, admin restrictions/settings/accounts, travel mobile identity/submission, signup/contact and staff isolation.');
}
run().catch(async e=>{console.error(e);if(browser)for(const context of browser.contexts())for(const page of context.pages()){console.error('FAILURE PAGE',page.url(),await page.locator('body').innerText().catch(()=>''));console.error('BROWSER DAY',await page.evaluate(()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})),'FIXTURE DAY',today);}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.kill('SIGTERM');});
