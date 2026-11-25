import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonFileHtml,fileSizeLabel,formatLessonFiles} from './lesson-files.mjs';
test('uploaded file names and URLs are escaped, with separate editor and preview actions',()=>{
 const html=lessonFileHtml({name:'<report "1">.pdf',url:'data:application/pdf;base64,AA==',sizeLabel:fileSizeLabel(1024)});
 assert.ok(html.includes('&lt;report &quot;1&quot;&gt;.pdf'));
 assert.ok(html.includes('data-lesson-file-delete'));assert.ok(html.includes('lesson-file-download'));
 assert.throws(()=>lessonFileHtml({name:'x',url:'javascript:alert(1)',sizeLabel:'0 Б'}));
 assert.equal(fileSizeLabel(895),'895 Б');assert.equal(fileSizeLabel(1024),'1 КБ');
});
test('bundled attachment migration is idempotent and never restores a removed row',()=>{
 const list='<ul><li><a href="./machine-learning/metrics-notes.pdf" target="_blank" rel="noreferrer">Конспект: метрики и функции потерь.pdf</a> · 46 КБ</li><li><a href="./machine-learning/validation-guide.md" target="_blank" rel="noreferrer">Памятка: проверка качества модели.md</a> · 895 Б</li></ul>';
 const next=formatLessonFiles(list);assert.equal((next.match(/data-lesson-file contenteditable/g)||[]).length,2);
 assert.equal(formatLessonFiles(next),next);
 const edited='<p>Мой раздел без файлов</p>';assert.equal(formatLessonFiles(edited),edited);
});
