const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const documentIcon='<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6M8 9h2"/>';
const codeIcon='<path d="M14 2H6a2 2 0 0 0-2 2v8m10-10v6h6v12a2 2 0 0 1-2 2h-4M14 2l6 6M7 16l-3 3 3 3m4-6 3 3-3 3"/>';
export function fileSizeLabel(bytes){
 if(bytes<1024)return `${bytes} Б`;
 const unit=bytes<1024*1024?'КБ':'МБ';
 return `${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(bytes/(unit==='КБ'?1024:1024*1024))} ${unit}`;
}
export function lessonFileHtml({name,url,sizeLabel}){
 if(!/^(?:data:|https?:\/\/|\.\/|\/)/i.test(url))throw new Error('Unsupported attachment URL');
 const ext=name.split('.').pop().toLowerCase(),kind=ext==='pdf'?'pdf':['md','js','ts','py','json','html','css','ipynb'].includes(ext)?'code':'document';
 const title=escapeHtml(name),href=escapeHtml(url);
 return `<div class="lesson-file" data-lesson-file contenteditable="false"><a class="lesson-file-main" href="${href}" download="${title}" aria-label="Открыть файл: ${title}"><span class="lesson-file-icon" data-kind="${kind}">${svg(kind==='code'?codeIcon:documentIcon)}</span><span class="lesson-file-info"><strong>${title}</strong><small>${escapeHtml(sizeLabel)}</small></span></a><button type="button" class="lesson-file-action lesson-file-delete" data-lesson-file-delete aria-label="Удалить файл: ${title}" title="Удалить">${svg('<path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>')}</button><a class="lesson-file-action lesson-file-download" href="${href}" download="${title}" aria-label="Скачать файл: ${title}" title="Скачать">${svg('<path d="M12 3v12m-6-6 6 6 6-6M5 21h14"/>')}</a></div>`;
}
const bundledFiles=[{name:'Конспект: метрики и функции потерь.pdf',url:'./machine-learning/metrics-notes.pdf',sizeLabel:'46 КБ'},{name:'Памятка: проверка качества модели.md',url:'./machine-learning/validation-guide.md',sizeLabel:'895 Б'}];
const oldList='<ul>'+bundledFiles.map(f=>`<li><a href="${f.url}" target="_blank" rel="noreferrer">${f.name}</a> · ${f.sizeLabel}</li>`).join('')+'</ul>';
export function formatLessonFiles(html){return html.replaceAll(oldList,`<div class="lesson-files">${bundledFiles.map(lessonFileHtml).join('')}</div>`)}
