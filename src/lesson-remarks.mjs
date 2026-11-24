export const LOCAL_REMARK_TYPES={outdated:{title:'Кейс устарел',action:'Заменить кейс'},example:{title:'Нужен поясняющий кейс',action:'Добавить кейс'},quiz:{title:'Нужна самопроверка',action:'Добавить в урок'}};
export const pendingLocalRemarks=remarks=>(remarks||[]).filter(r=>r.status==='open');
export const isLegacyAutoQuiz=remark=>remark.kind==='quiz'&&remark.status==='resolved'&&remark.quizApprovalVersion!==2;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function remarkMaterial(courseId,lessonTitle){
 if(courseId==='python')return {
  replacement:'В сервисе онлайн-обучения имя студента хранится как текст, количество пройденных уроков — как целое число, а признак завершения курса — как логическое значение. Например: student_name = "Алиса", completed_lessons = 12, is_completed = True. Python определяет тип каждого значения автоматически.',
  example:'Представьте личный кабинет студента: переменная course_title хранит название курса, lessons_count — количество уроков, а is_enrolled — записан ли студент на курс. Для этих значений подойдут типы str, int и bool соответственно.',
  question:'В переменной completed_lessons нужно хранить количество пройденных уроков, например 12. Какой тип данных подходит?',options:['str — строка','int — целое число','bool — логическое значение'],answer:1,explanation:'Количество уроков — целое число, поэтому подходит int. Тип str хранит текст, а bool — True или False.'
 };
 if(courseId==='economics')return {
  replacement:'Рассмотрим расходы на цифровой сервис: семья оплачивает подписку из своего дохода, а компания использует выручку для выплаты зарплат и развития продукта. Этот пример показывает, как расходы одного участника экономики становятся доходами другого.',
  example:'Семья получила доход 100 000 рублей и потратила на товары и услуги 75 000 рублей. Оставшиеся 25 000 рублей — сбережения. На этом примере видно, как доход распределяется между потреблением и сбережениями.',
  question:'Доход семьи составил 100 000 рублей, а потребительские расходы — 75 000 рублей. Чему равны сбережения?',options:['25 000 рублей','75 000 рублей','100 000 рублей'],answer:0,explanation:'Сбережения равны разнице между доходом и потребительскими расходами: 100 000 − 75 000 = 25 000 рублей.'
 };
 if(courseId==='math')return {
  replacement:'В системе рекомендаций предпочтения студента можно представить вектором: каждая координата показывает интерес к одной теме. Изменение предпочтений описывается изменением соответствующих координат.',
  example:'Вектор (2, 3) можно понимать как два часа работы над первой темой и три часа над второй. Если добавить ещё по часу, получится (2, 3) + (1, 1) = (3, 4): складываются соответствующие координаты.',
  question:'Чему равна сумма векторов (2, 3) и (1, 1)?',options:['(2, 3, 1, 1)','(3, 4)','(3, 3)'],answer:1,explanation:'Векторы складываются по координатам: (2 + 1, 3 + 1) = (3, 4).'
 };
 if(courseId==='data')return {
  replacement:'При анализе использования учебного приложения сравнивают число активных студентов за одинаковые периоды. Например, недельную активность сопоставляют с предыдущей неделей, сохраняя одинаковые правила подсчёта.',
  example:'Если за неделю сервис посетили 120 студентов, а за следующую — 150, абсолютный прирост составил 30 студентов. Сравнивать значения корректно, если в обоих случаях одинаково определён активный пользователь.',
  question:'За первую неделю сервис посетили 120 студентов, а за вторую — 150. Каков абсолютный прирост?',options:['30 студентов','150 студентов','270 студентов'],answer:0,explanation:'Абсолютный прирост — разница между новым и предыдущим значениями: 150 − 120 = 30.'
 };
 return {
  replacement:`Рассмотрим тему «${lessonTitle}» на примере современного учебного сервиса: студент должен найти нужный урок и продолжить работу. Понятные названия, видимый следующий шаг и обратная связь помогают выполнить эту задачу.`,
  example:'Студент открыл страницу курса и хочет продолжить обучение. Кнопка «Продолжить» с названием следующего урока помогает ему понять, куда он перейдёт и что будет делать.',
  question:'Какое решение лучше помогает студенту продолжить обучение?',options:['Скрыть следующий шаг','Показать понятную кнопку с названием следующего урока','Оставить только декоративную иллюстрацию'],answer:1,explanation:'Понятное действие и название следующего урока помогают студенту предсказать результат нажатия.'
 };
}

