const fs = require('fs');
let code = fs.readFileSync('court/claims.js', 'utf8');

const target = "function judgeStatic(claim, headDir, ctx) {\r\n  const k = claim.check;\r\n  const fp = path.join(headDir, k.file);";
const replacement = `function judgeStatic(claim, headDir, ctx) {
  const k = claim.check;
  if (k.type === 'sourcePreservation') {
    const { recomputeSplit } = require('./lib/preserve-source.js');
    const configAbs = path.join(headDir, k.config);
    if (!fs.existsSync(configAbs)) return { ok: false, detail: k.config + ' 없음' };
    let configObj;
    try { configObj = JSON.parse(fs.readFileSync(configAbs, 'utf8')); } catch(e) { return { ok: false, detail: '설정 파일 파싱 실패' }; }
    const result = recomputeSplit({ repoDir: ctx.repoDir, baseSha: ctx.base.sha, headSha: ctx.head.sha, config: configObj, changedFiles: ctx.changedFiles });
    if (!result.ok) return { ok: false, detail: result.reason };
    return { ok: true, detail: '소스 보존 증명 통과 (' + result.details.checkedFiles.length + '개 파일)' };
  }
  const fp = path.join(headDir, k.file);`;

code = code.replace(target, replacement);

const target2 = "function judgeStatic(claim, headDir, ctx) {\n  const k = claim.check;\n  const fp = path.join(headDir, k.file);";
code = code.replace(target2, replacement);

fs.writeFileSync('court/claims.js', code);
