const PptxGenJS = require('pptxgenjs');
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9';
pres.author = '10 класс';
pres.company = 'Обществознание';
pres.title = 'Может ли виртуальный тур заменить музей? Печа-куча 20x20';
pres.subject = 'Обществознание 10 класс';

const C = {
  navy: '1B1B3A',
  navy2: '252550',
  red: 'E94E3C',
  yellow: 'F2B705',
  teal: '178F7F',
  light: 'F2F0FF',
  card: 'FFFFFF',
  gray: '6B6B8A',
  dark: '1B1B3A',
  ink: '232347'
};

function footer(slide, n) {
  slide.addText('Обществознание • 10 класс', { x: 0.5, y: 5.05, w: 3, h: 0.3, fontSize: 9, color: C.gray, fontFace: 'Arial', margin: 0 });
  slide.addText(String(n).padStart(2,'0') + ' / 20', { x: 8.7, y: 5.05, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: C.ink, fontFace: 'Arial', align: 'right', margin: 0 });
  slide.addShape('ROUNDED_RECTANGLE', { x: 0.5, y: 5.35, w: 9.0, h: 0.07, fill: { color: 'E3E1F5' }, line: { color: 'E3E1F5' }, rectRadius: 0.03 });
  slide.addShape('ROUNDED_RECTANGLE', { x: 0.5, y: 5.35, w: 9.0 * n / 20, h: 0.07, fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.03 });
}

