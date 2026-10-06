import { useCallback, useEffect, useRef, useState } from 'react';
import { readFormDraft, writeFormDraft, removeFormDraft } from '../lib/formDraft';
export function useFormDraft<T>(key:string, enabled:boolean, initial:()=>T,valid?:(value:unknown)=>boolean){
 const [value,setValue]=useState<T>(()=>enabled?readFormDraft(key,initial,valid):initial());
 const active=useRef(true),latest=useRef(value);latest.current=value;
 const [storageAvailable,setStorageAvailable]=useState(true);
 const persist=useCallback(()=>{
   if(!enabled||!active.current)return true;
   const ok=writeFormDraft(key,latest.current);setStorageAvailable(ok);return ok;
 },[key,enabled]);
 useEffect(()=>{persist()},[value,persist]);
 const clear=useCallback(()=>{if(enabled){active.current=false;removeFormDraft(key)}},[key,enabled]);
 return {value,setValue,persist,clear,storageAvailable};
}
