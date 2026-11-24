import {useCallback,useEffect,useRef,useState} from 'react';
import {getEditorStore} from './browser-storage.mjs';

export function useEditorState(key,initialize,normalize=value=>value){
 const [value,setValue]=useState(initialize),[ready,setReady]=useState(false),[error,setError]=useState(null);
 const changed=useRef(false),normalizer=useRef(normalize),revision=useRef(0);
 useEffect(()=>{
  let cancelled=false;
  getEditorStore().load(key).then(saved=>{
   if(cancelled)return;
   if(saved!==undefined&&!changed.current)setValue(normalizer.current(saved));
   setReady(true);
  }).catch(()=>{if(!cancelled)setReady(true)});
  return()=>{cancelled=true};
 },[key]);
 useEffect(()=>{
  if(!ready)return;
  const request=++revision.current;
  getEditorStore().save(key,value).then(()=>{if(request===revision.current)setError(null)}).catch(()=>{if(request===revision.current)setError('Не удалось сохранить изменения в браузере. Освободите место и повторите попытку. Изменения пока доступны в открытой вкладке.')});
 },[key,value,ready]);
 const update=useCallback(next=>{changed.current=true;setValue(next)},[]);
 return [value,update,ready,error];
}
