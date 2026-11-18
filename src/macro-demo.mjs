export const MACRO_DEMO_DELAY=30000;
// Any attached PDF triggers this prepared demonstration; its contents are not parsed.
export const isDemoPdf=file=>!!file&&(file.type==='application/pdf'||/\.pdf$/i.test(file.name||''));
export const macroSuggestions=[
  {title:'Добавить самопроверку',text:'После разделов о сбережениях и инвестициях добавить вопросы на различие потребительских и инвестиционных расходов и задание на расчёт сбережений.'},
  {title:'Дополнить две модели',text:'В PDF трёх- и четырёхсекторная модели названы в плане и итогах, но подробных разделов нет. Добавить объяснения и схемы с государством и иностранным сектором.'},
  {title:'Проверить данные и формулировки',text:'Добавить источники к примерам о Китае, Кубе и Великой депрессии. Уточнить роль трансфертов в кругообороте и их отличие от государственных закупок.'}
];
export {html as macroLessonHtml} from './macro-verbatim.mjs';
