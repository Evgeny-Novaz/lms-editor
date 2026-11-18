import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import './editor-toolbar.css';

const tools={undo:['22bcf','Отменить'],redo:['c1465','Повторить'],format:['527e2','Стиль текста'],text:['b27f0','Начертание'],align:['f6f0a','Выравнивание'],list:['615c2','Список'],quote:['quote','Цитата'],code:['e3d29','Код'],formula:['formula','Формула'],link:['d6a4b','Ссылка'],anchor:['a7df5','Якорь'],sub:['39eec','Нижний индекс'],sup:['ddd52','Верхний индекс'],color:['abf18','Цвет текста'],highlight:['c7677','Цвет фона текста'],divider:['85a75','Разделитель'],info:['8c286','Инфоблок'],table:['3df0f','Таблица'],columns:['39370','Колонки'],accordion:['fa5d6','Аккордеон'],clear:['9ec5a','Очистить форматирование'],file:['25dc1','Файл'],image:['b298a','Изображение'],video:['1e481','Видео'],audio:['c7ea5','Аудио']};
const groups=[['undo','redo'],['format'],['text','align','list','quote','code','formula','link','anchor'],['sub','sup'],['color','highlight'],['divider','info','table','columns','accordion'],['clear'],['file','image','video','audio']];
const formats=[['p','Обычный','bbf44'],['h2','Заголовок','8f12c'],['h3','Подзаголовок','8f12c']];
const textOptions=[['bold','Жирный','40e71'],['italic','Курсив','bb221'],['underline','Подчёркнутый','7eb0a'],['strikeThrough','Зачёркнутый','337ab']];
const palette=['#18181b','#5a5e62','#8a8e93','#d53d3d','#bd6a18','#348158','#2b74bd','#7460ce','#a9408e','#ffffff','#000000','#a3965c'];
const backgrounds=['#ffffff','#f0f1f3','#e9e5ff','#dfeeff','#e2f4e7','#fff2cc','#ffe6dd','#fce0ef','#ddd5ff','#c6ebf0','#e7f0c5','#d6d6d6'];
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Icon=({name})=><img src={`${import.meta.env.BASE_URL}editor-icons/${name}.svg`} alt="" draggable="false"/>;

