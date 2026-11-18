const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const read=path=>readFileSync(join(__dirname,'..',path),'utf8');

test('Kemenhaj logo is the browser favicon',()=>{
 const html=read('index.html');
 assert.match(html,/rel="icon"[^>]*href="\/logo-kemenhaj\.png\?v=/);
 assert.ok(existsSync(join(__dirname,'..','public','logo-kemenhaj.png')));
});

test('login remains loading without exposing hosting information',()=>{
 const app=read('src/App.tsx');
 assert.match(app,/className="login-waiting"[^>]*>Sedang masuk…/);
 assert.doesNotMatch(app,/hosting gratis|Pada hosting gratis|waitingForServer|Server sedang disiapkan/);
 assert.match(app,/if\(submitting\.current\)return/);
});

test('travel applicant form has clear stages and private tracking receipt',()=>{
 const file=read('src/pages/TravelAccountRequest.tsx');
 for(const label of ['1. Identitas travel','2. Penanggung jawab akun','3. Legalitas dan berkas','Nomor pengajuan','Kunci pelacakan','Cek status / perbaiki pengajuan']){
  assert.ok(file.includes(label),label);
 }
 assert.match(file,/navigator\.clipboard\.writeText/);
 assert.match(file,/const \[form,setForm\]/);
 assert.match(file,/path:'LICENSED'/);
 assert.match(file,/required=\{!\['postal_code','deed_date'\]\.includes\(k\)\}/);
});
