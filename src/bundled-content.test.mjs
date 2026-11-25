import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeBundledCourses,mergeBundledDocuments} from './bundled-content.mjs';
const course=JSON.parse(readFileSync(new URL('./data/machine-learning-course.json',import.meta.url)));
const content=JSON.parse(readFileSync(new URL('./data/machine-learning-content.json',import.meta.url)));
test('imported course has all 15 lectures in four source sections with complete documents',()=>{
 assert.deepEqual(course.topics.map(t=>t.lessons.length),[2,3,5,5]);
 for(const l of course.topics.flatMap(t=>t.lessons)){
  assert.ok(content[l.id]?.includes('Содержание занятия'));
  assert.ok(content[l.id].includes('Дополнительные материалы'));
  assert.ok(content[l.id].includes('Работа с ML-моделью'));
 }
});
test('new course appears first in an existing cache while edits and deletions survive subsequent merges',()=>{
 const existing={id:'python',topics:[]};
 const merged=mergeBundledCourses([existing],[course]);assert.equal(merged[0].id,course.id);
 merged[0].topics[0].lessons[0].title='Моя редакция';
 const removed=merged[0].topics[0].lessons.pop();merged[0].deletedLessonIds=[removed.id];
 const again=mergeBundledCourses(merged,[course]);
 assert.equal(again[0].topics[0].lessons[0].title,'Моя редакция');
 assert.ok(!again[0].topics[0].lessons.some(l=>l.id===removed.id));
 assert.equal(mergeBundledDocuments({[removed.id]:'Мой текст'},content)[removed.id],'Мой текст');
});
