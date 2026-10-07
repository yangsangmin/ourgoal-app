// .vercelignore 규칙을 origin/main 파일 목록에 적용해 배포에 남는 크기를 계산한다(읽기 전용, 단순 접두 규칙만 지원).
const cp = require('child_process'), fs = require('fs');
const repo = process.argv[2], ref = process.argv[3] || 'HEAD';
const rules = fs.readFileSync(repo + '/.vercelignore', 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
if (rules.some(r => r.startsWith('!') || /[*?\[]/.test(r))) { console.log('지원 안 하는 규칙 있음'); process.exit(2); }
const out = cp.execFileSync('git', ['-C', repo, '-c', 'core.quotepath=false', 'ls-tree', '-r', '-l', ref], { encoding: 'utf8', maxBuffer: 64 << 20 });
let keep = 0, drop = 0; const kept = {}; const mustKeep = ['index.html', 'js/', 'api/', 'icons/', '.well-known/', 'manifest.json', 'sw.js', 'vercel.json', 'ui.css', 'ui.js', 'docs/legal/', 'package.json'];
const seen = {};
for (const line of out.split('\n')) {
  const tab = line.indexOf('\t'); if (tab < 0) continue;
  const size = +line.slice(0, tab).trim().split(/\s+/)[3] || 0; const f = line.slice(tab + 1);
  const p = '/' + f;
  const ignored = rules.some(r => r.endsWith('/') ? p.startsWith(r) : p === r);
  if (ignored) drop += size; else { keep += size; const top = f.includes('/') ? f.split('/')[0] + '/' : f; kept[top] = (kept[top] || 0) + size; }
  for (const m of mustKeep) if (f === m || f.startsWith(m)) seen[m] = (seen[m] || 0) + (ignored ? -1e9 : 1);
}
console.log('남는 크기 MB', (keep / 1048576).toFixed(1), '· 빠지는 크기 MB', (drop / 1048576).toFixed(1));
console.log('남는 상위 항목:', Object.entries(kept).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (v / 1048576).toFixed(2)).join(' | '));
const bad = mustKeep.filter(m => !(seen[m] > 0));
console.log('꼭 남아야 할 것 중 빠지거나 없는 것:', bad.length ? bad.join(', ') : '없음');
