'use strict';
// 「IIFE 가 사라진 index.html」 모의본을 만든다(작업자 측정용, 판정 아님). finalize 를 흉내 낸 것이 아니라 도구·시험의 반응을 보려는 것이다:
//   index.html 에서 큰 인라인 IIFE 블록(`<script>` ~ `</script>`)을 통째로 지우고, 그 글자를 한 글자도 바꾸지 않은 채 js/app/boot.js 에 담아 앞 태그 줄 끝에 동기 script 태그로 단다.
//   그래서 이 모의본은 앱이 그대로 뜬다(같은 글자가 같은 자리에서 같은 순서로 돈다). 달라지는 것은 「index.html 안에 그 글자가 없다」는 것 하나다.
// 사용: node make-empty-mock.cjs <모의 작업 폴더> <out.json>
const fs = require('fs'), path = require('path');
const [DIR, OUT] = process.argv.slice(2);
const f = path.join(DIR, 'index.html'), raw = fs.readFileSync(f, 'utf8'), eol = raw.includes('\r\n') ? '\r\n' : '\n';
const ls = raw.split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; }
for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
if (s < 0 || e < 0 || !/<script src="[^"]+"><\/script>$/.test(ls[s - 1])) throw new Error('IIFE 블록이나 앞 태그 줄을 찾지 못했다');
const body = ls.slice(s + 1, e);
fs.mkdirSync(path.join(DIR, 'js', 'app'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'js', 'app', 'boot.js'), body.join('\n') + '\n', { encoding: 'utf8' });
const nh = ls.slice(0, s - 1).concat([ls[s - 1] + '<script src="js/app/boot.js"></script>'], ls.slice(e + 1));
fs.writeFileSync(f, nh.join(eol), { encoding: 'utf8' });
const out = { type: '작업자 측정, 판정 아님', scriptHtmlLines: [s + 1, e + 1], movedLines: body.length, htmlLines: [ls.length, nh.length], bootFile: 'js/app/boot.js(IIFE 글자 그대로 — 모의용)', inlineScriptBlocksLeft: nh.filter(l => l.trim() === '<script>').length };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify(out));
