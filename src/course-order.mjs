// Return new topic arrays while keeping lesson records and IDs intact.
export function reorderTopics(topics, id, targetId, edge='before') {
  if(id===targetId || !topics.some(t=>t.id===id) || !topics.some(t=>t.id===targetId)) return topics;
  const item=topics.find(t=>t.id===id), next=topics.filter(t=>t.id!==id);
  const at=next.findIndex(t=>t.id===targetId)+(edge==='after'?1:0);
  next.splice(at,0,item);return next;
}
export function moveLesson(topics, id, destinationId, targetId=null, edge='before') {
  const source=topics.find(t=>t.lessons.some(l=>l.id===id));
  const destination=topics.find(t=>t.id===destinationId);
  if(!source||!destination||targetId===id) return topics;
  if(targetId&&!destination.lessons.some(l=>l.id===targetId)) return topics;
  const item=source.lessons.find(l=>l.id===id);
  const next=topics.map(t=>({...t,lessons:t.lessons.filter(l=>l.id!==id)}));
  const dest=next.find(t=>t.id===destinationId);
  const at=targetId?dest.lessons.findIndex(l=>l.id===targetId)+(edge==='after'?1:0):dest.lessons.length;
  dest.lessons.splice(at,0,item);return next;
}

// Home and unknown routes have no selected course. A missing preview must
// never be treated as matching a missing course just because both IDs are undefined.
export function getCourseWithPreview(course,preview){
  if(!course||!preview||preview.courseId!==course.id)return course;
  return {...course,topics:preview.topics};
}
