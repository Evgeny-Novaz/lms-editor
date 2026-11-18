import test from 'node:test';
import assert from 'node:assert/strict';
import {getCourseWithPreview} from './course-order.mjs';

test('home page and unknown course routes work without a course or drag preview',()=>{
  assert.equal(getCourseWithPreview(undefined,null),undefined);
  assert.equal(getCourseWithPreview(undefined,undefined),undefined);
  assert.equal(getCourseWithPreview(undefined,{courseId:'python',topics:[]}),undefined);
});
test('a drag preview is applied only to its own selected course',()=>{
  const course={id:'python',title:'Python',topics:[{id:'a'}]};
  assert.equal(getCourseWithPreview(course,null),course);
  assert.equal(getCourseWithPreview(course,{courseId:'other',topics:[]}),course);
  const preview={courseId:'python',topics:[{id:'b'}]};
  assert.deepEqual(getCourseWithPreview(course,preview).topics,[{id:'b'}]);
  assert.deepEqual(course.topics,[{id:'a'}]);
});
