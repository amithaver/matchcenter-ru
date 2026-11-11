// Проставляет страну лигам и командам по названию турнира.
import fs from 'node:fs';
const FILE = 'data/store.json';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const MAP = [
  [/english|england|efl|fa cup|community shield/i, 'Англия', 'england'],
  [/spanish|spain|la liga|copa del rey|supercopa/i, 'Испания', 'spain'],
  [/italian|italy|serie a|coppa italia/i, 'Италия', 'italy'],
  [/german|germany|bundesliga|dfb|pokal/i, 'Германия', 'germany'],
  [/french|france|ligue 1|coupe de france/i, 'Франция', 'france'],
  [/dutch|netherlands|eredivisie/i, 'Нидерланды', 'netherlands'],
  [/portuguese|portugal|primeira liga/i, 'Португалия', 'portugal'],
  [/brazil|brasileir/i, 'Бразилия', 'brazil'],
  [/argentin/i, 'Аргентина', 'argentina'],
  [/mexic|liga mx/i, 'Мексика', 'mexico'],
  [/colombi/i, 'Колумбия', 'colombia'],
  [/chile|chilena/i, 'Чили', 'chile'],
  [/uruguay|auf/i, 'Уругвай', 'uruguay'],
  [/peru/i, 'Перу', 'peru'],
  [/ecuador|ligapro/i, 'Эквадор', 'ecuador'],
  [/venezuel/i, 'Венесуэла', 'venezuela'],
  [/paraguay/i, 'Парагвай', 'paraguay'],
  [/bolivia/i, 'Боливия', 'bolivia'],
  [/costa ric/i, 'Коста-Рика', 'costa-rica'],
  [/hondur/i, 'Гондурас', 'honduras'],
  [/salvador/i, 'Сальвадор', 'el-salvador'],
  [/guatemal/i, 'Гватемала', 'guatemala'],
  [/nicaragu/i, 'Никарагуа', 'nicaragua'],
  [/panam/i, 'Панама', 'panama'],
  [/cuba/i, 'Куба', 'cuba'],
  [/jamaic/i, 'Ямайка', 'jamaica'],
  [/trinidad/i, 'Тринидад и Тобаго', 'trinidad'],
  [/canad/i, 'Канада', 'canada'],
  [/major league soccer|mls|usl|united states|usa/i, 'США', 'usa'],
  [/chinese|china/i, 'Китай', 'china'],
  [/japan|j1|j2/i, 'Япония', 'japan'],
  [/korea/i, 'Южная Корея', 'korea'],
  [/australi|a-league/i, 'Австралия', 'australia'],
  [/saudi/i, 'Саудовская Аравия', 'saudi'],
  [/qatar/i, 'Катар', 'qatar'],
  [/emirat|uae/i, 'ОАЭ', 'uae'],
  [/egypt/i, 'Египет', 'egypt'],
  [/moroc/i, 'Марокко', 'morocco'],
  [/tunis/i, 'Тунис', 'tunisia'],
  [/algeria/i, 'Алжир', 'algeria'],
  [/south africa|psl/i, 'ЮАР', 'south-africa'],
  [/nigeria/i, 'Нигерия', 'nigeria'],
  [/ghana/i, 'Гана', 'ghana'],
  [/kenya/i, 'Кения', 'kenya'],
  [/turkish|turkey|super lig/i, 'Турция', 'turkey'],
  [/greek|greece|super league greece/i, 'Греция', 'greece'],
  [/russian|russia|premier league russia/i, 'Россия', 'russia'],
  [/ukrain/i, 'Украина', 'ukraine'],
  [/polish|poland|ekstraklasa/i, 'Польша', 'poland'],
  [/czech/i, 'Чехия', 'czechia'],
  [/slovak/i, 'Словакия', 'slovakia'],
  [/hungar/i, 'Венгрия', 'hungary'],
  [/romania/i, 'Румыния', 'romania'],
  [/bulgaria/i, 'Болгария', 'bulgaria'],
  [/serbia/i, 'Сербия', 'serbia'],
  [/croatia/i, 'Хорватия', 'croatia'],
  [/slovenia/i, 'Словения', 'slovenia'],
  [/bosnia/i, 'Босния и Герцеговина', 'bosnia'],
  [/austria/i, 'Австрия', 'austria'],
  [/swiss|switzerland/i, 'Швейцария', 'switzerland'],
  [/belgi/i, 'Бельгия', 'belgium'],
  [/denmark|danish/i, 'Дания', 'denmark'],
  [/sweden|swedish/i, 'Швеция', 'sweden'],
  [/norway|norwegian/i, 'Норвегия', 'norway'],
  [/finland|finnish/i, 'Финляндия', 'finland'],
  [/iceland/i, 'Исландия', 'iceland'],
  [/ireland|irish/i, 'Ирландия', 'ireland'],
  [/scotland|scottish/i, 'Шотландия', 'scotland'],
  [/wales|welsh/i, 'Уэльс', 'wales'],
  [/israel/i, 'Израиль', 'israel'],
  [/cyprus/i, 'Кипр', 'cyprus'],
  [/kazakh/i, 'Казахстан', 'kazakhstan'],
  [/uzbek/i, 'Узбекистан', 'uzbekistan'],
  [/india/i, 'Индия', 'india'],
  [/indonesia/i, 'Индонезия', 'indonesia'],
  [/thai/i, 'Таиланд', 'thailand'],
  [/vietnam/i, 'Вьетнам', 'vietnam'],
  [/malaysia/i, 'Малайзия', 'malaysia'],
  [/singapore/i, 'Сингапур', 'singapore'],
  [/hong kong/i, 'Гонконг', 'hong-kong'],
  [/new zealand/i, 'Новая Зеландия', 'new-zealand'],
  [/uefa|champions league|europa|conference|nations/i, 'Европа', 'europe'],
  [/conmebol|copa libertadores|copa sudamericana/i, 'Южная Америка', 'south-america'],
  [/concacaf|leagues cup|campeones/i, 'Северная Америка', 'north-america'],
  [/afc|asian/i, 'Азия', 'asia'],
  [/caf|africa/i, 'Африка', 'africa'],
  [/fifa|world cup|friendly|olympic/i, 'Мир', 'world']
];

const bySlug = new Map(db.countries.map(c => [c.slug, c]));
const pick = name => MAP.find(([re]) => re.test(name || '')) || [null, 'Другое', 'other'];

let fixed = 0;
for (const l of db.leagues) {
  if (l.country) continue;
  const [, cname, cslug] = pick(`${l.name} ${l.slug}`);
  l.country = cslug;
  if (!bySlug.has(cslug)) {
    const c = { slug: cslug, name: cname, confed: '' };
    bySlug.set(cslug, c);
    db.countries.push(c);
  }
  fixed++;
}
for (const t of db.teams) {
  const l = db.leagues.find(x => x.slug === t.league);
  if (l) t.country = l.country;
}

db.countries.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
console.log(`лиг: ${db.leagues.length}, размечено: ${fixed}, стран: ${db.countries.length}`);
const top = [...db.leagues].reduce((acc, l) => (acc[l.country] = (acc[l.country] || 0) + 1, acc), {});
console.log('по странам:', Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}:${v}`).join(', '));
