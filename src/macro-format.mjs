// Demo rule: sentence case in headings, even when the PDF uses all capitals.
export function normalizeLessonHeadings(source){
 return source.replace(/(<h[1-6]\b[^>]*>)([\s\S]*?)(<\/h[1-6]>)/gi,(match,open,body,close)=>{
  const plain=body.replace(/<[^>]*>/g,'');
  if(plain!==plain.toLocaleUpperCase('ru')||plain===plain.toLocaleLowerCase('ru'))return match;
  let first=true;
  body=body.replace(/(<[^>]*>)|([^<]+)/g,(part,tag,text)=>{
   if(tag)return tag;
   let value=text.toLocaleLowerCase('ru');
   value=value.replace(/(^|[^\p{L}])(ввп|кнр|сша|pdf|ai|lms|ux)(?=$|[^\p{L}])/gu,(_,prefix,word)=>prefix+word.toUpperCase());
   if(first&&/[а-яёa-z]/i.test(value)){value=value.replace(/[а-яёa-z]/i,c=>c.toLocaleUpperCase('ru'));first=false}
   return value.replace(/([.!?]\s+)([а-яёa-z])/g,(_,prefix,c)=>prefix+c.toLocaleUpperCase('ru'));
  });
  return open+body+close;
 });
}
export function formatMacroLesson(source){
 source=normalizeLessonHeadings(source);
 if(source.includes('data-macro-formatted="1"'))return source;
 let html=source;
 // The PDF examples contain several paragraphs under a single shared label.
 html=html.replace(/(<blockquote><strong>ПРИМЕР<\/strong><p>Пётр[\s\S]*?<\/p>)<\/blockquote>\s*(<p>Иван[\s\S]*?<\/p>)\s*(<p>Банк[\s\S]*?<\/p>)/, '$1$2$3</blockquote>');
 html=html.replace(/(<blockquote><strong>ПРИМЕР<\/strong><p>В 1920-х[\s\S]*?<\/p>)<\/blockquote>\s*(<p>В 1929[\s\S]*?<\/p>)\s*(<p>Кризис быстро[\s\S]*?<\/p>)/, '$1$2$3</blockquote>');
 html=html.replace(/^(<h3>Контекст<\/h3>[\s\S]*?)(?=<h2>)/,(_,intro)=>'<div class="pdf-intro">'+intro.replace(/<h3>(Контекст|Применение|Краткий план)<\/h3>([\s\S]*?)(?=<h3>|$)/g,(_,title,body)=>`<div class="pdf-intro-row"><h3 class="pdf-intro-label">${title}</h3><div class="pdf-intro-body">${body.trim()}</div></div>` )+'</div>');
 const note=html.match(/<p><sup>1<\/sup> Актив[\s\S]*?<\/ul>/);
 if(note){
   html=html.replace(note[0],'');
   html=html.replace('рост цены актива<sup>1</sup>', '<a href="#macro-asset-note" role="button" contenteditable="false" class="pdf-footnote-trigger" aria-expanded="false" aria-controls="macro-asset-note">рост цены актива<sup>1</sup></a>');
   html=html.replace(/(<blockquote><strong>ОПРЕДЕЛЕНИЕ<\/strong><p>Экономический пузырь[\s\S]*?<\/p>)(<\/blockquote>)/,`$1<div id="macro-asset-note" data-macro-note hidden class="pdf-footnote">${note[0]}</div>$2`);
 }
 html=html.replace(/<blockquote><strong>(ОПРЕДЕЛЕНИЕ|ПРИМЕР)<\/strong>([\s\S]*?)<\/blockquote>/g,(_,label,body)=>{
  if(label==='ОПРЕДЕЛЕНИЕ')body=body.replace(/^<p>([^<]*?)( — )/,'<p><strong>$1</strong>$2');
  return `<div class="pdf-callout"><div class="pdf-callout-label"><span>${label}</span></div><div class="pdf-callout-body">${body}</div></div>`;
 });
 html=html.replace(/<p>([^]*?)<\/p>/g,(match,body)=>{
  const plain=body.replace(/<[^>]*>/g,'').trim();
  return plain.includes('=')&&!plain.includes('→')&&plain.length<130?`<p class="pdf-equation">${body}</p>`:match;
 });
 html=html.replace('<h2>Если кратко</h2>','<h2 class="pdf-summary-heading">Если кратко</h2>');
 return `<div data-macro-formatted="1">${html}</div>`;
}
