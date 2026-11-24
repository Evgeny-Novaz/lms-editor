import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorStore,safeLegacyWrite,replaceEditorData,RESET_BACKUP_KEY} from './browser-storage.mjs';

function legacy(values={}){const data=new Map(Object.entries(values));return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}}
test('large history is saved to IndexedDB even when localStorage is full',async()=>{
 const saved=new Map(),storage=legacy({'lms-versions-v1':'{"old":true}'});storage.setItem=()=>{throw new DOMException('Full','QuotaExceededError')};
 const store=createEditorStore({database:{get:async key=>saved.get(key),set:async(key,value)=>saved.set(key,value)},legacyStorage:storage});
 const history={lesson:[{html:'<img src="data:image/png;base64,'+'a'.repeat(6000000)+'">'}]};
 await store.save('lms-versions-v1',history);
 assert.equal(saved.get('lms-versions-v1'),history);assert.equal(storage.getItem('lms-versions-v1'),null);
});
test('legacy data is retained until the durable transaction has committed',async()=>{
 const storage=legacy({docs:'{"lesson":"text"}'});let finish;
 const store=createEditorStore({database:{get:async()=>undefined,set:()=>new Promise(resolve=>{finish=resolve})},legacyStorage:storage});
 assert.deepEqual(await store.load('docs'),{lesson:'text'});
 const writing=store.save('docs',{lesson:'text'});assert.ok(storage.getItem('docs'));finish();await writing;assert.equal(storage.getItem('docs'),null);
});
test('failed saves preserve existing data and reject for the UI to handle',async()=>{
 const storage=legacy({docs:'{"lesson":"original"}'});storage.setItem=()=>{throw new DOMException('Full','QuotaExceededError')};
 const store=createEditorStore({database:{get:async()=>{throw Error('Blocked')},set:async()=>{throw Error('Blocked')}},legacyStorage:storage});
 await assert.rejects(store.save('docs',{lesson:'updated'}));assert.equal(storage.getItem('docs'),'{"lesson":"original"}');assert.deepEqual(await store.load('docs'),{lesson:'original'});
});
test('a migrated database takes precedence over legacy state',async()=>{
 const store=createEditorStore({database:{get:async()=>({lesson:'current'}),set:async()=>{}},legacyStorage:legacy({docs:'{"lesson":"old"}'})});
 assert.deepEqual(await store.load('docs'),{lesson:'current'});
});
test('optional navigation persistence cannot crash the editor',()=>{assert.equal(safeLegacyWrite('last',{}),false)});

test('failed database updates never masquerade as a successful stale fallback',async()=>{
 const storage=legacy();
 const store=createEditorStore({database:{get:async()=>({lesson:'saved'}),set:async()=>{throw Error('Database quota')}},legacyStorage:storage});
 await assert.rejects(store.save('docs',{lesson:'unsaved'}));
 assert.equal(storage.getItem('docs'),null);
 assert.deepEqual(await store.load('docs'),{lesson:'saved'});
});

test('reset stores a recovery backup and replacement state in one batch',async()=>{
 const calls=[];const db={batch:async(entries,deletes)=>calls.push({entries,deletes})};
 const backup={courses:[{id:'custom'}],docs:{l:'edited'},versions:{l:[]}},next={courses:[{id:'demo'}],docs:{},versions:{}};
 await replaceEditorData(next,{backup,db});
 assert.equal(calls.length,1);assert.equal(calls[0].entries.find(([key])=>key===RESET_BACKUP_KEY)[1],backup);
 assert.deepEqual(calls[0].entries.find(([key])=>key==='lms-courses-v1')[1],next.courses);
});
test('restoring a reset removes its backup only within the replacement transaction',async()=>{
 let batch;const next={courses:[],docs:{},versions:{}};
 await replaceEditorData(next,{removeBackup:true,db:{batch:async(entries,deletes)=>{batch={entries,deletes}}}});
 assert.deepEqual(batch.deletes,[RESET_BACKUP_KEY]);assert.equal(batch.entries.length,3);
});
