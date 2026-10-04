'use strict';
// #TASK-ES-354 효과 지표 3개(스크립트 산출): index.html 줄 수 전/후, 800줄 넘는 js/ 파일 수 전/후, 새·바뀐 설정/코어 파일 줄 수.
// 사용: node reports/TASK-ES-354/measure-effect.js <기준 커밋> [작업 커밋=HEAD] [--out <file.json>]
// 줄 수는 법정(court/lib/new-debt.js countLines)과 같은 방식: 끝 줄바꿈 하나는 줄을 늘리지 않는다.
const cp = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const argv = process.argv.slice(2);
const oi = argv.indexOf('--out');
const out = oi >= 0 ? argv[oi + 1] : null;
const pos = argv.filter((a, i) => a !== '--out' && (oi < 0 || i !== oi + 1));
const BASE = pos[0], HEAD = pos[1] || 'HEAD';
if (!BASE) { console.error('사용: node measure-effect.js <기준 커밋> [작업 커밋]'); process.exit(2); }
const git = args => cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const countLines = s => { s = String(s).replace(/\r\n/g, '\n'); if (!s.length) return 0; const n = s.split('\n').length; return s.endsWith('\n') ? n - 1 : n; };
const show = (rev, f) => { try { return git(['show', rev + ':' + f]); } catch (e) { return null; } };
const jsFiles = rev => git(['ls-tree', '-r', '--name-only', rev, '--', 'js']).split('\n').filter(f => /^js\/.+\.js$/.test(f));
const over800 = rev => jsFiles(rev).map(f => ({ f, n: countLines(show(rev, f)) })).filter(x => x.n > 800).sort((a, b) => b.n - a.n);
const baseOver = over800(BASE), headOver = over800(HEAD);
const FILES = ['js/core/app-scope.js', 'js/core/ui-helpers.js', 'js/tabs/settings/render.js', 'js/tabs/settings/sub-profile.js', 'js/tabs/settings/sub-security.js',
  'js/tabs/settings/sub-notify.js', 'js/tabs/settings/sub-appearance.js', 'js/tabs/settings/sub-integrations.js', 'js/tabs/settings/sub-data.js', 'js/tabs/settings/index.js'];
const files = FILES.map(f => { const b = show(BASE, f), h = show(HEAD, f); return { file: f, baseLines: b === null ? null : countLines(b), headLines: h === null ? null : countLines(h) }; });
const ib = countLines(show(BASE, 'index.html')), ih = countLines(show(HEAD, 'index.html'));
const headIndex = show(HEAD, 'index.html');
const result = {
  task: 'TASK-ES-354', base: git(['rev-parse', BASE]).trim(), head: git(['rev-parse', HEAD]).trim(),
  indexHtmlLines: { before: ib, after: ih, delta: ih - ib },
  renderSettingsScreenDefinitionsInIndex: (headIndex.match(/function\s+renderSettingsScreen\s*\(/g) || []).length,
  jsOver800: { before: baseOver.length, after: headOver.length, beforeList: baseOver, afterList: headOver },
  files, maxNewFileLines: Math.max(...files.map(x => x.headLines || 0)),
};
const txt = JSON.stringify(result, null, 1) + '\n';
if (out) fs.writeFileSync(out, txt, 'utf8');
console.log(txt);
