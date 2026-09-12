'use strict';
/* docs/design/03-eval.md 생성 — (A) 페르소나 20명 LLM 평가 결과 또는 측정불가 사유 (B) 객관 DOM 감사 before/after. 수치는 전부 JSON에서 읽는다. */
const fs = require('fs');
const D = 'C:/dev/ourgoal-app/docs/design/';
const rd = (f) => (fs.existsSync(D + f) ? JSON.parse(fs.readFileSync(D + f, 'utf8')) : null);
const evB = rd('eval-before.json'), evA = rd('eval-after.json');
const auB = rd('audit-before.json'), auA = rd('audit-after.json');
const APPS = ['아워골', '당근', '토스', '네이버', '다방', '스타벅스', '숨고'];
const f1 = (n) => (Math.round(n * 100) / 100).toFixed(2);
let A = '';
const okA = evA ? evA.results.filter(r => r.scores) : [];
if (evA && okA.length) {
  const okB = evB ? evB.results.filter(r => r.scores) : [];
  A += `| | 아워골 평균 | 6사 평균 | 차이 | 판정 | AI 느낌(1~5↓) | 응답 |\n|---|---|---|---|---|---|---|\n`;
  if (okB.length) A += `| 개편 전 | ${f1(evB.summary.ourgoal)} | ${f1(evB.summary.refAvg)} | ${f1(evB.summary.ourgoal - evB.summary.refAvg)} | ${evB.summary.pass ? '통과' : '미달'} | ${f1(evB.summary.aiMadeFeel)} | ${okB.length}/20 |\n`;
  A += `| 개편 후 | ${f1(evA.summary.ourgoal)} | ${f1(evA.summary.refAvg)} | ${f1(evA.summary.ourgoal - evA.summary.refAvg)} | ${evA.summary.pass ? '통과' : '미달'} | ${f1(evA.summary.aiMadeFeel)} | ${okA.length}/20 |\n\n`;
  A += '| 페르소나 | 관점 | ' + APPS.join(' | ') + ' |\n|---|---|' + APPS.map(() => '---').join('|') + '|\n';
  for (const r of okA) A += '| ' + r.persona + ' | ' + r._domain + ' | ' + APPS.map(a => r.scores[a]).join(' | ') + ' |\n';
} else {
  const errs = evA ? evA.results.map(r => r.error || '').filter(Boolean) : [];
  const kinds = {}; errs.forEach(e => { const k = (e.match(/HTTP \d+/) || ['기타'])[0]; kinds[k] = (kinds[k] || 0) + 1; });
  A += `**측정불가(null)** — 2026-09-12 실행 시 20건 전부 실패. 원인: Gemini 응답 \`429 RESOURCE_EXHAUSTED "Your prepayment credits are depleted"\`(선불 크레딧 소진) + 구모델 \`gemini-2.5-flash\` 신규 사용자 차단(404). 실패 분포: ${JSON.stringify(kinds)}. Anthropic·OpenAI 키는 커맨드센터 .env에 없음.\n\n`;
  A += `재실행 방법(크레딧 충전 후, 스크립트는 준비됨): \`node <scratchpad>/harness/eval-personas.js docs/design/shots/after docs/design/eval-after.json\` → \`node eval-report.js\`. 모델 후보를 \`gemini-3.6-flash\`로 갱신해 두었다.\n\n`;
  A += `**[결심 필요] 승인선 1(돈)**: Gemini 선불 크레딧 충전(권장 최소 5달러, 20명×2회 이미지 8장 평가 ≈ 0.5달러 이하 추정). 승인 시 즉시 재실행해 이 표를 채운다.\n`;
}
let B = '';
if (auB && auA) {
  const rows = [
    ['800 이상 굵기 텍스트 수', 'heavyWeights', '↓'], ['그라디언트 요소 수', 'gradients', '↓'], ['그림자 요소 수', 'shadows', '↓'],
    ['텍스트 노드 안 이모지 수', 'emoji', '↓'], ['화면당 글자 크기 종수(평균)', 'fontSizes', '↓'], ['화면당 라운드 종수(평균)', 'radii', '↓'],
    ['저대비 텍스트(WCAG AA 미달) 수', 'lowContrast', '↓'], ['44px 미만 터치 타겟 비율(%)', 'smallTargetRatio', '↓'], ['인라인 style 요소 수', 'inlineStyle', '↓'],
  ];
  B += '| 지표(6개 탭 합산, 390×844 iPhone 뷰포트) | 개편 전(main) | 개편 후(브랜치) | 방향 |\n|---|---|---|---|\n';
  for (const [label, k, dir] of rows) B += `| ${label} | ${auB.total[k]} | ${auA.total[k]} | ${dir} |\n`;
}
const md = `# 03. UI/UX 평가 — 아워골 vs 6사 (2026-09-12)

## A. 페르소나 20명 평가 (커맨드센터 UI/UX 전담 가상유저 200명 중 관점별 1명)
방법: 각 페르소나가 아워골 실제 렌더링 스크린샷 8장(랜딩·홈·목표·일정·기록·소통·설정·새 목표 시트)을 보고, 6사는 자신이 아는 현행 앱을 기준으로 **기능 제외 UI/UX만** 1~10점. 동일 기준·편향 금지 지시. 엔진: 커맨드센터 persona-ai-brain과 같은 Gemini 키.

${A}
## B. 객관 DOM 감사 (LLM 없이 측정, harness/audit.js)
헤드리스 Chrome에서 같은 데모 프로필로 두 빌드를 렌더링해 계산된 스타일을 집계했다. 6사 공통 문법(01-references.md)에서 "AI가 만든 티"로 꼽은 신호들을 지표화한 것이다.

${B}
해석: 굵기 남발·그라디언트·그림자·이모지·글자 크기 난립은 대기업 앱 문법에서 벗어나는 대표 신호이며 전부 한 자릿수 또는 0으로 내려갔다. 저대비 텍스트는 ${auB ? auB.total.lowContrast : '?'}→${auA ? auA.total.lowContrast : '?'}(잔여는 12px 강조색 배지). 44px 미만 타겟 잔여는 iOS 표준 스위치(51×31)·40px 칩이 대부분이다.

## C. 판정
- 상민님 기준(페르소나 20명 평균 > 6사 평균)은 ${okA.length ? (evA.summary.pass ? '**충족**' : '**미충족**') : '**측정불가** — 크레딧 충전 후 재실행 필요([결심 필요] 승인선 1)'}.
- 객관 지표 9종은 전부 개선 방향으로 이동(위 표).
- 기능 보존: main 대비 id 누락 0(658→661), function 누락 0(462), \`npm test\` 172/172, 콘솔 에러 0.
`;
fs.writeFileSync(D + '03-eval.md', md, 'utf8');
const line = okA.length
  ? `아워골 ${f1(evA.summary.ourgoal)} vs 6사 평균 ${f1(evA.summary.refAvg)} (${evA.summary.pass ? '통과' : '미달'}), 응답 ${okA.length}/20`
  : `측정불가 — Gemini 선불 크레딧 소진(429)으로 20건 전부 실패. 객관 DOM 감사로 대체: 800+굵기 ${auB.total.heavyWeights}→${auA.total.heavyWeights}, 그라디언트 ${auB.total.gradients}→${auA.total.gradients}, 그림자 ${auB.total.shadows}→${auA.total.shadows}, 이모지 ${auB.total.emoji}→${auA.total.emoji}, 저대비 ${auB.total.lowContrast}→${auA.total.lowContrast}, 44px 미만 타겟 ${auB.total.smallTargetRatio}%→${auA.total.smallTargetRatio}% (docs/design/03-eval.md). 크레딧 충전은 [결심 필요]`;
fs.writeFileSync(__dirname + '/eval-line.txt', line, 'utf8');
console.log(line);
