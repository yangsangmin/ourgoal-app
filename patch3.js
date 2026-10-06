const fs = require('fs');
let c = fs.readFileSync('court/lib/preserve.js', 'utf8');

const oldCheck = 'if (!item.tokensOrigArray || !item.tokensNewArray) {';
const newCheck = \if (!item.tokensOrigArray || !item.tokensNewArray) {
      return { ok: false, reason: '토큰 원시 배열 누락' };
    }
    if (ctx.base && ctx.base.dir) {
      const bFile = path.join(ctx.base.dir, 'index.html');
      const bToks = getTokens(bFile);
      if (bToks && JSON.stringify(bToks) !== JSON.stringify(item.tokensOrigArray)) return { ok: false, reason: 'base.dir 토큰 변조 감지' };
    }
    if (ctx.head && ctx.head.dir) {
      const hFile = path.join(ctx.head.dir, (item.name || 'index') + '.js');
      const hToks = getTokens(hFile);
      if (hToks && JSON.stringify(hToks) !== JSON.stringify(item.tokensNewArray)) return { ok: false, reason: 'head.dir 토큰 변조 감지' };
    }
    if (false) {\;

c = c.replace(oldCheck, newCheck);

fs.writeFileSync('court/lib/preserve.js', c, 'utf8');
