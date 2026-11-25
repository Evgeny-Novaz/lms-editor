import React,{useEffect,useState} from 'react';
import {BookOpen,ChevronRight,Clock,ChevronDown,List,X,FileText} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import './student-preview.css';

export function StudentLessonHeader({course,topic,lesson,onCourse,onCourses}){
 return <header className="student-lesson-heading"><nav aria-label="Хлебные крошки урока"><button onClick={onCourses}>Курсы</button><ChevronRight size={12}/><button onClick={onCourse}>{course.title}</button></nav><h1>{lesson.title}</h1><p className="student-lesson-subtitle">{topic.title}</p><div className="student-lesson-meta"><span className="student-material-badge">Учебный материал</span><span><Clock size={14}/>{lesson.readingMinutes??6} минут чтения</span></div></header>
}
export function StudentPreviewSidebar({editor,course,lesson,onLesson}){
 const [headings,setHeadings]=useState([]),[active,setActive]=useState(0),[program,setProgram]=useState(false);
 useEffect(()=>{
  const root=editor.current;if(!root)return;
  const read=()=>setHeadings([...root.querySelectorAll('h2,h3')].map((el,index)=>({title:el.textContent,depth:el.tagName==='H3'?1:0,index})));
  read();const observer=new MutationObserver(read);observer.observe(root,{childList:true,subtree:true,characterData:true});
  const scroll=()=>{const nodes=[...root.querySelectorAll('h2,h3')];let index=0;nodes.forEach((el,i)=>{if(el.getBoundingClientRect().top<=160)index=i});setActive(index)};
  window.addEventListener('scroll',scroll,true);scroll();return()=>{observer.disconnect();window.removeEventListener('scroll',scroll,true)};
 },[editor,lesson.id]);
 function jump(index){const el=editor.current?.querySelectorAll('h2,h3')[index];if(el){setActive(index);el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}}
 return <aside className="student-preview-sidebar" aria-label="Навигация по уроку"><Dialog.Root open={program} onOpenChange={setProgram}><Dialog.Trigger className="student-program-trigger"><BookOpen size={16}/>Программа курса<ChevronRight size={16}/></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="student-program-overlay"/><Dialog.Content className="student-program-drawer"><header><Dialog.Title>Программа курса</Dialog.Title><Dialog.Close aria-label="Закрыть программу курса"><X size={18}/></Dialog.Close></header><Dialog.Description className="student-program-description">{course.title}</Dialog.Description><div className="student-program-topics">{course.topics.map((topic,i)=><details key={topic.id} open={topic.lessons.some(l=>l.id===lesson.id)}><summary><ChevronDown size={14}/><span>Блок {i+1} — {topic.title}</span></summary><div>{topic.lessons.map(l=><button key={l.id} aria-current={l.id===lesson.id?'page':undefined} onClick={()=>{setProgram(false);if(l.id!==lesson.id)onLesson(l)}}><FileText size={15}/><span>{l.title}</span></button>)}</div></details>)}</div></Dialog.Content></Dialog.Portal></Dialog.Root><nav className="student-preview-toc" aria-label="Оглавление урока"><h2><List size={14}/>На этой странице</h2><ol>{headings.map(h=><li key={h.index} data-depth={h.depth}><button aria-current={active===h.index?'location':undefined} onClick={()=>jump(h.index)}>{h.title}</button></li>)}</ol></nav></aside>
}
