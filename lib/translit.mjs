// Транслитерация латиницы в кириллицу: последовательный разбор (без багов с заменами).
const DIGRAPHS = [
  ['shch', 'щ'], ['sch', 'ш'], ['tch', 'ч'], ['ew', 'ью'], ['ch', 'ч'], ['sh', 'ш'], ['zh', 'ж'], ['th', 'т'],
  ['ph', 'ф'], ['kh', 'х'], ['ck', 'к'], ['oo', 'у'], ['ee', 'и'], ['ea', 'и'], ['ou', 'у'],
  ['qu', 'к'], ['ll', 'ль'], ['ñ', 'нь'], ['gue', 'ге'], ['gui', 'ги'], ['ge', 'хе'], ['gi', 'хи'],
  ['ce', 'се'], ['ci', 'си'], ['ja', 'ха'], ['jo', 'хо'], ['ju', 'ху']
];
const SINGLE = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'х', k: 'к', l: 'л',
  m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс',
  y: 'и', z: 'с', 'á': 'а', 'é': 'е', 'í': 'и', 'ó': 'о', 'ú': 'у', 'ü': 'у', 'à': 'а', 'è': 'е',
  'ì': 'и', 'ò': 'о', 'ù': 'у', 'ç': 'с', 'ã': 'а', 'õ': 'о', 'â': 'а', 'ê': 'е', 'ô': 'о',
  'ä': 'а', 'ö': 'о', 'å': 'а', 'ø': 'о', 'æ': 'э', 'ł': 'л', 'ś': 'с', 'ż': 'ж', 'ź': 'з',
  'č': 'ч', 'š': 'ш', 'ž': 'ж', 'đ': 'д', 'ć': 'ч', 'ń': 'н'
};
const SMALL = new Set(['de', 'da', 'del', 'la', 'le', 'di', 'do', 'dos', 'das', 'y', 'e', 'el', 'al', 'and', 'of', 'the', 'van', 'von']);

export function translit(input) {
  const src = String(input || '').toLowerCase().replace(/[.'’`]/g, '');
  let out = '';
  for (let i = 0; i < src.length;) {
    let matched = false;
    for (const [lat, cyr] of DIGRAPHS) {
      if (src.startsWith(lat, i)) { out += cyr; i += lat.length; matched = true; break; }
    }
    if (matched) continue;
    const ch = src[i];
    if (SINGLE[ch]) out += SINGLE[ch];
    else if (/[a-z0-9а-яё]/.test(ch)) out += ch;
    else if (ch === ' ' || ch === '-') out += ch;
    i++;
  }
  return out.split(/\s+/).filter(Boolean).map((w, idx) => {
    const base = w.replace(/й$/, 'й');
    if (idx > 0 && SMALL.has(w)) return base;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }).join(' ');
}

export function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/[а-яё]/g, ch => ({ 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' }[ch] || ch))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
