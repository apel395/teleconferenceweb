const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
let server,View,Board,MemoryRouter;
before(async()=>{const {createServer}=await import('vite');server=await createServer({server:{middlewareMode:true},appType:'custom'});View=(await server.ssrLoadModule('/src/pages/JourneyTicketView.tsx')).default;Board=(await server.ssrLoadModule('/src/pages/JourneyTicketBoard.tsx')).default;MemoryRouter=require('react-router-dom').MemoryRouter});
after(async()=>{if(server)await server.close()});
const form={ppiu_name:'Testing Travel',ppiu_license_number:'TEST-001',ppiu_officer_name:'Testing Pimpinan',ppiu_address:'Testing Address',supervised_party:'Testing PPIU',airport:'Testing Bandara',flight_number:'TEST-FLIGHT-123',airline:'Testing Airline',route:'Testing Pekanbaru → Jeddah',flight_type:'DIRECT',travel_date:'2026-10-01',inspection_date:'2026-09-30',pilgrim_count:2000,officer_count:2,officer_names:['Testing Petugas 1','Uji coba Petugas 2'],items:[],drive_url:'https://drive.google.com/drive/folders/testing'};
const ticket={id:'testing',reference:'TESTING-TICKET-001',journey_status:'DRAFT',form_data:form,return_form_data:{...form,return_notes:'Testing catatan kepulangan'},review_data:{},journey_history:[],created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'};
test('default ticket detail contains readable records, documents and actions, without form controls in every state',()=>{
 for(const phase of ['DRAFT','SUBMITTED','DEPARTED','RETURNING','RETURN_NOTES','CLOSED'])for(const tab of ['departure','return','history']){
  const html=renderToStaticMarkup(React.createElement(View,{report:{...ticket,journey_status:phase},tab,onTab(){},actions:React.createElement('button',{type:'button'},'Edit tiket')}));
  assert.ok(html.includes('Testing Travel'));assert.ok(html.includes('TESTING-TICKET-001'));assert.ok(html.includes('Edit tiket'));assert.ok(!/<(?:form|input|select|textarea)\b/.test(html));
  if(tab==='departure'){assert.ok(html.includes('TEST-FLIGHT-123'));assert.ok(html.includes('Testing Petugas 1'));assert.ok(html.includes('2000'));assert.ok(html.includes('Buka folder Google Drive'));}
 }
});
test('ticket history shows named actor and correction reason with before/after data',()=>{
 const html=renderToStaticMarkup(React.createElement(View,{report:{...ticket,journey_history:[{at:'2026-10-01T01:00:00Z',actor_name:'Testing Kanwil',action:'ADMIN_CORRECTION',state:'DRAFT',details:'Testing correction reason',changes:[{field:'flight_number',before:'BEFORE-001',after:'AFTER-002'}]}]},tab:'history',onTab(){},actions:null}));
 for(const value of ['Testing Kanwil','Testing correction reason','BEFORE-001','AFTER-002','Koreksi data oleh Kanwil'])assert.ok(html.includes(value));
});

test('monitoring board places each journey exactly once and links cards to ticket detail',()=>{
 const states=['DRAFT','SUBMITTED','DEPARTED','RETURNING','RETURN_NOTES','CLOSED'];
 const rows=states.map((state,i)=>({...ticket,id:'testing-'+i,reference:'REF-'+i,journey_status:state}));
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Board,{rows,base:'/admin'})));
 assert.equal((html.match(/class="journey-column journey-column-/g)||[]).length,5);
 for(let i=0;i<states.length;i++){assert.equal(html.split('REF-'+i).length-1,1);assert.ok(html.includes('/admin/laporan-umrah/testing-'+i));}
 for(const label of ['Keberangkatan','Sudah Berangkat','Kepulangan dengan Catatan','Sudah Pulang','Menunggu pemeriksaan Kanwil','Draft travel'])assert.ok(html.includes(label));
 assert.ok(!/draggable=|<form\b/.test(html));
});
test('empty monitoring board keeps all five stages and explains page scope',()=>{
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Board,{rows:[],base:'/travel'})));
 assert.equal((html.match(/Belum ada tiket pada halaman ini/g)||[]).length,5);
});
