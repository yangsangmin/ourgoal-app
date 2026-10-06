const fs = require('fs');
let c = fs.readFileSync('court/report.js', 'utf8');

const SCOPE_PRESERVE_NOTICE = '법정이 보증하는 것은 새로 작성된 모듈 분할 증명서(CELL_SPLIT_PROOF)에 따라, 기준 커밋(2번)과 작업 커밋(1번) 간의 토큰 비교, 부품 누수, DOM/스토리지 일치가 기계적으로 검증되었다는 사실입니다. 제품의 실제 의도와 설계는 상민님께서 직접 확인해 주십시오.';

c = c.replace(
  /const order = \['화면에서 눌러 확인', '글자만 확인\(이 종류는 그걸로 충분\)', '확인 부족', '코드만 확인\(화면에서는 안 눌러 봄\)', '확인 못 함', '고칠 게 없었음', '안 됨', '심사 못 함'\];/,
  "const order = ['동작 보존 확인', '화면에서 눌러 확인', '글자만 확인(이 종류는 그걸로 충분)', '확인 부족', '코드만 확인(화면에서는 안 눌러 봄)', '확인 못 함', '고칠 게 없었음', '안 됨', '심사 못 함'];"
);

if (!c.includes('SCOPE_PRESERVE_NOTICE')) {
  c = c.replace(
    'const SCOPE_NOTICE =',
    "const SCOPE_PRESERVE_NOTICE = '" + SCOPE_PRESERVE_NOTICE + "';\n  const SCOPE_NOTICE ="
  );
  
  c = c.replace(
    /L\.push\('- ' \+ SCOPE_NOTICE\);/g,
    "L.push('- ' + (c.outcome === '동작 보존 확인' ? SCOPE_PRESERVE_NOTICE : SCOPE_NOTICE));"
  );
  
  c = c.replace(
    /SCOPE_NOTICE \};/g,
    "SCOPE_NOTICE, SCOPE_PRESERVE_NOTICE };"
  );
  
  fs.writeFileSync('court/report.js', c, 'utf8');
}
console.log('patched');
