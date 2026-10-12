#!/usr/bin/env node
'use strict';
// #TASK-ES-693 — 지시함(docs/directives/ACTIVE.md)에 DIR-005 를 「열린 지시」로 넣고 「결심 대기」 표 끝에 줄을 더한다.
// 줄 번호·숫자는 글틀(reports/TASK-ES-693/text/*.md)에 손으로 적지 않고 표지 {{이름}} 로 두며, 측정값(measure.json — tools/measure.cjs 산출)에서 채운다.
// 여러 번 돌려도 같은 결과가 되게 한다(이미 넣은 DIR-005 와 줄은 갈아 끼운다).
// 사용: node reports/TASK-ES-693/tools/render-directive.cjs            지시함을 고치고 주장 파일을 만든다
//       node reports/TASK-ES-693/tools/render-directive.cjs --check    채우지 않은 자리표(【 】)와 표지가 남았는지 본다(남았으면 종료 1)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..'), DIR = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'docs', 'directives', 'ACTIVE.md');
const M = JSON.parse(fs.readFileSync(path.join(DIR, 'measure.json'), 'utf8'));
const cap = M.indexHtml.captureCardBox, wire = M.indexHtml.ogTaskWireSlot, sv = M.save, css = M.uiCss;
const n = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pk = M.pkg, reach = M.geneReach, pt = M.pilotText, ss = M.scriptStyle, sf = M.saveFailure;
// 줄 번호 묶음을 「153~156 · 158~161」 꼴로
const span = a => { const s = [...new Set(a)].sort((x, y) => x - y), o = []; for (let i = 0; i < s.length; i++) { let j = i; while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++; o.push(j > i ? s[i] + '~' + s[j] : String(s[i])); i = j; } return o.join(' · '); };
const V = {
  'base': M.mainBase, 'cap.startLine': cap.startLine, 'cap.endLine': cap.endLine, 'cap.lines': cap.lines, 'cap.buttons': cap.buttons, 'cap.inputs': cap.inputs, 'cap.ids': cap.ids.length,
  'wire.startLine': wire.startLine, 'wire.endLine': wire.endLine, 'wire.lines': wire.lines,
  't0.line': M.indexHtml.texts[0].line, 't1.line': M.indexHtml.texts[1].line, 't2.line': M.indexHtml.texts[2].line,
  'themes': M.acceptedThemes.join(' · '),
  'five': css.fiveVariables.map(v => v.name).join(' · '), 'fiveUses': css.fiveVariables.reduce((a, v) => a + v.usedInUiCss, 0),
  'flash': sv.flashLines[0] + '~' + sv.flashLines[sv.flashLines.length - 1], 'confetti': sv.confettiLines[0],
  'css.lines': n(css.lines), 'css.important': n(css.important), 'css.uses': n(css.variableUses),
  'nav.app': css.bottomNav.appShellRuleLine, 'nav.white': css.bottomNav.whiteThemeRuleLine,
  'save.clear': sv.inputClearedLines[0], 'save.call': sv.saveProfileCallLines[0], 'save.spStart': sv.saveProfile.startLine, 'save.spEnd': sv.saveProfile.endLine, 'save.warn': sv.saveProfile.warnLines[0],
  // 넘겨받은 꾸러미(시안의 확정 기준 판 · 구현용 명세)
  'pkg.dir': pk.dir, 'pkg.files': pk.files, 'gene.changed': pk.gene.changed, 'gene.variables': pk.gene.variables, 'gene.cells': pk.gene.cells, 'gene.changedVars': reach.changedVariables,
  'reach.css': n(reach.usesOfChanged.uiCss), 'reach.html': n(reach.usesOfChanged.indexHtml), 'reach.js': n(reach.usesOfChanged.js),
  'spec.textPlaces': pk.spec.changedTextPlaces, 'spec.notInPilot': pk.spec.notInPilot, 'spec.states': pk.spec.stateScenes - 1, 'spec.unknowns': pk.spec.unknowns, 'cap.inline': cap.inlineStyleAttrs,
  // 글의 자리 · 제품 코드가 직접 적는 꾸밈 · 시험
  'title.visible': (pt.titleLines.find(t => t.visible) || {}).line, 'title.attr': (pt.titleLines.find(t => t.attribute) || {}).line,
  'restore.a': pt.restoreButtonHtmlLines[0], 'restore.b': pt.restoreButtonHtmlLines[1], 'saving.line': (pt.saving.js[0] || '').split(':')[1], 'toast.a': pt.toastBuildLines[0], 'toast.b': pt.toastBuildLines[1], 'toast.call': pt.toastCallLine,
  'script.places': ss.places, 'script.tier': span(ss.tierButtons.lines), 'script.chip': span(ss.quickChips.inlineStyleInMarkupLines.concat(ss.quickChips.lines)), 'script.handler': span(ss.saveHandler.lines), 'tests.files': M.pilotTests.files,
  // 저장 실패 조사가 가리킨 줄(이 작업자가 코드에서 다시 읽어 맞춘 줄 번호)
  'sf.users': sf.serverWaitLines.users, 'sf.goalsBk': sf.deviceWriteLines.goalsBackup, 'sf.full': sf.deviceWriteLines.fullCopy, 'sf.recBk': sf.deviceWriteLines.recordsBackup, 'sf.overwrite': sf.profileLoad.backupOverwrittenByServerLine, 'sf.syncA': sf.offlineQueue.syncOnlineLines[0], 'sf.syncB': sf.offlineQueue.syncOnlineLines[1], 'sf.client': sf.serverClient.createLine,
  'chip.file': M.chip.file, 'chip.start': M.chip.startLine, 'chip.end': M.chip.endLine,
};
// 지시가 기대는 사실이 지금 코드와 맞는지 먼저 본다(틀리면 멈춘다)
const must = [
  [M.indexHtml.texts[0].insideCaptureCard && M.indexHtml.texts[1].insideCaptureCard, '창 이름·저장 단추 글이 #captureCardBox 안에 있다'],
  [!M.indexHtml.texts[2].insideCaptureCard, '평가 배너 글은 #captureCardBox 밖에 있다'],
  [sv.inputClearedLines[0] < sv.saveProfileCallLines[0], '입력칸을 비우는 줄이 저장 함수를 부르는 줄보다 앞이다'],
  [sv.saveProfile.throwLines.length === 0 && !sf.checkinsResultUsed && !sf.goalsResultUsed, '저장 함수가 예외를 던지지 않고 기록 · 목표 올리기의 응답을 쓰지 않는다'],
  [sf.toastHasFailureBranch === false, '홈 저장 처리기에 실패 갈래가 없다'],
  [sf.serverWaitLines.users < sf.deviceWriteLines.goalsBackup && sf.deviceWriteLines.goalsBackup < sf.deviceWriteLines.recordsBackup, '첫 서버 요청이 기기 쓰기(목표 백업 · 전체 사본 · 기록 백업)보다 앞이다'],
  [sf.serverClient.hasOptionsArgument === false && sf.profileLoad.backupOverwrittenByServerLine > 1 && !!sf.offlineQueue.syncOnlineLines, '서버 연결에 옵션이 없고, 불러오기의 백업 덮어쓰기 줄과 대기줄 함수가 있다'],
  [pt.saveButton.indexHtml.length === 1 && pt.saveButton.indexHtmlInsideCard === 1 && pt.saveButton.js.length === 0, '저장 단추의 글은 index.html 구획 안 한 곳에만 있고 js 에는 없다'],
  [pt.saving.indexHtml.length === 0 && pt.saving.js.length === 1 && pt.toastBase.indexHtml.length === 0 && pt.restoreButtonHtmlLines.length === 2, '「기록 중…」과 알림 글은 js 에만 있고, 처리기가 단추의 글을 담아 두었다가 되돌린다'],
  [pt.titleLines.filter(t => t.visible).length === 1 && pt.titleLines.filter(t => t.attribute).length === 1, '창 이름은 보이는 글 한 줄과 속성 한 줄이다'],
  [pt.nowInTests.codeLines.length === 0, '바뀌는 글을 글자로 확인하는 시험 줄이 없다'],
  [ss.files.length === 3 && ss.places > 0, '제품 코드가 구획의 요소에 꾸밈을 직접 적는 파일이 셋이다'],
  [pk.gene.changed + pk.gene.same === pk.gene.cells && pk.gene.themes === 4 && pk.spec.stateScenes >= 2, '유전자 값 표의 칸 수가 맞고 테마가 넷이다'],
  [fs.existsSync(path.join(DIR, 'save-failure-investigation.md')), '저장 실패 조사의 사본이 근거 폴더에 있다'],
  [css.fiveVariables.every(v => v.definedInUiCss === 0 && v.definedElsewhere === 0 && v.setByScript === 0), '변수 다섯의 정의가 0곳이다'],
  [M.acceptedThemes.length === 4, '켤 때 받아들이는 테마가 넷이다'],
];
const broken = must.filter(m => !m[0]).map(m => m[1]);
if (broken.length) { console.error('지금 코드가 지시의 전제와 다르다: ' + broken.join(' / ')); process.exit(1); }
const unknown = [];
const fill = t => t.replace(/\{\{([^}]+)\}\}/g, (m, k) => { if (!(k in V)) { unknown.push(k); return m; } return String(V[k]); });
const read = f => fs.readFileSync(path.join(DIR, 'text', f), 'utf8').replace(/\r\n/g, '\n').trim();
const dir5 = fill(read('dir-005.md')), rows = fill(read('decision-rows.md')).split('\n');
if (unknown.length) { console.error('채울 수 없는 표지: ' + [...new Set(unknown)].join(', ')); process.exit(1); }

