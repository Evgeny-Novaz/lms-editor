// Keep large lesson bodies and version history out of localStorage's small quota.
let databasePromise;
function openDatabase(){
 if(!databasePromise)databasePromise=new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return}
  const request=indexedDB.open('lms-editor-storage',1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('state'))db.createObjectStore('state')};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();databasePromise=undefined};resolve(db)};
  request.onerror=()=>reject(request.error||new Error('Cannot open browser storage'));
  request.onblocked=()=>reject(new Error('Browser storage is blocked'));
 }).catch(error=>{databasePromise=undefined;throw error});
 return databasePromise;
}
const database={
 async get(key){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),request=tx.objectStore('state').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.onabort=()=>reject(tx.error)})},
 async set(key,value){return this.batch([[key,value]])},
 async batch(entries,deletes=[]){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite'),state=tx.objectStore('state');entries.forEach(([key,value])=>state.put(value,key));deletes.forEach(key=>state.delete(key));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
};
export function createEditorStore({database,legacyStorage}){
 return {
  async load(key){
   try{const saved=await database.get(key);if(saved!==undefined)return saved}catch{}
   try{const saved=legacyStorage?.getItem(key);return saved==null?undefined:JSON.parse(saved)}catch{return undefined}
  },
  async save(key,value){
   try{
    await database.set(key,value);
    // Only discard the old copy once the complete transaction has committed.
    try{legacyStorage?.removeItem(key)}catch{}
    return;
   }catch(databaseError){
    let existing;try{existing=await database.get(key)}catch{}
    // Do not report a fallback as saved if a stale database copy would win on reload.
    if(existing!==undefined)throw new Error('Не удалось сохранить изменения в браузере.',{cause:databaseError});
    try{if(!legacyStorage)throw databaseError;legacyStorage.setItem(key,JSON.stringify(value));return}catch(legacyError){throw new Error('Не удалось сохранить изменения в браузере.',{cause:legacyError})}
   }
  }
 };
}
let store;
export function getEditorStore(){
 if(!store){let legacyStorage;try{legacyStorage=localStorage}catch{}store=createEditorStore({database,legacyStorage})}
 return store;
}
export function safeLegacyWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
export function safeLegacyRemove(key){try{localStorage.removeItem(key)}catch{}}

export const RESET_BACKUP_KEY='lms-reset-backup-v1';
export async function replaceEditorData(next,{backup,removeBackup=false,db=database}={}){
 const entries=[['lms-courses-v1',next.courses],['lms-docs-v1',next.docs],['lms-versions-v1',next.versions]];
 if(backup)entries.push([RESET_BACKUP_KEY,backup]);
 await db.batch(entries,removeBackup?[RESET_BACKUP_KEY]:[]);
 // Clear legacy copies only after the replacement and backup commit together.
 ['lms-courses-v1','lms-docs-v1','lms-versions-v1','lms-last'].forEach(safeLegacyRemove);
 if(next.last)safeLegacyWrite('lms-last',next.last);
}
