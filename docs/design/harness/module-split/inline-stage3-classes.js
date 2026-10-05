#!/usr/bin/env node
'use strict';
/**
 * 인라인 3단계 잔여 묶음 분류표 (#TASK-ES-513)
 *
 * index.html 인라인 IIFE 에 남은 묶음(지도 docs/architecture/inline-script-map.json 의 「빈 구획」·「이음매(옮기지 않음)」 밖 전부)을
 * 「무엇이 막는가」로 나눈다. 줄 수·함수·FN_NAMES·최상위 this/arguments 는 지도와 index.html 재파싱에서 센다(손 계산 0).
 * 사람 판단이 들어가는 칸(게스트로 닿는가·돈·CSS 숨김)은 아래 RULES 에 근거(실측 파일·앞선 PR)와 함께 적고, 제목 일부로 묶음을 찾는다(묶음 번호는 병합마다 밀린다).
 * 시험지 선행 실측(F1m)은 scripts/inline-hard-test-probe.js 를 모든 잔여 묶음으로 넓혀 돌린 결과(--probe <json>)를 읽는다.
 *
 * 사용: NODE_PATH=<node_modules> node docs/design/harness/module-split/inline-stage3-classes.js [--probe <probe.json>] [--out <json>] [--md <설계 문서>]
 *   --md: 그 문서의 <!-- stage3-classes:begin --> … <!-- stage3-classes:end --> 사이를 표로 갈아 끼운다.
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const args = process.argv.slice(2);
const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'inline-script-map.json'), 'utf8'));
const PROBE = opt('--probe') ? JSON.parse(fs.readFileSync(opt('--probe'), 'utf8')) : null;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const sha = require('crypto').createHash('sha256').update(html).digest('hex').slice(0, 12);
if (MAP.source.sha256_12 !== sha) throw new Error('지도가 지금 index.html 과 다르다 — node scripts/inline-script-map.js --write 먼저(커밋은 하지 않는다) · 지도 ' + MAP.source.sha256_12 + ' 지금 ' + sha);
if (PROBE && PROBE.source && PROBE.source.indexSha256_12 && PROBE.source.indexSha256_12 !== sha) throw new Error('시험지 실측 파일이 지금 index.html 과 다르다');

// 분류(우선순위 순서 — 한 묶음은 처음 맞는 칸 하나로 센다). key: (가)~(마)·(바)·표준.
const CLASS = {
  S: '이음매 머리(옮길 코드 없음 — 앞선 PR 의 가져오기 줄)',
  '라': '(라) 돈 승인선 — 손대지 않는다(L033)',
  '마': '(마) CSS 숨김에 갇힌 기능 — 별도 결심 진행 중(제외)',
  '가': '(가) 게스트 화면으로 닿지 않는 경로가 있다',
  '나': '(나) 시험지가 인라인에서 함수를 잘라 실행(smoke FN_NAMES·구간 절단)',
  '다': '(다) 생성기가 멈추는 모양(최상위 this/arguments·한 줄 두 문·공용 타이머)',
  T: '표준 이음매로 바로(게스트 시나리오로 잰다)',
};
// [제목 일부, 칸, 근거] — 앞이 '=' 이면 제목 전체가 같아야 한다
const RULES = [
  [/인라인 스크립트 세포화 .*이음매/, 'S', '앞선 분열 PR 이 IIFE 머리에 둔 가져오기·통로 줄'],
  ['보상형 광고', '라', '광고(승인선 ①) — #774 H3 가 건너뜀'],
  ['구독 상태', '라', 'subscriptionState(돈 낱말) — #764 P0 가 건너뜀'],
  ['안내 모달 (전체 기능 100% 완전 무료 제공)', '라', 'openPaywallModal(paywall) — 돈 낱말(L033)'],
  ['XP/레벨 시스템', '마', 'renderLevelBadge — #levelBadgeRow 가 네 테마·홈 원스크린에서 숨김(#483)'],
  ['[UI/UX 틀 개편 Phase 4]', '마', '빠른 추가 입력칸·스마트 태그·루틴 매트릭스 보이는 요소 0, 상세 서랍 진입로 0(#481)'],
  ['#TASK-UIUX-PHASE5-RECORDS-CALENDAR', '마', '#quickStopwatchBar·#recCalFuseSwitcher ui.css 숨김(#481)'],
  ['목표 템플릿 백과사전 전체화면 팝업', '마', '진입 단추가 숨은 부모 안 — (가)와 겹침(#476·#483)'],
  ['=Supabase', '가', '로그인 — getSupabaseAuthToken'],
  ['뱃지 컬렉션', '가', '로그인 — loadProfile·ensureUserRow(실계정 실측: 테스트 계정 2회·게스트 0회) · FN_NAMES totalCompletedMilestones · 시험지 선행 2'],
  ['서버 관리자 API를 통한 기록 및 프로필 복구', '가', '로그인 — syncServerRecords(관리자 복구)'],
  ['2계정 상호작용 테스트', '가', '로컬 개발 주소에서만 도는 테스터 B 입장(enterAsTesterB)'],
  ['소셜 로그인', '가', '외부 OAuth(카카오·구글) — 법정은 외부 통신 차단'],
  ['디바이스 세션 & 원격 로그아웃', '가', '로그인 — setDeviceLoginTime(실계정 실측: 테스트 계정 2회·게스트 0회) · 이 PR 시범'],
  ['새 비밀번호 입력 모달', '가', '복구 메일 링크로만 열림(PASSWORD_RECOVERY)'],
  ['회원 탈퇴 30일 유예', '가', '로그인 — 소프트 삭제 복구 확인'],
  ['회원 탈퇴 전용 안내 모달', '가', '로그인 · 탈퇴 실행은 되돌릴 수 없음(④) — 열기·닫기만 잴 수 있다 · 시험지 선행 1'],
  ['데일리 루틴 서브탭', '가', '게스트 시드 루틴 0개(#493) — 게스트가 루틴을 만들어 닿는지 먼저 실측 · 시험지 선행 1'],
  ['RENDER: 팀 목표', '가', '팀·실시간·차단 사용자 · FN_NAMES filterHidden·sortGoalsByOrder·filterBlockedPosts'],
  ['개인 목표 200% 활용 가이드', '가', '팀(getGroupLevelGoals·openLevelGroupDetailModal·openTeamGoalEditModal — 테스트 계정 A 도 팀 0) · isMockGroup 은 게스트 소통 「팀」에서 22회(실측) · 시험지 구간 절단 3'],
  ['소통 피드 (Supabase feed_posts', '가', '상태 선언만(함수 0) — 옮길 함수 없음'],
  ['전역 공유 팀 로더', '가', '상태 선언만(함수 0)'],
  ['마니또 실 유저 익명 응원', '가', '상태 선언만(함수 0)'],
  ['DM & 동반자 소통 시스템', '가', 'openUserProfileModal 은 예비 경로 — 로그인해도 OurgoalTeamInviteComm 쪽이 불림'],
  ['통합 딥링크 게이트웨이', '가', '주소 쿼리로만 도는 경로 — 법정 goto 는 /index.html 만'],
  ['Notifications (best-effort', '가', '알림 시계(오래 기다림)'],
  ['Web Push', '가', '푸시 구독 — push-notification · 시험지 선행 1'],
  ['자정(00:00 KST', '가', '날짜가 바뀌어야 도는 경로(오래 기다림)'],
  ['TASK-ES-307: 측정지표', '나', '시험지가 함수 시작부터 원래 자리 노출 줄까지 잘라 실행 — 합본으로도 안 풀림(#467)'],
  ['Modal helper', '다', 'openModal 최상위 arguments(K) · 공용 부품(#471)'],
  ['전역 7일 유예 통합 휴지통', '다', 'saveGoogleToken 최상위 arguments(K) · FN_NAMES calendarAvailable · 시험지 선행 1'],
  ['=Confetti', '다', 'toast — 타이머 공유 공용 부품(#482)'],
  ['캘린더 실시간 구독 URL', '다', 'shareContent 가 노출과 같은 줄(#448)'],
  ['크리에이터 템플릿', '다', 'cloneTemplate 가 노출과 같은 줄(#448)'],
];
const match = (title, key) => (typeof key === 'string' ? (key[0] === '=' ? title === key.slice(1) : title.includes(key)) : key.test(title));

// index.html 재파싱: 최상위 this/arguments 함수(K), 묶음별 최상위 문 종류
const lines = html.split('\n');
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const ast = parser.parse(lines.slice(sLine, eLine).join('\n'), { sourceType: 'script' });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const H = n => n.loc.start.line + sLine, HE = n => n.loc.end.line + sLine;
const groups = MAP.groups.filter(g => !g.seam && g.tier !== '빈 구획' && g.tier !== '이음매(옮기지 않음)');
const gOf = l => groups.find(g => l >= g.start && l <= g.end);
const per = new Map(groups.map(g => [g.id, { kFns: [], wrap: 0, short: 0, window: 0, hoist: 0 }]));
for (const st of iife.get('body').get('body')) {
  const g = gOf(H(st.node)); if (!g) continue; const r = per.get(g.id);
  if (st.isFunctionDeclaration()) {
    let k = false;
    st.traverse({ ThisExpression(p) { if (p.getFunctionParent() === st) k = true; }, Identifier(p) { if (p.node.name === 'arguments' && p.getFunctionParent() === st && p.isReferencedIdentifier()) k = true; } });
    if (k) r.kFns.push(st.node.id.name);
    continue;
  }
  if (st.isVariableDeclaration() || st.isClassDeclaration() || st.isEmptyStatement()) continue;
  const e = st.isExpressionStatement() && st.node.expression;
  if (e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window') { r.window++; continue; }
  let hoist = false;
  st.traverse({ VariableDeclaration(p) { if (p.node.kind === 'var' && p.getFunctionParent() === iife) hoist = true; } });
  if (hoist) r.hoist++; else if (HE(st.node) - H(st.node) + 1 <= 3) r.short++; else r.wrap++;
}
const probeOf = id => { if (!PROBE) return null; const g = (PROBE.groups || []).find(x => x.id === id); return g ? (g.broken || []) : []; };

const rows = groups.map(g => {
  let cls = null, why = '';
  for (const [k, c, w] of RULES) if (match(g.title, k)) { cls = c; why = w; break; }
  const r = per.get(g.id);
  if (!cls && g.smokeFnNames.length) { cls = '나'; why = 'FN_NAMES ' + g.smokeFnNames.join('·') + ' — 합본 읽기(#751·#465)로 풀림, 세포를 js/tabs/** 또는 js/core/* 에'; }
  if (!cls && r.kFns.length) { cls = '다'; why = '최상위 this/arguments: ' + r.kFns.join('·'); }
  if (!cls) { cls = 'T'; why = '게스트 화면으로 닿는다고 본다(빌더가 시나리오로 먼저 실측)'; }
  const broken = probeOf(g.id);
  return { id: g.id, title: g.title, start: g.start, end: g.end, lines: g.lines, functions: g.functions.length, cls, why, smokeFnNames: g.smokeFnNames, kFns: r.kFns, stmts: { wrap: r.wrap, short: r.short, window: r.window, varHoist: r.hoist }, testFirst: broken };
});
const order = ['S', '라', '마', '가', '나', '다', 'T'];
const sum = order.map(c => { const rs = rows.filter(r => r.cls === c); return { cls: c, label: CLASS[c], groups: rs.length, lines: rs.reduce((a, r) => a + r.lines, 0), functions: rs.reduce((a, r) => a + r.functions, 0), testFirst: rs.filter(r => r.testFirst && r.testFirst.length).length }; });
const totals = { groups: rows.length, lines: rows.reduce((a, r) => a + r.lines, 0), functions: rows.reduce((a, r) => a + r.functions, 0) };
const out = { schema: 'inline-stage3-classes/1', source: { indexSha256_12: sha, map: 'docs/architecture/inline-script-map.json', probe: PROBE ? 'scripts/inline-hard-test-probe.js(잔여 전체로 넓힘)' : null }, totals, summary: sum, rows };

const md = [];
md.push('> 아래 표는 `NODE_PATH=<node_modules> node docs/design/harness/module-split/inline-stage3-classes.js --probe <실측> --md <이 문서>` 가 쓴다(손으로 고치지 않는다). 출처 index.html sha256 앞 12자 `' + sha + '`. 이 판에서만 맞는 수치다 — 주장(claims)에 쓰지 않는다(L002).');
md.push('');
md.push('잔여 묶음 **' + totals.groups + '개 · ' + totals.lines + '줄 · 함수 ' + totals.functions + '개**(지도의 빈 구획·이음매 표지 밖 전부).');
md.push('');
md.push('| 칸 | 뜻 | 묶음 | 줄 | 함수 | 시험지 선행 필요(실측) |');
md.push('|---|---|--:|--:|--:|--:|');
for (const s of sum) md.push('| ' + s.cls + ' | ' + s.label + ' | ' + s.groups + ' | ' + s.lines + ' | ' + s.functions + ' | ' + (PROBE ? s.testFirst : '측정불가') + ' |');
const st = rows.reduce((a, r) => { for (const k in r.stmts) a[k] = (a[k] || 0) + r.stmts[k]; return a; }, {});
const kAll = rows.flatMap(r => r.kFns);
md.push('');
md.push('최상위 문(함수·변수 선언 밖) 전체: 감쌀 수 있는 4줄 이상 문 ' + st.wrap + ' · 3줄 이하 문(원래 자리) ' + st.short + ' · window 노출 문(원래 자리) ' + st.window + ' · 감싸면 지역 변수가 되는 var 문 ' + st.varHoist + '. 최상위 this/arguments 함수 ' + kAll.length + '개(' + kAll.join('·') + ').');
out.statements = st; out.kFns = kAll;
md.push('');
for (const c of order.slice(1)) {
  const rs = rows.filter(r => r.cls === c).sort((a, b) => a.lines - b.lines);
  if (!rs.length) continue;
  md.push('#### ' + CLASS[c]);
  md.push('');
  md.push('| 묶음 제목 | 줄 | 함수 | 막는 것(근거) | 시험지 선행 |');
  md.push('|---|--:|--:|---|---|');
  for (const r of rs) md.push('| ' + r.title.replace(/\|/g, '/').slice(0, 56) + ' | ' + r.lines + ' | ' + r.functions + ' | ' + r.why.replace(/\|/g, '/') + ' | ' + (r.testFirst == null ? '측정불가' : r.testFirst.map(t => t.replace(/^tests\//, '')).join(', ') || '없음') + ' |');
  md.push('');
}
const mdText = md.join('\n');
if (opt('--out')) fs.writeFileSync(opt('--out'), JSON.stringify(out, null, 1) + '\n', 'utf8');
if (opt('--md')) {
  const f = opt('--md'); const d = fs.readFileSync(f, 'utf8');
  const re = /<!-- stage3-classes:begin -->[\s\S]*?<!-- stage3-classes:end -->/;
  if (!re.test(d)) throw new Error('문서에 stage3-classes 표지가 없다');
  fs.writeFileSync(f, d.replace(re, '<!-- stage3-classes:begin -->\n' + mdText + '\n<!-- stage3-classes:end -->'), 'utf8');
}
console.log('잔여 ' + totals.groups + '묶음 ' + totals.lines + '줄 함수 ' + totals.functions + ' · 출처 ' + sha);
for (const s of sum) console.log(s.cls.padEnd(2), String(s.groups).padStart(3), '묶음', String(s.lines).padStart(6), '줄', String(s.functions).padStart(4), '함수', '선행', s.testFirst, s.label);
