import content from './data/macro-verbatim.json' with {type:'json'};
import {formatMacroLesson} from './macro-format.mjs';
export const html=formatMacroLesson(content.html);
