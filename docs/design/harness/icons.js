'use strict';
/* 이모지 전용 요소(아이콘 역할) → 선(stroke) SVG 아이콘, 접두 이모지 결합('🎯 ' +) 제거 */
const fs = require('fs');
const F = 'C:/dev/ourgoal-app/index.html';
let s = fs.readFileSync(F, 'utf8');
const st = {}; const b = (k) => (st[k] = (st[k] || 0) + 1);
const svg = (paths, extra) => '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + paths + '</svg>';
const ICON = {
  '🎯': svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  '📅': svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/>'),
  '🗓️': svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/>'),
  '📆': svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/>'),
  '👑': svg('<path d="M3 18h18"/><path d="m4 8 4 5 4-7 4 7 4-5-1 10H5z"/>'),
  '📷': svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  '✏️': svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  '📝': svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  '✎': svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  '🤖': svg('<path d="M12 3v3"/><rect x="4" y="7" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M2 12h2M20 12h2"/>'),
  '🎁': svg('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8"/><path d="M12 8v12"/><path d="M12 8c-2-3-6-3-6-1s3 1 6 1c3 0 6 1 6-1s-4-2-6 1z"/>'),
  '📣': svg('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/>'),
  '🎭': svg('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>'),
  '⚡': svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  '⏱️': svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/>'),
  '🔥': svg('<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 11 0 4 3 7 7 7z"/>'),
  '🛍️': svg('<path d="M6 7h12l1 14H5z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>'),
  '🖼️': svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>'),
  '🧠': svg('<path d="M12 3a4 4 0 0 0-4 4v1a4 4 0 0 0-3 4 4 4 0 0 0 3 4v1a4 4 0 0 0 8 0v-1a4 4 0 0 0 3-4 4 4 0 0 0-3-4V7a4 4 0 0 0-4-4z"/>'),
  '🔍': svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  '🔒': svg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  '👥': svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  '💎': svg('<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/>'),
  '📈': svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
  '📋': svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M9 11h6M9 15h6"/>'),
  '🗣️': svg('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/>'),
  '🎙️': svg('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/>'),
  '💬': svg('<path d="M4 5h16v10H8l-4 4V5z"/>'),
  '✨': svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>'),
  '✅': svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
  '✓': svg('<path d="m5 12 5 5 9-10"/>'),
  '❌': svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  '×': null,
  '📍': svg('<path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
  '💡': svg('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'),
  '🚀': svg('<path d="M5 14 3 21l7-2"/><path d="M14 4c3-1 6 0 6 0s1 3 0 6c-1 3-8 9-8 9l-3-3s6-7 5-12z"/><circle cx="15" cy="9" r="1.5"/>'),
  '⬇': svg('<path d="M12 3v14"/><path d="m6 11 6 6 6-6"/>'),
  '📥': svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  '📤': svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>'),
  '🔄': svg('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>'),
  '🏆': svg('<path d="M8 21h8"/><path d="M12 17v4"/><path d="M6 3h12v6a6 6 0 0 1-12 0z"/><path d="M6 5H3v2a4 4 0 0 0 3 4"/><path d="M18 5h3v2a4 4 0 0 1-3 4"/>'),
  '🏠': svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/>'),
  '📊': svg('<path d="M4 19V10"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/>'),
  '⭐': svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>'),
  '🔔': svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  '📶': svg('<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M2 9a14 14 0 0 1 20 0"/>'),
  '🌐': svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  '📖': svg('<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>'),
  '🗑️': svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>'),
  '💪': svg('<path d="M6 21v-5a6 6 0 0 1 6-6h1a4 4 0 0 0 4-4V3"/><path d="M2 16h4"/><path d="M17 3h3v4"/>'),
  '🏃': svg('<circle cx="15" cy="4" r="1.8"/><path d="m5 21 4-6 3 2 2-5-3-2-4 3"/><path d="m13 12 3 2 2 7"/><path d="M11 9l4-2 3 3 3-1"/>'),
  '📚': svg('<path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/><path d="M4 19a2 2 0 0 0 2 2h14"/><path d="M8 3v18"/>'),
  '🧘': svg('<circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="m5 17 7-4 7 4"/><path d="M4 20h16"/>'),
  '💧': svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  '🌙': svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  '💻': svg('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M2 20h20"/>'),
  '💼': svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>'),
  '🎨': svg('<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="10" r="1.2" fill="currentColor"/><path d="M12 21a3 3 0 0 0 0-6h-1a2 2 0 0 1-1-3"/>'),
  '🔗': svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  '🏁': svg('<path d="M4 22V3"/><path d="M4 4h14l-2 4 2 4H4"/>'),
  '🗒️': svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  '📌': svg('<path d="M12 17v5"/><path d="M8 3h8l-1 6 3 4H6l3-4z"/>'),
  '💌': svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  '🕒': svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>'),
  '📱': svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
};
const EMO = /^\s*(\p{Extended_Pictographic}(?:\ufe0f|\u200d\p{Extended_Pictographic})*|[✓×✎⬇])\s*$/u;
// 1) 이모지 전용 요소 콘텐츠 → SVG
s = s.replace(/(<(span|div|b|i|button|em|strong)\b[^>]*>)([^<>]{1,6})(<\/\2>)/gu, (m, open, tag, inner, close) => {
  const t = inner.match(EMO); if (!t) return m;
  const key = t[1].replace(/\ufe0f/g, '');
  const icon = ICON[t[1]] || ICON[key] || ICON[key + '\ufe0f'];
  if (icon === undefined) { b('unmapped:' + key); return m; }
  if (icon === null) return m;
  b('icon');
  return open + icon + close;
});
// 2) 접두 이모지 결합 '🎯 ' + → '' +
s = s.replace(/'(\p{Extended_Pictographic}(?:\ufe0f|\u200d\p{Extended_Pictographic})*) '(\s*\+)/gu, (m, e, plus) => { b('prefix'); return "''" + plus; });
fs.writeFileSync(F, s, 'utf8');
console.log(JSON.stringify(st));
