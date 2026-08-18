import { useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Check, GripVertical, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import './survey.css';

type QuestionType='TEXT'|'TEXTAREA'|'SINGLE_CHOICE'|'MULTIPLE_CHOICE'|'RATING'|'YES_NO';
type Question={id:number;prompt:string;type:QuestionType;required:boolean;options:string[]};

const serviceOptions=[
  'Pelaporan Travel Umrah','Pelaporan Jemaah Haji Khusus','Pelaporan Pemulangan',
  'Pemulangan Jemaah Haji Reguler','Pemulangan Petugas Haji','Permasalahan Umrah & Haji Khusus',
  'Pelaporan Manasik Kabupaten/Kota','Pengajuan Perizinan PPIU','Pengajuan Perizinan KBIHU',
  'Pelaporan Izin Cabang PPIU','Direktori Travel Umrah','Tanya Jawab Fikih Haji','Tutorial Manasik','Bacaan Doa'
];

const label:Record<QuestionType,string>={
  TEXT:'Jawaban singkat',TEXTAREA:'Jawaban panjang',SINGLE_CHOICE:'Pilihan tunggal',
  MULTIPLE_CHOICE:'Pilihan ganda',RATING:'Skala penilaian',YES_NO:'Ya / Tidak'
};

export default function SurveyAdmin(){
  const [title,setTitle]=useState('Survei Kepuasan Layanan');
  const [description,setDescription]=useState('Berikan penilaian terhadap layanan yang telah diterima.');
  const [allServices,setAllServices]=useState(true);
  const [selectedServices,setSelectedServices]=useState<string[]>([]);
  const [active,setActive]=useState(true);
  const [saved,setSaved]=useState(false);
  const [questions,setQuestions]=useState<Question[]>([
    {id:1,prompt:'Seberapa puas Anda terhadap layanan yang diterima?',type:'RATING',required:true,options:[]},
    {id:2,prompt:'Apakah informasi dari petugas mudah dipahami?',type:'YES_NO',required:true,options:[]},
    {id:3,prompt:'Apa yang perlu kami tingkatkan?',type:'TEXTAREA',required:false,options:[]},
  ]);

  const selectedLabel=useMemo(()=>allServices?'Semua layanan':`${selectedServices.length} layanan dipilih`,[allServices,selectedServices]);

  const addQuestion=()=>setQuestions(q=>[...q,{id:Date.now(),prompt:'Pertanyaan baru',type:'TEXT',required:false,options:[]}]);
  const updateQuestion=(id:number,patch:Partial<Question>)=>setQuestions(q=>q.map(item=>item.id===id?{...item,...patch}:item));
  const removeQuestion=(id:number)=>setQuestions(q=>q.filter(item=>item.id!==id));
  const toggleService=(name:string)=>setSelectedServices(items=>items.includes(name)?items.filter(x=>x!==name):[...items,name]);
  const addOption=(id:number)=>setQuestions(q=>q.map(item=>item.id===id?{...item,options:[...item.options,`Pilihan ${item.options.length+1}`]}:item));
  const updateOption=(id:number,index:number,value:string)=>setQuestions(q=>q.map(item=>item.id===id?{...item,options:item.options.map((x,i)=>i===index?value:x)}:item));
  const removeOption=(id:number,index:number)=>setQuestions(q=>q.map(item=>item.id===id?{...item,options:item.options.filter((_,i)=>i!==index)}:item));
  const needsOptions=(type:QuestionType)=>type==='SINGLE_CHOICE'||type==='MULTIPLE_CHOICE';

  return <div className="survey-admin-shell">
    <aside className="survey-sidebar">
      <div className="survey-brand"><span>KH</span><div><b>KEMENHAJ</b><small>Admin Portal Riau</small></div></div>
      <a href="/" className="survey-back"><ArrowLeft size={16}/> Kembali ke portal</a>
      <nav>
        <span>Manajemen layanan</span>
        <button className="active"><Settings2 size={17}/> Survey Layanan</button>
        <button><BarChart3 size={17}/> Hasil Survey</button>
      </nav>
      <div className="survey-side-note"><b>Survey dinamis</b><span>Admin dapat membuat daftar pertanyaan sendiri dan menerapkannya ke satu, beberapa, atau semua layanan.</span></div>
    </aside>

    <main className="survey-main">
      <header className="survey-topbar"><div><span>Administrasi</span><b>Survey Layanan</b></div><div className="survey-top-actions"><label className="active-toggle"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/><span/>{active?'Aktif':'Nonaktif'}</label><button className="survey-save" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),1800)}}>{saved?<Check size={16}/>:<Save size={16}/>} {saved?'Tersimpan':'Simpan survey'}</button></div></header>

      <div className="survey-content">
        <div className="survey-page-heading"><div><span className="survey-kicker">Survey builder</span><h1>Buat survey layanan</h1><p>Susun survey tanpa mengubah source code. Pertanyaan, tipe jawaban, dan target layanan dapat diatur oleh administrator.</p></div><div className="survey-count"><b>{questions.length}</b><span>Pertanyaan</span></div></div>

        <section className="survey-card survey-settings">
          <div className="survey-card-head"><div><span>01</span><div><b>Informasi survey</b><small>Identitas dan cakupan survey</small></div></div><span className="scope-pill">{selectedLabel}</span></div>
          <div className="survey-form-grid">
            <label className="full">Judul survey<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
            <label className="full">Deskripsi<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label>
            <div className="full service-target"><b>Survey berlaku untuk</b><div className="target-options"><button className={allServices?'selected':''} onClick={()=>setAllServices(true)}><span>{allServices&&<Check size={14}/>}</span><div><b>Semua layanan</b><small>Survey tersedia untuk seluruh layanan kantor</small></div></button><button className={!allServices?'selected':''} onClick={()=>setAllServices(false)}><span>{!allServices&&<Check size={14}/>}</span><div><b>Layanan tertentu</b><small>Pilih satu atau beberapa layanan</small></div></button></div></div>
            {!allServices&&<div className="service-selector full">{serviceOptions.map(name=><label key={name}><input type="checkbox" checked={selectedServices.includes(name)} onChange={()=>toggleService(name)}/><span>{name}</span></label>)}</div>}
          </div>
        </section>

        <section className="survey-card">
          <div className="survey-card-head"><div><span>02</span><div><b>Daftar pertanyaan</b><small>Urutkan dan atur tipe jawaban</small></div></div><button className="add-question top" onClick={addQuestion}><Plus size={15}/> Tambah pertanyaan</button></div>
          <div className="question-list">
            {questions.map((q,index)=><article className="question-builder" key={q.id}>
              <div className="drag"><GripVertical size={18}/><span>{String(index+1).padStart(2,'0')}</span></div>
              <div className="question-body">
                <div className="question-row"><input className="question-input" value={q.prompt} onChange={e=>updateQuestion(q.id,{prompt:e.target.value})}/><select value={q.type} onChange={e=>updateQuestion(q.id,{type:e.target.value as QuestionType})}>{Object.entries(label).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></div>
                {needsOptions(q.type)&&<div className="option-builder">{q.options.map((option,i)=><div key={i}><span className={q.type==='MULTIPLE_CHOICE'?'check-shape':'radio-shape'}/><input value={option} onChange={e=>updateOption(q.id,i,e.target.value)}/><button onClick={()=>removeOption(q.id,i)}><Trash2 size={14}/></button></div>)}<button className="inline-add" onClick={()=>addOption(q.id)}><Plus size={14}/> Tambah pilihan</button></div>}
                {q.type==='RATING'&&<div className="rating-preview">{[1,2,3,4,5].map(n=><span key={n}>{n}</span>)}<small>1 = sangat tidak puas · 5 = sangat puas</small></div>}
                {q.type==='YES_NO'&&<div className="yesno-preview"><span>Ya</span><span>Tidak</span></div>}
                <div className="question-foot"><label><input type="checkbox" checked={q.required} onChange={e=>updateQuestion(q.id,{required:e.target.checked})}/> Wajib dijawab</label><button onClick={()=>removeQuestion(q.id)}><Trash2 size={14}/> Hapus</button></div>
              </div>
            </article>)}
          </div>
          <button className="add-question bottom" onClick={addQuestion}><Plus size={16}/> Tambah pertanyaan baru</button>
        </section>

        <section className="survey-preview-card">
          <div><span className="survey-kicker">Preview publik</span><h2>{title||'Judul survey'}</h2><p>{description||'Deskripsi survey akan tampil di sini.'}</p></div>
          <div className="preview-meta"><span>{questions.length} pertanyaan</span><span>{selectedLabel}</span><span>{active?'Aktif':'Nonaktif'}</span></div>
        </section>
      </div>
    </main>
  </div>
}
