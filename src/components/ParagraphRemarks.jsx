import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {AlertCircle,Check,ChevronRight,MessageSquare,X} from 'lucide-react';
import {createParagraphRemarks,isLegacyAutoQuiz,findRemarkTarget,pendingLocalRemarks,LOCAL_REMARK_TYPES,remarkMaterial,quizHtml,caseHtml,escapeRemarkHtml} from '../lesson-remarks.mjs';
import './paragraph-remarks.css';

export default function ParagraphRemarks({lesson,courseId,editor,preview,onChange,onRemarksChange,onSnapshot,request,onRequestHandled}){
 const [activeId,setActiveId]=useState(null),[positions,setPositions]=useState([]),[error,setError]=useState('');
 const scrollTask=useRef(null),previousActive=useRef(null);
 const remarks=lesson.localRemarks||[],pending=pendingLocalRemarks(remarks),selected=remarks.find(r=>r.id===activeId),defaultMaterial=remarkMaterial(courseId,lesson.title);
 if(selected)previousActive.current=selected;const active=selected||previousActive.current,material=active?.quizDraft||defaultMaterial;
 const visible=!preview&&lesson.status==='Есть замечания';
 useEffect(()=>{setActiveId(null);setError('');return()=>clearTimeout(scrollTask.current)},[lesson.id,preview]);
 useEffect(()=>{if(!visible||lesson.localRemarks!==undefined)return;const raf=requestAnimationFrame(()=>{const root=editor.current;if(!root)return;const next=createParagraphRemarks(root,lesson.id);onRemarksChange(next);onChange()});return()=>cancelAnimationFrame(raf)},[lesson.id,visible,lesson.localRemarks]);
 // Return quizzes inserted by the previous automatic flow to proposals once.
 useEffect(()=>{
  const legacy=remarks.find(isLegacyAutoQuiz);if(!legacy)return;
  const raf=requestAnimationFrame(()=>{
   const root=editor.current;if(!root)return;
   const block=[...root.querySelectorAll('.lesson-self-check[data-quiz-id]')].find(n=>n.dataset.quizId===legacy.id);
   let draft=defaultMaterial;
   if(block){
    draft={...defaultMaterial,question:block.querySelector('legend')?.textContent||defaultMaterial.question,options:[...block.querySelectorAll('.lesson-quiz-option span')].map(n=>n.textContent),answer:Number(block.querySelector('[data-quiz-check]')?.dataset.correctAnswer??defaultMaterial.answer),explanation:block.querySelector('[data-quiz-feedback]')?.dataset.explanation||defaultMaterial.explanation};
    if(draft.options.length!==3)draft=defaultMaterial;
    onSnapshot();block.remove();onChange();
   }
   onRemarksChange(remarks.map(r=>r.id===legacy.id?{...r,status:'open',quizDraft:draft}:r));
  });
  return()=>cancelAnimationFrame(raf);
 },[lesson.id,lesson.localRemarks,preview]);
 useEffect(()=>{if(request&&remarks.some(r=>r.id===request)){setActiveId(request);setError('');onRequestHandled()}},[request,remarks]);
 useLayoutEffect(()=>{
  const root=editor.current;if(!root)return;
  let raf;
  const measure=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
   const base=root.parentElement.getBoundingClientRect();
   const next=pending.flatMap(remark=>{const target=findRemarkTarget(root,remark);return target?[{id:remark.id,top:target.getBoundingClientRect().top-base.top+3}]:[]});
   setPositions(prev=>JSON.stringify(prev)===JSON.stringify(next)?prev:next);
  })};
  root.querySelectorAll('[data-remark-open]').forEach(n=>n.removeAttribute('data-remark-open'));
  if(visible)pending.forEach(remark=>{const target=findRemarkTarget(root,remark);if(target)target.dataset.remarkOpen=remark.id});
  const resize=new ResizeObserver(measure),mutations=new MutationObserver(measure);resize.observe(root);mutations.observe(root,{childList:true,subtree:true,characterData:true});window.addEventListener('resize',measure);measure();
  return()=>{cancelAnimationFrame(raf);resize.disconnect();mutations.disconnect();window.removeEventListener('resize',measure)};
 },[lesson.id,lesson.localRemarks,visible]);
 function reveal(remark,close=false){
  const target=findRemarkTarget(editor.current,remark);if(!target)return;
  if(close)setActiveId(null);
  clearTimeout(scrollTask.current);scrollTask.current=setTimeout(()=>target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}),close?120:0);
 }
 function apply(){
  const root=editor.current,target=root&&findRemarkTarget(root,active);if(!target||target.textContent.trim()!==active.quote){setError('Исходный абзац изменился. Найдите его в уроке и внесите правку вручную.');return}
  setError('');const remark=active;
  onSnapshot();
  if(remark.kind==='outdated')target.innerHTML=escapeRemarkHtml(material.replacement);
  if(remark.kind==='example')target.insertAdjacentHTML('afterend',caseHtml(remark.id,material.example));
  if(remark.kind==='quiz')target.insertAdjacentHTML('afterend',quizHtml(remark.id,material));
  onChange();onRemarksChange(remarks.map(r=>r.id===remark.id?{...r,status:'resolved',...(r.kind==='quiz'?{quizApprovalVersion:2}:{} )}:r));
 }
 const description=active?.kind==='outdated'?'Кейс стоит обновить: сейчас он слабо связан с реальной практикой. Предлагаем заменить его более актуальной ситуацией, сохранив учебную цель.':active?.kind==='example'?'Абзац объясняет идею, но не показывает её применение. Конкретная ситуация поможет связать понятие с практикой.':'После этого абзаца стоит проверить понимание. Предлагаем один вопрос с выбором ответа и объяснением результата.';
 return <>{visible&&<div className="paragraph-remark-markers" aria-label="Замечания к абзацам">{positions.map(({id,top})=>{const remark=remarks.find(r=>r.id===id);return <button key={id} type="button" className="paragraph-remark-marker" data-active={activeId===id} style={{top}} onClick={()=>{setActiveId(id);setError('')}} title={LOCAL_REMARK_TYPES[remark.kind].title} aria-label={`Замечание к абзацу: ${LOCAL_REMARK_TYPES[remark.kind].title}`} aria-haspopup="dialog"><MessageSquare size={13}/><span>{remarks.indexOf(remark)+1}</span></button>})}</div>}
 <Dialog.Root open={visible&&!!activeId&&!!active} onOpenChange={open=>{if(!open)setActiveId(null)}} modal={false}>
 <Dialog.Portal><Dialog.Content className="paragraph-remark-drawer" aria-describedby="paragraph-remark-description" onInteractOutside={e=>e.preventDefault()} onOpenAutoFocus={e=>{e.preventDefault();document.getElementById('paragraph-remark-close')?.focus()}}>
  <header className="paragraph-drawer-header"><div><div className="paragraph-drawer-eyebrow"><MessageSquare size={14}/>Замечание к абзацу</div><Dialog.Title>{active&&LOCAL_REMARK_TYPES[active.kind].title}</Dialog.Title></div><Dialog.Close id="paragraph-remark-close" className="paragraph-drawer-close" aria-label="Закрыть замечание"><X size={18}/></Dialog.Close></header>
  <div className="paragraph-drawer-body">
   <span className="paragraph-demo-label">Демонстрационный сценарий</span>
   <div className="paragraph-drawer-section"><div className="paragraph-drawer-label">{active?.section}</div><blockquote>{active?.quote}</blockquote><button className="paragraph-text-link" onClick={()=>reveal(active)}>Показать абзац<ChevronRight size={14}/></button></div>
   <h3>В чём проблема</h3><Dialog.Description id="paragraph-remark-description">{description}</Dialog.Description>
   <h3>Что можно сделать</h3><p>{active?.kind==='outdated'?'Заменить только этот абзац. Остальной текст урока сохранится.':active?.kind==='example'?'Вставить пример сразу после абзаца. Исходный текст останется на месте.':'Посмотрите пример задания ниже. Добавьте его в урок, если оно подходит: вопрос появится сразу после этого абзаца.'}</p>
   {active?.kind!=='quiz'&&<div className="paragraph-proposal"><span>{active?.kind==='outdated'?'Новый кейс':'Предлагаемый пример'}</span><p>{active?.kind==='outdated'?material.replacement:material.example}</p></div>}
   {active?.kind==='quiz'&&<div className="paragraph-quiz-preview"><div className="paragraph-drawer-label">Предлагаемое задание</div><QuizProposal key={active.id} material={material} id={active.id}/></div>}
   {error&&<p className="paragraph-action-error" role="alert"><AlertCircle size={15}/>{error}</p>}
  </div>
  <footer className="paragraph-drawer-footer">{active?.status==='resolved'?<><p className="paragraph-action-success" role="status"><Check size={16}/>{active.kind==='quiz'?'Самопроверка добавлена в урок':'Правка применена'}</p><button className="paragraph-primary" onClick={()=>reveal(active,true)}>Вернуться к уроку</button></>:<><p>{active?.kind==='quiz'?'Задание пока не добавлено. Нажмите «Добавить в урок», чтобы вставить его после абзаца.':'Правка появится в уроке после нажатия. Предыдущая версия сохранится.'}</p><button className="paragraph-primary" onClick={apply}>{active?.kind==='quiz'?'Добавить в урок':active&&LOCAL_REMARK_TYPES[active.kind].action}</button></>}</footer>
 </Dialog.Content></Dialog.Portal></Dialog.Root></>;
}

function QuizProposal({material,id}){
 const[answer,setAnswer]=useState(null),[checked,setChecked]=useState(false);
 const correct=answer===material.answer;
 return <section className="lesson-self-check" data-quiz-result={checked?(correct?'correct':'incorrect'):undefined}><div className="lesson-quiz-eyebrow">Самопроверка · 1 вопрос</div><fieldset><legend>{material.question}</legend>{material.options.map((option,index)=><label className="lesson-quiz-option" key={index}><input type="radio" name={`proposal-${id}`} value={index} checked={answer===index} onChange={()=>{setAnswer(index);setChecked(false)}}/><span>{option}</span></label>)}</fieldset><button type="button" data-quiz-check disabled={answer===null} onClick={()=>setChecked(true)}>Проверить ответ</button>{checked&&<p data-quiz-feedback role="status">{correct?'Верно. ':'Пока неверно. '}{material.explanation}</p>}</section>;
}
