const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
let server,View,Table,List,MemoryRouter;
before(async()=>{const {createServer}=await import('vite');server=await createServer({server:{middlewareMode:true},appType:'custom'});View=(await server.ssrLoadModule('/src/pages/JourneyTicketView.tsx')).default;const pages=await server.ssrLoadModule('/src/pages/UmrahTravelPages.tsx');Table=pages.JourneyTicketTable;List=pages.UmrahTravelList;MemoryRouter=require('react-router-dom').MemoryRouter});
after(async()=>{if(server)await server.close()});
const form={ppiu_name:'Testing Travel',ppiu_license_number:'TEST-001',ppiu_officer_name:'Testing Pimpinan',ppiu_address:'Testing Address',supervised_party:'Testing PPIU',airport:'Testing Bandara',flight_number:'TEST-FLIGHT-123',airline:'Testing Airline',route:'Testing Pekanbaru → Jeddah',flight_type:'DIRECT',travel_date:'2026-10-01',travel_time:'09:15',inspection_date:'2026-09-30',pilgrim_count:2000,officer_count:2,officer_names:['Testing Petugas 1','Uji coba Petugas 2'],items:[],drive_url:'https://drive.google.com/drive/folders/testing'};
const ticket={id:'testing',reference:'TESTING-TICKET-001',journey_status:'DRAFT',form_data:form,return_form_data:{...form,return_notes:'Testing catatan kepulangan'},review_data:{},journey_history:[],created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'};
test('default ticket detail contains readable records, documents and actions, without form controls in every state',()=>{
 for(const phase of ['DRAFT','SUBMITTED','DEPARTED','RETURNING','RETURN_NOTES','CLOSED'])for(const tab of ['departure','return','history']){
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(View,{report:{...ticket,journey_status:phase},historyOnly:tab==='history',historyHref:'/admin/riwayat-perjalanan/testing',actions:React.createElement('button',{type:'button'},'Edit tiket')})));
  assert.ok(html.includes('Testing Travel'));assert.ok(html.includes('TESTING-TICKET-001'));assert.equal(html.includes('Edit tiket'),tab!=='history');assert.ok(!/<(?:form|input|select|textarea)\b/.test(html));
  if(tab==='departure'){assert.ok(html.includes('TEST-FLIGHT-123'));assert.ok(html.includes('Testing Petugas 1'));assert.ok(html.includes('2000'));assert.ok(html.includes('Buka folder Google Drive'));}
 }
});
test('ticket history shows named actor and correction reason with before/after data',()=>{
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(View,{report:{...ticket,journey_history:[{at:'2026-10-01T01:00:00Z',actor_name:'Testing Kanwil',action:'ADMIN_CORRECTION',state:'DRAFT',details:'Testing correction reason',changes:[{field:'flight_number',before:'BEFORE-001',after:'AFTER-002'}]}]},historyOnly:true,historyHref:'/admin/riwayat-perjalanan/testing',actions:null})));
 for(const value of ['Testing Kanwil','Testing correction reason','BEFORE-001','AFTER-002','Koreksi data oleh Kanwil'])assert.ok(html.includes(value));
});

test('table opens detail or dedicated history and displays WIB time and ready status',()=>{
 const render=history=>renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(Table,{rows:[{...ticket,journey_status:'SUBMITTED'}],base:'/admin',history})));
 const html=render(false);assert.ok(html.includes('<table'));assert.ok(html.includes('09:15'));assert.ok(html.includes('Siap Berangkat'));assert.ok(html.includes('/admin/laporan-umrah/testing'));assert.ok(!html.includes('Papan tiket'));assert.ok(render(true).includes('/admin/riwayat-perjalanan/testing'));
});
test('filters start collapsed and history has a separate heading',()=>{
 for(const history of [false,true]){const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(List,{base:'/admin',history})));assert.ok(html.includes('aria-expanded="false"'));assert.ok(html.includes('id="journey-filters" hidden=""'));assert.ok(!html.includes('Papan tiket'));if(history)assert.ok(html.includes('Riwayat Perjalanan'));}
});
test('default detail combines departure and return without tab controls or activity timeline',()=>{
 const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(View,{report:{...ticket,journey_status:'RETURNING'},historyHref:'/admin/riwayat-perjalanan/testing',actions:null})));assert.ok(html.includes('Keberangkatan'));assert.ok(html.includes('Kepulangan'));assert.ok(!html.includes('aria-label="Detail tiket"'));assert.ok(!html.includes('Aktivitas Terakhir'));assert.ok(html.includes('/admin/riwayat-perjalanan/testing'));
});