export function createParagraphRemarks(root,lessonId){
 const paragraphs=[...root.querySelectorAll('p')].filter(p=>p.textContent.trim().length>35&&!p.closest('blockquote,.pdf-callout,.pdf-intro,.lesson-self-check,.pdf-footnote'));
 if(!paragraphs.length)return [];
 const used=new Set();
 return ['outdated','example','quiz'].flatMap((kind,i)=>{
  let target=kind==='outdated'?[...root.querySelectorAll('pre')].map(n=>n.nextElementSibling).find(n=>n?.tagName==='P'&&paragraphs.includes(n)):null;
  if(kind==='example')target=paragraphs.find(n=>/переменная —|основные понятия|изучает|представьте/i.test(n.textContent));
  target=target&&!used.has(target)?target:paragraphs.find((n,index)=>index>=Math.floor(i*(paragraphs.length-1)/2)&&!used.has(n))||paragraphs.find(n=>!used.has(n));
  if(!target)return [];used.add(target);
  const id=`${lessonId}-${kind}`;target.dataset.remarkAnchor=id;
  const before=[...root.querySelectorAll('h2,h3')].filter(h=>Boolean(h.compareDocumentPosition(target)&4)).pop();
  return [{id,kind,quote:target.textContent.trim(),section:before?.textContent||'Введение',status:'open'}];
 });
}
export function findRemarkTarget(root,remark){
 return [...root.querySelectorAll('[data-remark-anchor]')].find(n=>n.dataset.remarkAnchor===remark.id)||[...root.querySelectorAll('p')].find(n=>n.textContent.trim()===remark.quote);
}
export function quizHtml(id,material){
 return `<section class="lesson-self-check" data-quiz-id="${esc(id)}" contenteditable="false"><div class="lesson-quiz-eyebrow">Самопроверка · 1 вопрос</div><fieldset><legend>${esc(material.question)}</legend>${material.options.map((option,i)=>`<label class="lesson-quiz-option"><input type="radio" name="quiz-${esc(id)}" value="${i}"><span>${esc(option)}</span></label>`).join('')}</fieldset><button type="button" data-quiz-check data-correct-answer="${material.answer}">Проверить ответ</button><p data-quiz-feedback data-explanation="${esc(material.explanation)}" hidden role="status"></p></section>`;
}
export function caseHtml(id,text){return `<div class="pdf-callout" data-remark-addition="${esc(id)}"><div class="pdf-callout-label"><span>ПРИМЕР</span></div><div class="pdf-callout-body"><p>${esc(text)}</p></div></div>`}
export function handleLessonQuiz(event){
 const button=event.target.closest?.('[data-quiz-check]');if(!button)return false;
 event.preventDefault();const quiz=button.closest('.lesson-self-check'),selected=quiz.querySelector('input[type="radio"]:checked'),feedback=quiz.querySelector('[data-quiz-feedback]');
 feedback.hidden=false;
 if(!selected){feedback.textContent='Выберите один вариант ответа.';quiz.dataset.quizResult='empty';return true}
 const correct=selected.value===button.dataset.correctAnswer;
 quiz.dataset.quizResult=correct?'correct':'incorrect';feedback.textContent=(correct?'Верно. ':'Пока неверно. ')+feedback.dataset.explanation;return true;
}
export function serializeLessonContent(root){
 const copy=root.cloneNode(true);
 copy.querySelectorAll('[data-remark-open]').forEach(n=>n.removeAttribute('data-remark-open'));
 copy.querySelectorAll('.lesson-self-check').forEach(quiz=>{quiz.removeAttribute('data-quiz-result');quiz.querySelectorAll('input').forEach(n=>n.removeAttribute('checked'));const feedback=quiz.querySelector('[data-quiz-feedback]');if(feedback){feedback.textContent='';feedback.hidden=true}});
 return copy.innerHTML;
}
export {esc as escapeRemarkHtml};
