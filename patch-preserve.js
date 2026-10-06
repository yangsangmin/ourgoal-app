const fs = require('fs');
let c = fs.readFileSync('court/lib/preserve.js', 'utf8');

const diffLogic = `
    let changedFiles = [];
    try {
      if (ctx.base && ctx.base.sha && ctx.head && ctx.head.sha) {
        const { execSync } = require('child_process');
        changedFiles = execSync('git diff --name-only ' + ctx.base.sha + ' ' + ctx.head.sha, { encoding: 'utf8' }).trim().split('\\n').map(x => x.trim()).filter(Boolean);
      }
    } catch(e) { }
    const res = recomputeSplit({
      baseDir: ctx.base ? ctx.base.dir : null,
      headDir: ctx.head ? ctx.head.dir : null,
      config: proof,
      changedFiles: changedFiles
    });
`;

c = c.replace(/const res = recomputeSplit\(\{[\s\S]*?\}\);/, diffLogic.trim());

fs.writeFileSync('court/lib/preserve.js', c, 'utf8');
console.log('patched');
