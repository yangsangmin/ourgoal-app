// 측정 스크립트 고침: 꾸밈 파일의 주석을 걷고 정의를 찾는다, 대비가 "나빠짐"을 문턱을 넘은 것과 아닌 것으로 가른다
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, 'build-expected.js');
let s = fs.readFileSync(f, 'utf8');
const rep = (x, y) => { const n = s.split(x).length - 1; if (n !== 1) throw new Error((n ? '여러 곳: ' : '없음: ') + x.slice(0, 70)); s = s.split(x).join(y); };
rep("{ const stack = []; let buf = '', line = 1, selStart = 1;\n  for (let i = 0; i < css.length; i++) { const ch = css[i];", "{ const stack = []; let buf = '', line = 1, selStart = 1;\n  const bare = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));\n  for (let i = 0; i < bare.length; i++) { const ch = bare[i];");
rep("const worse = [], low = { before: 0, after: 0 }, vlow = { before: 0, after: 0 }; let texts = 0;", "const worse = [], low = { before: 0, after: 0 }, vlow = { before: 0, after: 0 }; let texts = 0, fellBelow = 0, roseAbove = 0;");
rep("if (r.ratio < o.ratio - 0.3) worse.push({ k: r.k, text: r.text, before: o.ratio, after: r.ratio }); }", "if (o.ratio >= 4.5 && r.ratio < 4.5) fellBelow++; if (o.ratio < 4.5 && r.ratio >= 4.5) roseAbove++;\n          if (r.ratio < o.ratio - 0.3) worse.push({ k: r.k, text: r.text, before: o.ratio, after: r.ratio }); }");
rep("worse: worse.sort((x, y) => x.after - y.after).slice(0, 12), worseCount: worse.length,", "worse: worse.sort((x, y) => x.after - y.after).slice(0, 12), worseCount: worse.length, worstAfter: worse.length ? worse[0].after : null, fellBelow, roseAbove,");
fs.writeFileSync(f, s, { encoding: 'utf8' });
console.log('고침');
