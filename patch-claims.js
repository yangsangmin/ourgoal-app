const fs = require('fs');

let code = fs.readFileSync('court/claims.js', 'utf8');

code = code.replace(/const STATIC_TYPES = \['jsonPath', 'fileExists', 'codeContains', 'codeNotContains'\];/, "const STATIC_TYPES = ['jsonPath', 'fileExists', 'codeContains', 'codeNotContains', 'sourcePreservation'];");

code = code.replace(
  "else if ((k.type === 'codeContains' || k.type === 'codeNotContains') && (typeof k.text !== 'string' || k.text.length < 4)) errors.push(at + 'codeContains 는 text(4자 이상) 필요');",
  "else if ((k.type === 'codeContains' || k.type === 'codeNotContains') && (typeof k.text !== 'string' || k.text.length < 4)) errors.push(at + 'codeContains 는 text(4자 이상) 필요');\n      else if (k.type === 'sourcePreservation' && typeof k.config !== 'string') errors.push(at + 'sourcePreservation 은 config(파일 경로) 필요');"
);

code = code.replace(/function judgeStatic\(claim, headDir\) \{/, 'function judgeStatic(claim, headDir, ctx) {');
code = code.replace(/const r = judgeStatic\(claim, head\.dir\);/, 'const r = judgeStatic(claim, head.dir, ctx);');

code = code.replace(
  "const code = stripByExt(k.file, src);",
  `if (k.type === 'sourcePreservation') {
    const { recomputeSplit } = require('./lib/preserve-source.js');
    const configAbs = path.join(headDir, k.config);
    if (!fs.existsSync(configAbs)) return { ok: false, detail: k.config + ' 없음' };
    let configObj;
    try { configObj = JSON.parse(fs.readFileSync(configAbs, 'utf8')); } catch(e) { return { ok: false, detail: '설정 파일 파싱 실패' }; }
    const result = recomputeSplit({ repoDir: ctx.repoDir, baseSha: ctx.base.sha, headSha: ctx.head.sha, config: configObj, changedFiles: ctx.changedFiles });
    if (!result.ok) return { ok: false, detail: result.reason };
    return { ok: true, detail: '소스 보존 증명 통과 (' + result.details.checkedFiles.length + '개 파일)' };
  }
  const code = stripByExt(k.file, src);`
);

fs.writeFileSync('court/claims.js', code);
console.log('Modified claims.js');
