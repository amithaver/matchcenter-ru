// Щит команды: свой SVG без чужих логотипов.
function hash(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function teamShield(name, size = 26) {
  const hue = hash(name);
  const fill = `hsl(${hue} 46% 26%)`;
  const stroke = `hsl(${hue} 60% 52%)`;
  const text = `hsl(${hue} 70% 88%)`;
  const initials = String(name || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
  const fs = size <= 22 ? 8 : size <= 30 ? 9 : 10;
  return `<svg class="shield" viewBox="0 0 32 36" width="${size}" height="${Math.round(size * 1.125)}" aria-hidden="true" focusable="false">
    <path d="M16 1.5 L29 6.5 V18.5 C29 26.5 23.5 31.5 16 34.5 C8.5 31.5 3 26.5 3 18.5 V6.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>
    <text x="16" y="21" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="${fs}" font-weight="700" fill="${text}" letter-spacing=".4">${initials}</text>
  </svg>`;
}