export default function EditorToolbar({editor,onChange,disabled}){
 const range=useRef(null),trigger=useRef(null),popup=useRef(null),upload=useRef(null),uploadKind=useRef('image');
 const [menu,setMenu]=useState(null),[value,setValue]=useState(''),[error,setError]=useState(''),[active,setActive]=useState({});
 const remember=()=>{const s=window.getSelection();if(s?.rangeCount&&editor.current?.contains(s.anchorNode)&&editor.current?.contains(s.focusNode))range.current=s.getRangeAt(0).cloneRange()};
 function restore(){const el=editor.current;if(!el)return false;el.focus({preventScroll:true});const s=window.getSelection();s.removeAllRanges();if(range.current&&el.contains(range.current.commonAncestorContainer))s.addRange(range.current);else{const r=document.createRange();r.selectNodeContents(el);r.collapse(false);s.addRange(r)}return true}
 function update(){const s=window.getSelection();if(!editor.current?.contains(s?.anchorNode))return;remember();const n=s.anchorNode.nodeType===1?s.anchorNode:s.anchorNode.parentElement;setActive({format:n.closest('h2,h3,p,pre')?.tagName.toLowerCase()||'p',...Object.fromEntries([...textOptions.map(x=>x[0]),'subscript','superscript'].map(c=>[c,document.queryCommandState(c)]))})}
 useEffect(()=>{document.addEventListener('selectionchange',update);return()=>document.removeEventListener('selectionchange',update)},[editor]);
 useEffect(()=>{
  if(!menu)return;
  const close=()=>setMenu(null),outside=e=>{if(!popup.current?.contains(e.target)&&!trigger.current?.contains(e.target))close()};
  const scroll=e=>{if(!popup.current?.contains(e.target))close()};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();close();trigger.current?.focus()}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',close);window.addEventListener('scroll',scroll,true);
  const first=popup.current?.querySelector('input,button');first?.focus({preventScroll:true});
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',close);window.removeEventListener('scroll',scroll,true)};
 },[menu]);
 function command(cmd,arg){if(!restore())return;document.execCommand(cmd,false,arg);remember();onChange();update();setMenu(null)}
 function insert(html){command('insertHTML',html+'<p><br></p>')}
 function chooseFormat(tag){restore();const s=window.getSelection(),node=s.anchorNode?.nodeType===1?s.anchorNode:s.anchorNode?.parentElement,list=node?.closest('ul,ol');if(list&&editor.current.contains(list))document.execCommand(list.tagName==='UL'?'insertUnorderedList':'insertOrderedList');document.execCommand('formatBlock',false,tag);remember();onChange();update();setMenu(null)}
 function open(kind,button){remember();if(menu?.kind===kind){setMenu(null);return}trigger.current=button;const r=button.getBoundingClientRect(),width=Math.min(['link','anchor','formula'].includes(kind)?320:250,window.innerWidth-16);setValue('');setError('');setMenu({kind,left:Math.max(8,Math.min(r.left,window.innerWidth-width-8)),top:r.bottom+8,width,maxHeight:Math.max(120,window.innerHeight-r.bottom-16)})}
 function act(key,e){
  if(['format','text','align','list','color','highlight','link','anchor','formula','table','columns'].includes(key))return open(key,e.currentTarget);
  if(['file','image','video','audio'].includes(key)){remember();uploadKind.current=key;upload.current.accept={image:'image/*',video:'video/*',audio:'audio/*',file:'*/*'}[key];upload.current.value='';upload.current.click();return}
  if(['undo','redo'].includes(key))return command(key);
  if(key==='sub'||key==='sup')return command(key==='sub'?'subscript':'superscript');
  if(key==='clear')return command('removeFormat');
  if(key==='code')return chooseFormat('pre');
  if(key==='quote')return chooseFormat('blockquote');
  if(key==='divider')return insert('<hr>');
  if(key==='info')return insert('<div class="pdf-callout"><div class="pdf-callout-label"><span>ОПРЕДЕЛЕНИЕ</span></div><div class="pdf-callout-body"><p><strong>Термин</strong> — добавьте определение.</p></div></div>');
  if(key==='accordion')insert('<details class="lesson-accordion" open><summary>Заголовок аккордеона</summary><p>Добавьте содержимое.</p></details>');
 }
 function submit(e){e.preventDefault();const text=value.trim();if(!text)return;
  if(menu.kind==='link'){if(!/^(https?:\/\/|mailto:|tel:|#[\p{L}\p{N}_:-])/iu.test(text)){setError('Укажите ссылку или якорь, например #razdel-1.');return}restore();const selected=window.getSelection().toString();if(selected)command('createLink',text);else insert(`<a href="${escapeHtml(text)}">${escapeHtml(text)}</a>`)}
  if(menu.kind==='anchor'){if(!/^[\p{L}_][\p{L}\p{N}_.:-]*$/u.test(text)){setError('Начните с буквы; используйте буквы, цифры и дефисы.');return}if(document.getElementById(text)){setError('Такой якорь уже есть. Выберите другое имя.');return}restore();const s=window.getSelection(),selected=s.toString();command('insertHTML',`<span id="${escapeHtml(text)}" class="lesson-anchor" title="Якорь: ${escapeHtml(text)}">${escapeHtml(selected)||'&#8203;'}</span>`)}
  if(menu.kind==='formula')insert(`<p class="lesson-formula">${escapeHtml(text)}</p>`);
 }
 async function attach(e){const file=e.target.files?.[0];if(!file)return;const kind=uploadKind.current;try{const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)}),name=escapeHtml(file.name),url=escapeHtml(src);insert(kind==='image'?`<img src="${url}" alt="${name}">`:kind==='video'?`<video controls src="${url}" aria-label="${name}"></video>`:kind==='audio'?`<audio controls src="${url}" aria-label="${name}"></audio>`:`<p><a href="${url}" download="${name}">${name}</a></p>`)}catch{setError('Не удалось прочитать файл. Попробуйте ещё раз.')}}
 function menuKeys(e){if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)||e.target.tagName==='INPUT')return;e.preventDefault();const items=[...popup.current.querySelectorAll('button')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus()}
 const item=(label,fn,icon,checked)=> <button key={label} type="button" className="editor-menu-item" role="menuitemradio" aria-checked={!!checked} onMouseDown={e=>e.preventDefault()} onClick={fn}>{icon&&<Icon name={icon}/>}<span>{label}</span>{checked&&<b className="editor-menu-check">✓</b>}</button>;
 const kind=menu?.kind;
 return <><div className={`toolbar editor-toolbar${disabled?' macro-toolbar-disabled':''}`} aria-disabled={disabled||undefined}>
  <div className="editor-toolbar-scroll" role="toolbar" aria-label="Инструменты редактора" onMouseDown={e=>{remember();e.preventDefault()}}>{groups.map((group,i)=><React.Fragment key={i}>{i>0&&<span className="editor-tool-separator" aria-hidden="true"/>}{group.map(key=><button key={key} type="button" className="editor-tool" aria-label={tools[key][1]} title={tools[key][1]} disabled={disabled} aria-haspopup={['format','text','align','list','color','highlight','link','anchor','formula','table','columns'].includes(key)?'dialog':undefined} aria-expanded={menu?.kind===key||undefined} aria-pressed={key==='sub'?!!active.subscript:key==='sup'?!!active.superscript:undefined} onClick={e=>act(key,e)}><Icon name={tools[key][0]}/></button>)}</React.Fragment>)}</div>
 </div><input ref={upload} type="file" hidden onChange={attach}/>
 {error&&!menu&&<p className="editor-upload-error" role="alert">{error}</p>}
 {menu&&createPortal(<div ref={popup} className="editor-tool-popup" style={{left:menu.left,top:menu.top,width:menu.width,maxHeight:menu.maxHeight}} role="dialog" aria-label={tools[kind][1]} onKeyDown={menuKeys}>
  <div role={['format','text','align','list','table','columns'].includes(kind)?'menu':undefined}>
  {kind==='format'&&formats.map(([tag,label,icon])=>item(label,()=>chooseFormat(tag),icon,active.format===tag))}
  {kind==='text'&&textOptions.map(([cmd,label,icon])=>item(label,()=>command(cmd),icon,active[cmd]))}
  {kind==='align'&&[['justifyLeft','По левому краю'],['justifyCenter','По центру'],['justifyRight','По правому краю'],['justifyFull','По ширине']].map(([cmd,label])=>item(label,()=>command(cmd),'f6f0a'))}
  {kind==='list'&&[['insertUnorderedList','Маркированный список','65f9f'],['insertOrderedList','Нумерованный список','list-ordered']].map(([cmd,label,icon])=>item(label,()=>command(cmd),icon))}
  {['color','highlight'].includes(kind)&&<><div className="editor-menu-title">{tools[kind][1]}</div><div className="editor-color-grid">{(kind==='color'?palette:backgrounds).map(c=><button type="button" key={c} style={{backgroundColor:c}} aria-label={`Цвет ${c}`} title={c} onClick={()=>command(kind==='color'?'foreColor':'hiliteColor',c)}/>)}</div><label className="editor-custom-color">Другой цвет<input aria-label="Другой цвет" type="color" onChange={e=>command(kind==='color'?'foreColor':'hiliteColor',e.target.value)}/></label>{item('Сбросить цвет',()=>command(kind==='color'?'foreColor':'hiliteColor',kind==='color'?'#18181b':'transparent'))}</>}
  {kind==='table'&&[2,3,4].map(n=>item(`Таблица ${n} × ${n}`,()=>insert(`<table><tbody>${Array.from({length:n},(_,i)=>`<tr>${Array.from({length:n},()=>i===0?'<th>Заголовок</th>':'<td>Текст</td>').join('')}</tr>`).join('')}</tbody></table>`),'3df0f'))}
  {kind==='columns'&&[2,3].map(n=>item(`${n} колонки`,()=>insert(`<div class="lesson-columns" style="--lesson-columns:${n}">${Array.from({length:n},()=>'<div><p>Текст колонки</p></div>').join('')}</div>`),'39370'))}
  {['link','anchor','formula'].includes(kind)&&<form onSubmit={submit}><label className="editor-menu-title" htmlFor="editor-tool-value">{kind==='link'?'Адрес ссылки':kind==='anchor'?'Имя якоря':'Формула'}</label><input id="editor-tool-value" value={value} onChange={e=>{setValue(e.target.value);setError('')}} placeholder={kind==='link'?'https://example.com или #razdel-1':kind==='anchor'?'razdel-1':'E = Y'} required autoComplete="off"/>{error&&<p role="alert" className="editor-tool-error">{error}</p>}<div className="editor-menu-actions"><button type="button" onClick={()=>setMenu(null)}>Отмена</button><button type="submit" className="editor-menu-primary">Применить</button></div></form>}
  </div>
 </div>,document.body)}</>;
}
