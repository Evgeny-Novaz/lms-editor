import test from 'node:test';
import assert from 'node:assert/strict';
import {quizHtml,caseHtml,pendingLocalRemarks,remarkMaterial,isLegacyAutoQuiz} from './lesson-remarks.mjs';

test('generated self-check has one question, one radio group and a valid correct answer',()=>{
 for(const course of ['python','math','data','economics','design']){
  const material=remarkMaterial(course,'Тема урока'),html=quizHtml('lesson-quiz',material);
  assert.equal((html.match(/<legend>/g)||[]).length,1);
  assert.equal((html.match(/type="radio"/g)||[]).length,3);
  assert.equal(new Set([...html.matchAll(/name="([^"]+)"/g)].map(m=>m[1])).size,1);
  assert.ok(material.answer>=0&&material.answer<material.options.length);
  assert.ok(html.includes('data-quiz-check'));
  assert.ok(!html.includes(' checked'));
 }
});
test('generated additions escape markup from lesson names and text',()=>{
 const material=remarkMaterial('design','<img src=x onerror=alert(1)>');
 assert.ok(!caseHtml('test',material.replacement).includes('<img'));
 const html=quizHtml('test', {...material,question:'<script>alert(1)</script>',options:['<img src=x>','A & B','"answer"']});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
 assert.ok(html.includes('A &amp; B'));
});
test('resolved and dismissed local remarks do not contribute to the badge count',()=>{
 assert.deepEqual(pendingLocalRemarks([{id:'a',status:'open'},{id:'b',status:'resolved'},{id:'c',status:'dismissed'}]).map(r=>r.id),['a']);
 assert.deepEqual(pendingLocalRemarks(undefined),[]);
});

test('migration only reopens previously automatic quizzes, preserving explicitly approved additions',()=>{
 assert.equal(isLegacyAutoQuiz({kind:'quiz',status:'resolved'}),true);
 assert.equal(isLegacyAutoQuiz({kind:'quiz',status:'resolved',quizApprovalVersion:2}),false);
 assert.equal(isLegacyAutoQuiz({kind:'quiz',status:'open'}),false);
 assert.equal(isLegacyAutoQuiz({kind:'example',status:'resolved'}),false);
});