let doc = fs.readFileSync(A, 'utf8'); const crlf = /\r\n/.test(doc); doc = doc.replace(/\r\n/g, '\n');
if (process.argv.includes('--check')) { const holes = (doc.match(/【[^】]*】/g) || []); const tokens = (doc.match(/\{\{[^}]+\}\}/g) || []); console.log(JSON.stringify({ placeholders: holes.length, first: holes.slice(0, 6).map(h => h.slice(0, 50)), tokens: tokens.length, hasDir005: doc.indexOf('### DIR-005') >= 0 }, null, 1)); process.exit(holes.length || tokens.length ? 1 : 0); }

// ① 열린 지시
const a = doc.indexOf('## 열린 지시\n'), b = doc.indexOf('\n---\n\n## 결심 대기');
if (a < 0 || b < 0 || b < a) { console.error('「열린 지시」 칸을 찾지 못했다'); process.exit(1); }
const open = doc.slice(a + '## 열린 지시\n'.length, b);
const others = (open.match(/^### (DIR-[0-9A-Z]+)[\s\S]*?(?=^### DIR-|$(?![\s\S]))/gm) || []).filter(s => s.indexOf('### DIR-005') !== 0).map(s => s.trim());
const otherIds = others.map(s => (/^### (DIR-[0-9A-Z]+)/.exec(s) || [])[1]);
if (!others.length && open.trim() !== '(열린 지시 없음)' && open.indexOf('### DIR-005') < 0) { console.error('「열린 지시」 칸이 예상과 다르다 — 손대지 않고 멈춘다'); process.exit(1); }
doc = doc.slice(0, a) + '## 열린 지시\n\n' + others.concat([dir5]).join('\n\n') + '\n' + doc.slice(b);
// ② 결심 대기 표 끝
const lines = doc.split('\n'); const head = lines.findIndex(l => l.indexOf('## 결심 대기') === 0);
let end = head + 1, lastRow = -1; while (end < lines.length && lines[end].indexOf('## ') !== 0) { if (lines[end].indexOf('|') === 0) lastRow = end; end++; }
if (head < 0 || lastRow < 0) { console.error('「결심 대기」 표를 찾지 못했다'); process.exit(1); }
const keyOf = l => l.split('|')[1].trim().slice(0, 22); const keys = rows.map(keyOf); let replaced = 0;
// 이 도구가 앞서 넣었다가 첫머리를 고쳐 쓴 줄(같은 줄이 두 번 남지 않게 뺀다)
const retired = ['오늘 기록 저장이 서버에서 실패해도 사용자에게 보이지 않는다'];
const mine = l => keys.indexOf(keyOf(l)) >= 0 || retired.some(r => l.split('|')[1].trim().indexOf(r) === 0);
for (let i = lastRow; i > head; i--) { if (lines[i].indexOf('|') === 0 && mine(lines[i])) { lines.splice(i, 1); replaced++; lastRow--; } }
lines.splice(lastRow + 1, 0, ...rows); doc = lines.join('\n');
fs.writeFileSync(A, crlf ? doc.replace(/\n/g, '\r\n') : doc, { encoding: 'utf8' });

// 주장 파일
const F = 'docs/directives/ACTIVE.md';
const has = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const not = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeNotContains', file, text } });
const cell = i => rows[i].split('|')[1].trim();
const PKG = pk.dir + '/';
const claims = [
  has('C1', 'R1', 'DIR-005 가 열린 지시에 있다', F, '### DIR-005 — 디자인 개편 1단계: 공용 꾸밈(유전자) 최소 조정과 홈 「오늘 기록하기」 창 시범'),
  has('C2', 'R1', '시범 구획의 줄 범위가 측정값대로 적혀 있다', F, '`#captureCardBox`(index.html ' + cap.startLine + '~' + cap.endLine + '행, ' + cap.lines + '줄)'),
  has('C3', 'R1', '건드리지 않는 것에 숨은 연결용 카드가 줄 범위와 함께 있다', F, '`#ogTaskWireSlot` — index.html ' + wire.startLine + '~' + wire.endLine + '행, ' + wire.lines + '줄'),
  has('C4', 'R1', '평가 배너가 출시 전 범위 밖이라고 적혀 있다', F, '구획 밖이고 출시 전 범위 밖이다'),
  has('C5', 'R1', '새 규칙이 이기는 방법의 판정 기준 넷이 적혀 있다', F, '새 규칙이 이기지 못한 자리 수 · 의도하지 않은 변화 수(묶음 ① 은 「예상 변화 목록」 밖의 변화, 묶음 ② 는 시범 구획 밖에 번진 변화) · 네 테마에서 깨진 수 · 그 구획의 기능 시험과 여정 시나리오가 기준과 같은가'),
  has('C6', 'R1', '병합 전 독립 확인을 붙이라고 적혀 있다', F, 'PR 마다 병합 전 독립 확인을 붙인다'),
  has('C7', 'R1', '출시 필수 일이 먼저이고 동결 주가 적혀 있다', F, '출시 후보 동결(W4, 11/2~11/8)'),
  has('C8', 'R2', '상민님 원문 1 이 글자 그대로 있다', F, '「9월 자료는 쓰지 마. 디자인을 어떻게 바꾸고 싶은지 내 의도는 지식기반에서 디자인 개편관련 모든 내 명령, 질문 등의 원문을 확인해서 파악해서 진행하도록 해. 나머지는 권장대로 진행하고 회의 필요한 부분들이 있으면 소통하면서 진행해」'),
  has('C9', 'R2', '상민님 원문 2 가 글자 그대로 있다', F, '**상민님 원문 2**(2026-10-12): 「권장대로 진행해.」'),
  has('C10', 'R2', '해석을 상민님 말씀과 갈라 적었다', F, '**지휘 세션의 해석(상민님 말씀이 아니다)**'),
  has('C11', 'R2', '세션끼리의 합의가 승인이 아니라고 적었다', F, '**세션끼리의 합의(상민님 승인이 아니다)**'),
  has('C12', 'R2', '작성자가 채팅을 보지 못했다고 적었다', F, '이 지시를 쓴 작업자는 상민님과의 채팅을 직접 보지 못했다.'),
  has('C13', 'R3', '결심 대기에 「9월 자료」 범위의 읽기 확인 줄이 있다', F, cell(0).slice(0, 60)),
  has('C14', 'R3', '결심 대기에 불확실 원문에 기댄 기본값 줄이 있다', F, cell(1).slice(0, 60)),
  has('C15', 'R3', '결심 대기의 저장 실패 줄이 조사 결과대로 줄 번호와 함께 있다', F, '(`js/core/profile-load.js` ' + sf.profileLoad.backupOverwrittenByServerLine + '행이 기기 백업을 서버 것으로 덮는다)'),
  has('C16', 'R3', '결심 대기에 새 글꼴 줄이 있다', F, cell(4).slice(0, 40)),
  has('C17', 'R3', '결심 대기에 출시 뒤 방향 줄이 있다', F, cell(5).slice(0, 40)),
  has('C18', 'R3', '결심 대기 칸의 머리말과 앞선 줄은 그대로다', F, '| Google Play 개발자 계정 등록($25 결제·신분 확인) | 돈 |'),
  has('C19', 'R1', '완료된 지시 DIR-004 는 그대로 있다', F, '### DIR-004 — 미분화 덩어리 해체 범위 확대 (종결)'),
  not('C20', 'R1', '채우지 않은 자리표가 지시함에 남아 있지 않다', F, '【시안 명세 대기'),
  has('C21', 'R4', '측정값 파일이 있다', 'reports/TASK-ES-693/measure.json', '"captureCardBox"'),
  has('C22', 'R1', '티켓 대장에 ES-693 한 줄이 있다', 'docs/rules/TICKETS.md', '- #TASK-ES-693 | INFRA | 지시함 DIR-005 등록 — 디자인 개편 1단계'),
  has('C23', 'R2', '상민님 원문 3 이 글자 그대로 있다', F, '「작업을 시작하기 전에 3 세션의 의견을 조율해서 최상안을 만들고 각 작업을 시작해. 각 세션마다 발언권은 기본 5회 조율이 제대로 이뤄지지 않을시 최대 10회까지 진행해. 그래야 작업한 뒤에 허점이 생겨서 다시 작업하는 일이 줄어서 좋을 것 같아. 대화내용과, 협의결과, 작업결과는 쌓아서 계속 활용되도록 하고」'),
  has('C24', 'R3', '결심 대기의 저장 실패 줄에 화면 재현이 0건이라는 한계가 있다', F, '**한계: 브라우저 화면에서 재현한 것은 0건이다**'),
  has('C25', 'R3', '결심 대기에 추천 칩 동작 줄이 줄 번호와 함께 있다', F, '(`' + M.chip.file + '` ' + M.chip.startLine + '~' + M.chip.endLine + '행)'),
  not('C26', 'R3', '고쳐 쓰기 전의 저장 실패 줄이 남아 있지 않다', F, '서버 동기화 실패를 ' + sv.saveProfile.warnLines[0] + '행에서 콘솔 경고로만 남긴다'),
  has('C27', 'R5', '공용 값 묶음이 값 표의 줄 수와 함께 따로 적혀 있다', F, '**묶음 ① — 공용 꾸밈(유전자) 값**: 변수 이름과 쓰는 자리는 그대로 두고 값만 바꾼다 — `02-유전자-값.md` 의 「바뀌는 값」 표 ' + pk.gene.changed + '줄'),
  has('C28', 'R5', '기록 창 묶음이 따로 적혀 있다', F, '**묶음 ② — 홈 「오늘 기록하기」 창 한 구획**'),
  has('C29', 'R5', '완료 기준에 공용 값 묶음의 칸이 있다', F, '**[묶음 ①]** (1)'),
  has('C30', 'R5', '완료 기준에 기록 창 묶음의 칸이 있다', F, '**[묶음 ②]** (3)'),
  has('C31', 'R6', '공용 값이 닿는 넓이가 측정값대로 적혀 있다', F, '꾸밈 파일 ' + n(reach.usesOfChanged.uiCss) + '곳 · 뼈대 ' + n(reach.usesOfChanged.indexHtml) + '곳 · 제품 코드 ' + n(reach.usesOfChanged.js) + '곳에서 쓰인다'),
  has('C32', 'R6', '목록 안의 변화와 목록 밖의 회귀를 갈라 적었다', F, '목록에 든 색 · 대비 변화는 의도한 변화이고, 목록 밖의 배치 · 가독성 · 동작 변화는 회귀다.'),
  has('C33', 'R6', '범위의 기준이 줄 번호가 아니라 요소라고 적혀 있다', F, '**범위의 기준은 줄 번호가 아니라 요소(이름표)다**'),
  has('C34', 'R6', '「명세대로 구현됨」과 「기록 저장이 안전함」을 따로 적으라고 되어 있다', F, '**「명세대로 구현됨」과 「기록 저장이 안전함」은 PR 에 따로 적는다**'),
  has('C35', 'R6', '저장 처리 파일은 담당 하나가 순서대로 고친다고 적혀 있다', F, '**저장 처리 파일은 담당 하나가 순서대로 고친다.**'),
  has('C36', 'R6', '못 잰 것을 남길 체크리스트의 자리가 적혀 있다', F, '「03 · 측정·출시·운영 체크리스트」 3절의 QA02 · QA03 · QA12 · QA19'),
  has('C37', 'R7', '저장 단추의 글이 있는 자리가 측정값대로 적혀 있다', F, '저장 단추의 글은 index.html ' + V['t1.line'] + '행 1곳(js 0곳)'),
  has('C38', 'R7', '제품 코드가 직접 적는 꾸밈의 자리 수가 측정값대로 적혀 있다', F, '세 파일 ' + ss.places + '곳 있고'),
  has('C39', 'R4', '꾸러미의 창 명세가 저장소에 있다', PKG + '03-오늘-기록하기-창-명세.md', '# 오늘 기록하기 창(#captureCardBox) — 출시 전 시범 구획의 구현용 명세'),
  has('C40', 'R4', '꾸러미의 유전자 값 표가 저장소에 있다', PKG + '02-유전자-값.md', '## 바뀌는 값'),
  has('C41', 'R4', '꾸러미의 확정 기준 기본값이 저장소에 있다', PKG + '01-확정-기준-기본값.md', '# 대표 홈 시안 — 확정 기준 판의 기본값'),
  has('C42', 'R4', '저장 실패 조사의 사본이 근거 폴더에 있다', 'reports/TASK-ES-693/save-failure-investigation.md', '**한계: 브라우저 화면 재현은 0건이다.**'),
];
const out = { task: 'TASK-ES-693', requirementsSource: 'docs/specs/REQ-TASK-ES-693-DIR-005-DESIGN-PILOT.md',
  requirements: [
    { id: 'R1', text: '지시함 「열린 지시」에 DIR-005(디자인 개편 1단계)를 올린다 — 범위 · 건드리지 않는 것 · 붙이는 방식 · 판정 기준 · 검사 · 기록 · 일정 · 완료 기준. 줄 번호와 숫자는 지금 코드에서 잰다.' },
    { id: 'R2', text: '결심 기록에 상민님 원문 셋을 글자 그대로 적고, 지휘 세션의 해석 · 세션끼리의 합의와 섞지 않는다. 작성자가 채팅을 보지 못했다는 점을 적는다.' },
    { id: 'R3', text: '「결심 대기」 표에 여섯 줄을 올린다(「9월 자료」의 읽기 · 불확실 원문에 기댄 기본값 · 기록 저장 실패 — 조사 결과와 한계 · 추천 칩의 동작 · 새 글꼴 · 출시 뒤 방향).' },
    { id: 'R4', text: '근거 자료를 저장소에 둔다(시안의 확정 기준 판 · 구현용 명세 · 지금 모습의 측정값 · 저장 실패 조사의 사본). 상민님 말씀 원문 모음은 볼트 경로로 가리킨다.' },
    { id: 'R5', text: '지시를 공용 값 묶음과 기록 창 묶음으로 갈라 적는다 — 묶음마다 범위 · 닿는 파일 · 완료 기준이 따로 서게.' },
    { id: 'R6', text: '로드맵 세션의 검토 의견을 반영한다 — 범위의 기준은 요소 · 「예상 변화 목록」과 그 밖의 회귀를 가름 · 「명세대로 구현됨」과 「저장이 안전함」을 따로 기록 · 저장 처리 파일은 담당 하나가 순서대로 · 못 잰 것을 남길 체크리스트의 자리.' },
    { id: 'R7', text: '기록 창 묶음이 js 파일에 닿는지 판단할 측정값을 적는다 — 저장 단추의 글 · 「기록 중…」 · 저장 뒤 알림 글의 자리와, 제품 코드가 구획의 요소에 꾸밈을 직접 적는 자리.' },
  ],
  outOfScopeReports: [ { text: '이 PR 은 지시를 올리기만 한다. 유전자·세포막 파일을 만드는 일, 화면을 바꾸는 일은 이 지시가 병합된 뒤 새 작업번호로 한다.', cannotBecause: 'out-of-scope-feature' } ],
  claims };
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const bad = claims.filter(c => { const p = path.join(ROOT, c.check.file); const s = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; return (c.check.type === 'codeContains') !== s.includes(c.check.text); }).map(c => c.id);
const holes = (doc.match(/【[^】]*】/g) || []);
console.log(JSON.stringify({ openDirectives: otherIds.concat(['DIR-005']), rowsInserted: rows.length, rowsReplaced: replaced, claims: claims.length, shortTexts: claims.filter(c => c.check.text.length < 4).map(c => c.id), notTrueNow: bad, placeholdersLeft: holes.length }));
