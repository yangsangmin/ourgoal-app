'use strict';
// #TASK-ES-672 — 법정의 생성기 재실행 대조(court/lib/preserve-source.js recomputeSplit)를 실제 커밋 대상으로 직접 불러 본다.
// 작업자 PC 예비 점검 — 판정이 아니다(법정 코드를 읽기만 쓴다). mockOverrides 없이 부른다.
// 사용: node reports/TASK-ES-672/tools/recompute-split.cjs <기준 커밋> <심사할 커밋> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const [BASE, HEAD, OUT] = process.argv.slice(2);
const git = a => cp.execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const baseSha = git(['rev-parse', BASE]), headSha = git(['rev-parse', HEAD]);
const changedFiles = git(['diff', '--name-only', baseSha, headSha]).split('\n').filter(Boolean);
const config = JSON.parse(git(['show', headSha + ':reports/TASK-ES-672/proof.json']));
const { recomputeSplit } = require(path.join(ROOT, 'court', 'lib', 'preserve-source.js'));
let result; try { result = recomputeSplit({ repoDir: ROOT, baseSha, headSha, config, changedFiles }); } catch (e) { result = { ok: false, threw: String(e && e.stack || e).slice(0, 800) }; }
const out = { tool: 'court/lib/preserve-source.js recomputeSplit({repoDir, baseSha, headSha, config: proof.json, changedFiles}) — mockOverrides 없이 실제 커밋 대상', type: '작업자 PC 예비 점검 — 판정 아님', base: baseSha, head: headSha, changedFiles: changedFiles.length, ok: !!(result && result.ok), result };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: out.ok, base: baseSha.slice(0, 8), head: headSha.slice(0, 8), result }).slice(0, 1200));
process.exit(out.ok ? 0 : 1);