function photoCard(slide, imgPath, kicker, kickerColor, title, sub) {
  slide.addImage({ path: imgPath, x: 0, y: 0, w: 10, h: 5.625 });
  slide.addShape('RECTANGLE', { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy, transparency: 72 }, line: { color: C.navy, transparency: 100 } });
  slide.addShape('ROUNDED_RECTANGLE', { x: 0.5, y: 3.15, w: 5.6, h: 1.7, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' }, rectRadius: 0.18, shadow: { type: 'outer', color: '000000', opacity: 0.25, blur: 18, offset: 4, angle: 90 } });
  slide.addText(kicker, { x: 0.85, y: 3.3, w: 4.9, h: 0.3, fontSize: 11, bold: true, color: kickerColor, fontFace: 'Arial', margin: 0 });
  slide.addText(title, { x: 0.85, y: 3.58, w: 4.9, h: 0.75, fontSize: 26, bold: true, color: C.ink, fontFace: 'Arial', margin: 0, valign: 'top' });
  slide.addText(sub, { x: 0.85, y: 4.28, w: 4.9, h: 0.4, fontSize: 12, color: C.gray, fontFace: 'Arial', margin: 0, valign: 'top' });
}

function splitSlide(slide, imgPath, kicker, kickerColor, title, desc, accentBg) {
  slide.background = { color: 'FFFFFF' };
  slide.addImage({ path: imgPath, x: 0.4, y: 0.4, w: 4.4, h: 4.4, rounding: 0.25 });
  slide.addShape('ROUNDED_RECTANGLE', { x: 5.2, y: 0.4, w: 4.4, h: 4.4, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.25 });
  slide.addShape('ELLIPSE', { x: 5.6, y: 0.85, w: 0.55, h: 0.55, fill: { color: accentBg }, line: { color: accentBg } });
  slide.addText(kicker.slice(0,2), { x: 5.6, y: 0.87, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', valign: 'middle', margin: 0 });
  slide.addText(kicker, { x: 6.3, y: 0.85, w: 3.4, h: 0.55, fontSize: 11, bold: true, color: accentBg, fontFace: 'Arial', margin: 0, valign: 'middle' });
  slide.addText(title, { x: 5.6, y: 1.55, w: 3.7, h: 1.3, fontSize: 28, bold: true, color: C.ink, fontFace: 'Arial', margin: 0, valign: 'top' });
  slide.addText(desc, { x: 5.6, y: 2.95, w: 3.7, h: 1.6, fontSize: 13, color: C.gray, fontFace: 'Arial', margin: 0, valign: 'top' });
}

function divider(slide, bg, bigNum, label, title) {
  slide.background = { color: bg };
  slide.addText(bigNum, { x: 0.6, y: 0.7, w: 2, h: 1.6, fontSize: 72, bold: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0, transparency: 18 });
  slide.addText(label, { x: 0.7, y: 2.15, w: 4, h: 0.4, fontSize: 12, bold: true, color: C.yellow, fontFace: 'Arial', margin: 0 });
  slide.addText(title, { x: 0.7, y: 2.5, w: 6.5, h: 1.6, fontSize: 40, bold: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0, valign: 'top' });
  slide.addText('печа-куча • один довод', { x: 0.7, y: 4.3, w: 4, h: 0.3, fontSize: 11, color: 'FFFFFF', fontFace: 'Arial', margin: 0, transparency: 35 });
  slide.addShape('ROUNDED_RECTANGLE', { x: 7.6, y: 1.3, w: 1.8, h: 2.9, fill: { color: 'FFFFFF', transparency: 88 }, line: { color: 'FFFFFF', transparency: 100 }, rectRadius: 0.25 });
  slide.addText('20', { x: 7.6, y: 1.55, w: 1.8, h: 1.0, fontSize: 54, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', margin: 0 });
  slide.addText('секунд\nна слайд', { x: 7.6, y: 2.6, w: 1.8, h: 0.8, fontSize: 12, color: 'FFFFFF', fontFace: 'Arial', align: 'center', margin: 0 });
  slide.addText('Обществознание • 10 класс', { x: 0.7, y: 5.05, w: 3, h: 0.3, fontSize: 9, color: 'FFFFFF', fontFace: 'Arial', margin: 0, transparency: 40 });
  slide.addText('XX / 20', { x: 8.7, y: 5.05, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'right', margin: 0, transparency: 30 });
}

// ---------- SLIDE 1 : титул ----------
let s1 = pres.addSlide();
s1.background = { color: C.navy };
s1.addImage({ path: 'assets_museum/img1.jpg', x: 5.4, y: 0, w: 4.6, h: 5.625 });
s1.addShape('RECTANGLE', { x: 5.4, y: 0, w: 4.6, h: 5.625, fill: { color: C.navy, transparency: 35 }, line: { color: C.navy, transparency: 100 } });
s1.addText('ОБЩЕСТВОЗНАНИЕ • 10 КЛАСС', { x: 0.6, y: 0.5, w: 4.2, h: 0.3, fontSize: 11, bold: true, color: C.red, fontFace: 'Arial', margin: 0 });
s1.addText('Может ли виртуальный тур заменить музей?', { x: 0.6, y: 0.9, w: 4.5, h: 2.2, fontSize: 38, bold: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0, valign: 'top' });
s1.addText('Виртуальные экскурсии на culture.ru. Плюсы и минусы цифровизации.', { x: 0.6, y: 3.05, w: 4.2, h: 0.7, fontSize: 13, color: 'C9C9E3', fontFace: 'Arial', margin: 0, valign: 'top' });
s1.addShape('ROUNDED_RECTANGLE', { x: 0.6, y: 3.9, w: 2.6, h: 0.65, fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.15 });
s1.addText('20 слайдов × 20 секунд', { x: 0.6, y: 3.92, w: 2.6, h: 0.65, fontSize: 12, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', valign: 'middle', margin: 0 });
s1.addText('культура • институт • цифровизация', { x: 0.6, y: 4.6, w: 4.2, h: 0.3, fontSize: 10, italic: true, color: '8E8EB0', fontFace: 'Arial', margin: 0 });
footer(s1, 1);
s1.addNotes('Здравствуйте! Три часа ночи, вы в пижаме гуляете по Зимнему дворцу. Фантастика? Нет, это culture.ru. Сегодня за 6 минут 40 секунд разберём: может ли виртуальный тур заменить настоящий музей? Моя главная мысль: тур открывает музей для всех, но не заменяет живой встречи.');

// ---------- SLIDE 2 : зацепка ----------
let s2 = pres.addSlide();
photoCard(s2, 'assets_museum/img2.jpg', 'ЗАЦЕПКА • ВОПРОС ЗАЛУ', C.red, 'Музей… не вставая с дивана?', 'А вы так уже были? Поднимите руку');
footer(s2, 2);
s2.addNotes('Поднимите руку, кто был в музее онлайн? А кто стоял в очереди в Эрмитаж? У меня оба опыта. Онлайн — удобно: диван, чай, никаких очередей. Но помните ли вы хоть одну онлайн-картину так же ярко, как настоящий зал? Давайте сравним.');

// ---------- SLIDE 3 ----------
let s3 = pres.addSlide();
splitSlide(s3, 'assets_museum/img3.jpg', '01 • ЧТО ТАКОЕ МУЗЕЙ', C.red, 'Память + эмоции общества', 'Музей — социальный институт. Хранит культуру, воспитывает, социализирует. Это не склад картин, а встреча с прошлым.', C.red);
footer(s3, 3);
s3.addNotes('По учебнику обществознания музей — институт культуры. Его функции: хранение наследия, просвещение, социализация. Мы идём туда не только за знаниями, но за эмоциями и идентичностью: кто мы и откуда.');

// ---------- SLIDE 4 ----------
let s4 = pres.addSlide();
splitSlide(s4, 'assets_museum/img4.jpg', '02 • ЧТО ТАКОЕ CULTURE.RU', C.teal, '200+ музеев в одном портале', 'Культура.РФ: 3D-туры, панорамы, аудиогиды. Эрмитаж, Русский музей, Михайловское. Бесплатно, без регистрации.', C.teal);
footer(s4, 4);
s4.addNotes('Портал Культура.РФ создал Минкульт по нацпроекту Культура. Раздел Виртуальные прогулки — более двухсот музеев: Эрмитаж, Русский музей, Кижи, Соловки, усадьба Пушкина. Всё бесплатно, не выходя из дома. Звучит идеально?');

// ---------- SLIDE 5 : divider довод 1 ----------
let s5 = pres.addSlide();
divider(s5, C.red, '01', 'ДОВОД 1 • ПРОБЛЕМА ДОСТУПА', 'Доступность для всех');
s5.addText('05 / 20', { x: 8.7, y: 5.05, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'right', margin: 0, transparency: 30 });
s5.addNotes('Первый довод — доступность. Это главный плюс цифровизации. Три слайда-доказательства: география, деньги и время.');

// ---------- SLIDE 6 ----------
let s6 = pres.addSlide();
photoCard(s6, 'assets_museum/img5.jpg', 'ДОСТУПНОСТЬ • ГЕОГРАФИЯ', C.teal, 'Камчатка — Эрмитаж за секунду', 'Не надо ехать за 9 000 км');
footer(s6, 6);
s6.addNotes('Живёшь в маленьком городе или на Камчатке? До Питера — девять тысяч километров и дорогие билеты. А виртуальный тур Эрмитажа открывается за секунду. Это снимает социальное неравенство в доступе к культуре.');

// ---------- SLIDE 7 ----------
let s7 = pres.addSlide();
photoCard(s7, 'assets_museum/img6.jpg', 'ДОСТУПНОСТЬ • БЕЗ ОЧЕРЕДЕЙ', C.teal, 'Без билета. Без толпы', 'Тишина вместо часа в очереди');
footer(s7, 7);
s7.addNotes('Вспомните очереди в Третьяковку на Серова или Айвазовского — по три часа на морозе. Онлайн нет кассы, нет толпы у шедевра. Можно спокойно рассмотреть часы Павлин или Джоконду крупным планом.');

// ---------- SLIDE 8 ----------
let s8 = pres.addSlide();
photoCard(s8, 'assets_museum/img7.jpg', 'ДОСТУПНОСТЬ • ВРЕМЯ', C.teal, 'Музей открыт 24/7', 'Хоть в три часа ночи');
footer(s8, 8);
s8.addNotes('Реальный музей работает с десяти до шести, понедельник — выходной. Виртуальный не закрывается никогда. Ночью перед сочинением можно зайти в Русский музей и проверить даты и детали картины. Удобно, правда?');

// ---------- SLIDE 9 : stat ----------
let s9 = pres.addSlide();
s9.background = { color: 'FFFFFF' };
s9.addShape('ROUNDED_RECTANGLE', { x: 0.4, y: 0.4, w: 5.4, h: 4.4, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.25 });
s9.addText('6 500', { x: 0.8, y: 0.9, w: 4.6, h: 1.4, fontSize: 72, bold: true, color: C.red, fontFace: 'Arial', margin: 0 });
s9.addText('шедевров Третьяковки уже онлайн', { x: 0.8, y: 2.25, w: 4.6, h: 0.5, fontSize: 18, bold: true, color: C.ink, fontFace: 'Arial', margin: 0 });
s9.addText('проект «Моя Третьяковка» • бесплатно • с аннотациями', { x: 0.8, y: 2.85, w: 4.6, h: 0.6, fontSize: 12, color: C.gray, fontFace: 'Arial', margin: 0 });
s9.addText('ИТОГ ДОВОДА 1: цифра побеждает расстояние', { x: 0.8, y: 3.7, w: 4.6, h: 0.4, fontSize: 11, bold: true, color: C.teal, fontFace: 'Arial', margin: 0 });
s9.addImage({ path: 'assets_museum/img16.jpg', x: 6.1, y: 0.4, w: 3.5, h: 4.4, rounding: 0.25 });
footer(s9, 9);
s9.addNotes('Итог первого довода в цифре: только в проекте Моя Третьяковка — почти шесть тысяч пятьсот произведений с аннотациями. Плюс сотни панорам на Культура.РФ. Вывод: доступность выросла в разы. Но всё ли решает доступ?');

// ---------- SLIDE 10 : divider довод 2 ----------
let s10 = pres.addSlide();
divider(s10, C.navy, '02', 'ДОВОД 2 • ЦЕНА ЦИФРЫ', 'Живой опыт не копируется');
s10.addText('10 / 20', { x: 8.7, y: 5.05, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'right', margin: 0, transparency: 30 });
s10.addNotes('Второй довод — против замены. Минусы цифровизации. Три примера того, что экран отнимает: подлинность, масштаб и общение.');

// ---------- SLIDE 11 ----------
let s11 = pres.addSlide();
photoCard(s11, 'assets_museum/img8.jpg', 'МИНУС • ПОДЛИННОСТЬ', C.yellow, 'Аура оригинала теряется', 'Мазок и трещинки — только вживую');
footer(s11, 11);
s11.addNotes('Философ Вальтер Беньямин писал об ауре подлинника. На экране вы видите пиксели, а не мазки Леонардо, не кракелюр, не запах старого зала. Перед настоящей картиной люди молчат. Перед монитором — скроллят дальше.');

// ---------- SLIDE 12 ----------
let s12 = pres.addSlide();
photoCard(s12, 'assets_museum/img17.jpg', 'МИНУС • МАСШТАБ', C.yellow, 'Размер имеет значение', 'Двухметровое полотно — не смартфон');
footer(s12, 12);
s12.addNotes('Явление Христа народу — пять на семь метров. На фото — просто картинка. В зале она накрывает вас. Скульптуру нужно обойти, свет меняется, шаги гулко звучат. Виртуальный тур даёт обзор, но не даёт тела в пространстве.');

// ---------- SLIDE 13 ----------
let s13 = pres.addSlide();
photoCard(s13, 'assets_museum/img9.jpg', 'МИНУС • ОБЩЕНИЕ', C.yellow, 'Экскурсовод слышит тебя', 'Вопрос, шутка, пауза — живой диалог');
footer(s13, 13);
s13.addNotes('Хороший экскурсовод видит глаза группы, меняет темп, отвечает на глупый вопрос так, что все смеются и запоминают. Аудиогид на портале так не умеет. Социализация — это люди рядом, а не чат. Школа в музее — это тоже общение.');

// ---------- SLIDE 14 ----------
let s14 = pres.addSlide();
s14.background = { color: C.navy };
s14.addImage({ path: 'assets_museum/img10.jpg', x: 0.4, y: 0.4, w: 4.6, h: 4.4, rounding: 0.25 });
s14.addShape('ROUNDED_RECTANGLE', { x: 5.4, y: 0.4, w: 4.2, h: 4.4, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' }, rectRadius: 0.25 });
s14.addText('ИТОГ ДОВОДА 2', { x: 5.8, y: 0.85, w: 3.4, h: 0.3, fontSize: 11, bold: true, color: C.red, fontFace: 'Arial', margin: 0 });
s14.addText('Экран не передаёт мурашки', { x: 5.8, y: 1.15, w: 3.4, h: 1.0, fontSize: 26, bold: true, color: C.ink, fontFace: 'Arial', margin: 0, valign: 'top' });
s14.addText('запах дерева • гул шагов • холод мрамора • это и есть музей', { x: 5.8, y: 2.2, w: 3.4, h: 0.8, fontSize: 12, color: C.gray, fontFace: 'Arial', margin: 0 });
s14.addShape('ROUNDED_RECTANGLE', { x: 5.8, y: 3.3, w: 3.4, h: 0.9, fill: { color: C.light }, line: { color: C.light }, rectRadius: 0.15 });
s14.addText('массовая культура упрощает. элитарная — требует присутствия', { x: 6.0, y: 3.4, w: 3.0, h: 0.7, fontSize: 11, italic: true, color: C.ink, fontFace: 'Arial', margin: 0, valign: 'middle' });
footer(s14, 14);
s14.addNotes('Итог: виртуальность превращает искусство в контент. Удобно, но теряется главное — телесный и эмоциональный опыт. Поэтому цифра пока проигрывает залу. Но есть третий путь — союз.');

// ---------- SLIDE 15 : divider довод 3 ----------
let s15 = pres.addSlide();
divider(s15, C.teal, '03', 'ДОВОД 3 • ВЫХОД', 'Союз, а не замена');
s15.addText('15 / 20', { x: 8.7, y: 5.05, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'right', margin: 0, transparency: 30 });
s15.addNotes('Третий довод — синтез. Как цифра помогает реальному музею, а не убивает его. Три примера умного гибрида.');

// ---------- SLIDE 16 ----------
let s16 = pres.addSlide();
splitSlide(s16, 'assets_museum/img11.jpg', '03 • ПОДГОТОВКА', '178F7F', 'Сначала онлайн — потом в зал', 'Урок: изучить тур дома, в музее — искать детали. Флип-класс работает.', '178F7F');
footer(s16, 16);
s16.addNotes('Учителя уже используют туры для подготовки: дома проходим залы Эрмитажа, в музее выполняем квест. Это называется смешанное обучение. Онлайн снимает страх не понять, офлайн дарит открытие.');

// ---------- SLIDE 17 ----------
let s17 = pres.addSlide();
photoCard(s17, 'assets_museum/img12.jpg', 'СУПЕРСИЛА ЦИФРЫ • ДЕТАЛИ', C.red, 'Рассмотри то, что под стеклом', 'Макро, рентген, 3D — видит больше глаза');
footer(s17, 17);
s17.addNotes('У цифры есть суперсила: макро-съёмка мазка, рентген картины, 3D-модель саркофага, которую можно крутить. В зале так нельзя — стекло и охрана. Google Arts и Культура.РФ показывают изнанку шедевра.');

// ---------- SLIDE 18 ----------
let s18 = pres.addSlide();
photoCard(s18, 'assets_museum/img13.jpg', 'ВКЛЮЧЕНИЕ • ДЛЯ ВСЕХ', C.teal, 'Музей без лестниц и расстояний', 'Люди с ОВЗ, сёла, болеющие — в зале');
footer(s18, 18);
s18.addNotes('А ещё инклюзия. Для человека на коляске, для бабушки из села, для болеющего ребёнка виртуальный тур — единственный шанс. Это уже не комфорт, а право на культуру. Социальное государство должно это поддерживать.');

// ---------- SLIDE 19 : вывод ----------
let s19 = pres.addSlide();
s19.background = { color: 'FFFFFF' };
s19.addShape('ROUNDED_RECTANGLE', { x: 0.4, y: 0.4, w: 9.2, h: 4.4, fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.25 });
s19.addText('ВЫВОД • МОЯ ПОЗИЦИЯ', { x: 0.9, y: 0.85, w: 4, h: 0.3, fontSize: 11, bold: true, color: C.yellow, fontFace: 'Arial', margin: 0 });
s19.addText('Гибрид — будущее музеев', { x: 0.9, y: 1.15, w: 4.5, h: 1.0, fontSize: 30, bold: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0 });
s19.addText('1. цифра открывает • 2. зал впечатляет • 3. вместе — сильнее', { x: 0.9, y: 2.15, w: 4.5, h: 0.6, fontSize: 13, color: 'C9C9E3', fontFace: 'Arial', margin: 0 });
s19.addShape('ROUNDED_RECTANGLE', { x: 0.9, y: 2.95, w: 4.2, h: 1.35, fill: { color: 'FFFFFF', transparency: 92 }, line: { color: 'FFFFFF', transparency: 100 }, rectRadius: 0.18 });
s19.addText('тур не заменяет, а приводит в музей: посмотрел онлайн — захотел вживую', { x: 1.15, y: 3.1, w: 3.7, h: 1.0, fontSize: 12, italic: true, color: 'FFFFFF', fontFace: 'Arial', margin: 0, valign: 'middle' });
s19.addImage({ path: 'assets_museum/img14.jpg', x: 6.0, y: 0.85, w: 3.2, h: 3.5, rounding: 0.2 });
footer(s19, 19);
s19.addNotes('Вывод: ответ — нет, не заменит, и это хорошо. Виртуальный тур — витрина и помощник, а музей — встреча. Статистика это подтверждает: после онлайн-выставок реальные визиты растут. Цифровизация расширяет, а не отменяет.');

// ---------- SLIDE 20 : финал ----------
let s20 = pres.addSlide();
s20.background = { color: C.navy };
s20.addImage({ path: 'assets_museum/img15.jpg', x: 0, y: 0, w: 10, h: 5.625 });
s20.addShape('RECTANGLE', { x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy, transparency: 55 }, line: { color: C.navy, transparency: 100 } });
s20.addText('А куда пойдёшь ты?', { x: 0.6, y: 1.1, w: 8.8, h: 1.2, fontSize: 52, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', margin: 0 });
s20.addText('онлайн сегодня вечером — в зал в выходные?', { x: 0.6, y: 2.3, w: 8.8, h: 0.5, fontSize: 16, color: C.yellow, fontFace: 'Arial', align: 'center', margin: 0 });
s20.addShape('ROUNDED_RECTANGLE', { x: 3.6, y: 3.1, w: 2.8, h: 0.65, fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.15 });
s20.addText('culture.ru • Виртуальные прогулки', { x: 3.6, y: 3.1, w: 2.8, h: 0.65, fontSize: 11, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', valign: 'middle', margin: 0 });
s20.addText('Источники: Культура.РФ — Виртуальные прогулки; Эрмитаж — virtual tour; Третьяковка — Моя Третьяковка (6500); Фото: Unsplash (см. заметки). Спасибо!', { x: 0.6, y: 4.35, w: 8.8, h: 0.4, fontSize: 8, color: 'C9C9E3', fontFace: 'Arial', align: 'center', margin: 0 });
s20.addText('Обществознание • 10 класс', { x: 0.5, y: 5.05, w: 3, h: 0.3, fontSize: 9, color: '8E8EB0', fontFace: 'Arial', margin: 0 });
s20.addText('20 / 20', { x: 8.7, y: 5.05, w: 0.8, h: 0.3, fontSize: 9, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'right', margin: 0 });
s20.addNotes('Финал: так куда пойдёте вы — онлайн сегодня или в зал в выходные? Я предлагаю оба пути: сегодня откройте culture.ru, а в субботу идите за мурашками. Спасибо! Готов ответить на вопросы. Источники изображений: Unsplash — все фото свободная лицензия; авторы указаны в файле README.');

pres.writeFile({ fileName: 'pecha-kucha-virtual-museum.pptx' }).then(() => console.log('saved 20 slides'));
