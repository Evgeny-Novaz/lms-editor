// Add bundled content to an older browser cache without replacing local edits
// or duplicating lessons that the editor has moved into a different topic.
export function mergeBundledCourses(stored,bundled){
  if(!Array.isArray(stored))return structuredClone(bundled);
  const next=structuredClone(stored);
  for(const course of bundled){
    const current=next.find(c=>c.id===course.id);
    if(!current){next.push(structuredClone(course));continue}
    current.topics??=[];
    if(course.removedLessonIds?.length){
      for(const topic of current.topics)topic.lessons=topic.lessons.filter(l=>!course.removedLessonIds.includes(l.id));
    }
    // Apply the published example once, retaining subsequent editor status changes.
    if((course.publicationExampleVersion??0)>(current.publicationExampleVersion??0)){
      for(const topic of current.topics)for(const lesson of topic.lessons)lesson.status='Опубликован';
      current.publicationExampleVersion=course.publicationExampleVersion;
    }
    const present=new Set(current.topics.flatMap(t=>t.lessons.map(l=>l.id)));
    for(const topic of course.topics){
      let dest=current.topics.find(t=>t.id===topic.id);
      if(!dest){dest={...structuredClone(topic),lessons:[]};current.topics.push(dest)}
      for(const lesson of topic.lessons){if(!present.has(lesson.id)&&!current.deletedLessonIds?.includes(lesson.id)){dest.lessons.push(structuredClone(lesson));present.add(lesson.id)}}
    }
  }
  return next;
}
export function mergeBundledDocuments(stored,bundled){
  return {...bundled,...(stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{})};
}
