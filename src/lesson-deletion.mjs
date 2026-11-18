export function deleteCourseLesson(course,lessonId){
 if(!course.topics.some(t=>t.lessons.some(l=>l.id===lessonId)))return course;
 return {...course,deletedLessonIds:[...new Set([...(course.deletedLessonIds||[]),lessonId])],topics:course.topics.map(t=>({...t,lessons:t.lessons.filter(l=>l.id!==lessonId)}))};
}
export function restoreCourseLesson(course,{lesson,topicId,index}){
 if(!course.topics.some(t=>t.id===topicId))return course;
 const exists=course.topics.some(t=>t.lessons.some(l=>l.id===lesson.id));
 return {...course,deletedLessonIds:(course.deletedLessonIds||[]).filter(id=>id!==lesson.id),topics:course.topics.map(t=>{
  if(t.id!==topicId||exists)return t;
  const lessons=[...t.lessons];lessons.splice(Math.min(index,lessons.length),0,lesson);return {...t,lessons};
 })};
}
