'use strict';
// 기본 확인창 → 앱 바텀시트 2단계 시험 (#TASK-ES-376): index.html 인라인 스크립트의 확인창 19곳이 공용 통로 ui.confirm(js/core/confirm.js, #TASK-ES-374)으로 묻는다.
// - 정적: 19곳이 모두 `OurgoalCapabilities.call('ui.confirm', 예전 문구)` 로 바뀌었고(문구 글자 그대로), index.html 의 기본 확인창은 목표 탭 2곳만 남았다.
// - 동작: index.html 에서 실제 처리기 소스를 그대로 잘라 돌린다 — 휴지통 영구 삭제·비우기, 사용자 차단, 샘플 정리.
//   확인 → 뒤 동작 1회, 취소 → 0회(저장·원격 호출·화면 갱신 없음).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
/* #TASK-ES-441 확인창 19곳 줄 세기는 인라인 합본(원문 맨 앞 + js/tabs 세포)에서 센다 — 확인창이 세포로 옮겨 가도 같은 줄을 찾는다 */
const HTML_CELLS = require('./helpers/inline-bundle').withInlineCells(HTML);
/* #TASK-ES-488 인라인 어려움 구역 H2 선행: 「기본 확인창은 루틴 삭제 2곳만 남는다」 검사는 index.html 원문 + 그 2곳이 옮겨 갈 목표 탭 루틴 화면 세포
   (js/tabs/goals/routine-screen.js — 있을 때만, 생성기 접두 L. 만 뗌)에서 센다. 이 시험지가 쓰일 때 이미 세포였던 파일(goal-detail-events.js 등)의
   확인창은 처음부터 이 검사 범위 밖이었으므로 합본 전체가 아니라 옮겨 갈 파일만 더한다. 기대값은 그대로다. */
const ROUTINE_CELL = path.join(ROOT, 'js', 'tabs', 'goals', 'routine-screen.js');
/* #TASK-ES-527 인라인 3단계 기관 선행: 루틴 삭제 2곳 중 상세·편집 창(openRoutineDetailModal)은 목표 탭 세포 js/tabs/goals/routine-detail-modal.js 로
   옮겨 간다 — 그 파일도(있을 때만, 생성기 접두 L. 만 뗌) 같은 방식으로 더한다. 기대값은 그대로다. */
const ROUTINE_DETAIL_CELL = path.join(ROOT, 'js', 'tabs', 'goals', 'routine-detail-modal.js');
const HTML_ROUTINE = HTML + (fs.existsSync(ROUTINE_CELL) ? '\n' + fs.readFileSync(ROUTINE_CELL, 'utf8').replace(/(^|[^A-Za-z0-9_$.])L\.(?=[A-Za-z_$])/g, '$1') : '')
  + (fs.existsSync(ROUTINE_DETAIL_CELL) ? '\n' + fs.readFileSync(ROUTINE_DETAIL_CELL, 'utf8').replace(/(^|[^A-Za-z0-9_$.])L\.(?=[A-Za-z_$])/g, '$1') : '');
const caps = require(path.join(ROOT, 'js/core/capabilities.js'));
const C = require(path.join(ROOT, 'js/core/confirm.js'));

let n = 0;
async function check(title, fn) {
  C.reset();
  await fn();
  C.reset();
  n++;
  console.log('  ok · ' + title);
}
const tick = () => new Promise(r => setImmediate(r));

// 정본 openBottomSheetConfirm 흉내: 받은 본문을 적어 두고, 시험이 확인/취소를 누른다.
function attachSheet() {
  const calls = [];
  C.attach(function (title, message, okText, cancelText, onOk, onCancel) {
    calls.push({ message: message, ok: onOk, cancel: onCancel });
  });
  return calls;
}

// index.html 에서 `head` 로 시작하는 함수 소스를 괄호 짝을 맞춰 잘라 온다(문자열·주석 안 괄호는 건너뛴다).
// #TASK-ES-489: 잘라 오는 원본을 인라인 합본(HTML_CELLS — 원문 맨 앞 + js/tabs 세포 + js/core 이전 세포, L. 접두 제거)으로 넓혔다 — 휴지통 함수가 기관 세포 js/core/trash-bin.js 로 옮겨 가도(#TASK-ES-482) 같은 글자를 찾는다. 단언·기대값 그대로.
function sliceFunction(head) {
  const start = HTML_CELLS.indexOf(head);
  assert.ok(start >= 0, 'index.html 에 ' + head + ' 가 있다');
  assert.strictEqual(HTML_CELLS.indexOf(head, start + 1), -1, head + ' 는 한 곳뿐이다');
  let i = HTML_CELLS.indexOf('{', start), depth = 0, q = null;
  for (; i < HTML_CELLS.length; i++) {
    const ch = HTML_CELLS[i], nx = HTML_CELLS[i + 1];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
    if (ch === '/' && nx === '/') { i = HTML_CELLS.indexOf('\n', i); continue; }
    if (ch === '/' && nx === '*') { i = HTML_CELLS.indexOf('*/', i) + 1; continue; }
    if (ch === '\'' || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return HTML_CELLS.slice(start, i + 1); }
  }
  throw new Error('괄호 짝을 못 찾음: ' + head);
}

// 잘라 온 처리기를 주어진 이름들만 보이는 범위에서 만든다.
function build(src, names, scope) {
  const body = '"use strict";\n' + src + '\nreturn ' + names.retName + ';';
  return new Function(...names.deps, body)(...names.deps.map(k => scope[k]));
}

const SITES = [
  ['등록하신 프롬프트를 삭제하시겠습니까?', "        if(!(await OurgoalCapabilities.call('ui.confirm', '등록하신 프롬프트를 삭제하시겠습니까?'))) return;"],
  ['계정 데이터 초기화', "    if(!(await OurgoalCapabilities.call('ui.confirm', '이 계정의 모든 목표·기록·설정을 초기화할까요? 되돌릴 수 없어요.'))) return;"],
  ['휴지통 영구 삭제', "    if(!(await OurgoalCapabilities.call('ui.confirm', '\"' + item.title + '\" 항목을 영구 삭제할까요?\\n더 이상 복구할 수 없습니다.'))) return;"],
  ['휴지통 비우기', "    if(!(await OurgoalCapabilities.call('ui.confirm', '휴지통을 완전히 비울까요?\\n보관 중인 ' + trash.length + '개 항목이 모두 영구 삭제되며 복구할 수 없습니다.'))) return;"],
  ['캘린더 배경사진 초기화', "          if(await OurgoalCapabilities.call('ui.confirm', '이날의 배경사진을 초기화하고 기본 배경으로 되돌릴까요?')){"],
  ['캘린더 일정 휴지통(날짜 허브·편집 창 2곳)', "            if(!(await OurgoalCapabilities.call('ui.confirm', '이 일정을 휴지통으로 이동할까요?\\n7일간 보관되며 언제든 원복할 수 있습니다.'))) return;", 2],
  ['피드백 설정 삭제', "          if(!(await OurgoalCapabilities.call('ui.confirm', '‘' + (target.title || '이 피드백') + '’ 설정을 보관함에서 삭제하시겠습니까?'))) return;"],
  ['참고자료 삭제', "            if(!(await OurgoalCapabilities.call('ui.confirm', '이 참고자료를 삭제할까요?'))) return;"],
  ['사용자 차단', "    if(!(await OurgoalCapabilities.call('ui.confirm', displayName + '님을 차단할까요?\\r\\n차단하면 내 화면에서 이 사용자의 게시물과 댓글이 숨겨집니다.'))) return;"],
  ['수준별 조 삭제', "        if(!(await OurgoalCapabilities.call('ui.confirm', '정말 \"' + lg.name + '\" 조와 속한 모든 목표/할일을 삭제할까요?'))) return;"],
  ['팀 댓글 신고', "          if(!(await OurgoalCapabilities.call('ui.confirm', '이 댓글을 신고할까요? 신고가 여러 건 쌓이면 자동으로 숨겨져요.'))) return;"],
  ['팀 목표 삭제', "          if(!(await OurgoalCapabilities.call('ui.confirm', '정말 \"' + tg.title + '\" 팀 목표를 삭제할까요?'))) return;"],
  ['기록 카드 휴지통', "          if(!(await OurgoalCapabilities.call('ui.confirm', '이 기록을 휴지통으로 이동할까요?\\n7일간 보관되며 언제든 원복할 수 있습니다.'))) return;"],
  ['샘플 정리', "    var confirmed = await OurgoalCapabilities.call('ui.confirm', '체험용 샘플 데이터 ' + sampleCount + '건만 말끔히 삭제할까요?\\n(내가 직접 적은 기록은 100% 안전하게 유지됩니다)');"],
  ['피드 게시물 신고', "        if(!(await OurgoalCapabilities.call('ui.confirm', '이 게시물을 신고할까요? 신고가 여러 건 쌓이면 자동으로 숨겨져요.'))) return;"],
  ['마니또 정체 공개 제안', "        if(!(await OurgoalCapabilities.call('ui.confirm', '정체 공개를 제안할까요? 상대도 수락해야 서로 프로필이 열려요.'))) return;"],
  ['마니또 다시 배정', "      if(!(await OurgoalCapabilities.call('ui.confirm', '지금 마니또와의 응원 기록은 유지되고, 새 마니또 3명이 배정돼요. 진행할까요?'))) return;"],
  ['마니또 그만두기', "      if(!(await OurgoalCapabilities.call('ui.confirm', '마니또를 그만둘까요? 보낸 응원 기록은 남아요.'))) return;"]
];

function countLine(line) {
  const lines = HTML_CELLS.split(/\r?\n/);
  return lines.filter(l => l === line).length;
}

(async () => {
  console.log('[core/confirm 2단계] index.html 확인창 19곳 → 공용 통로 ui.confirm');

  await check('19곳이 모두 공용 통로 ui.confirm 으로 예전 문구 그대로 묻는다', () => {
    let total = 0;
    SITES.forEach(([name, line, times]) => {
      const c = countLine(line);
      assert.strictEqual(c, times || 1, name + ' 줄이 ' + (times || 1) + '곳');
      total += c;
    });
    assert.strictEqual(total, 19);
  });

  await check('index.html 인라인 스크립트의 기본 확인창은 목표 탭 루틴 삭제 2곳만 남는다(이번 범위 밖)', () => {
    const lines = HTML_ROUTINE.split(/\r?\n/).filter(l => !/^\s*(\/\/|\/?\*)/.test(l));
    const left = lines.filter(l => /(?:^|[^.\w$])confirm\(|\bwindow\.confirm\(/.test(l));
    assert.deepStrictEqual(left.map(l => l.trim()), [
      "if(!confirm('이 루틴을 삭제하시겠습니까?')) return;",
      "if(!confirm('이 루틴을 삭제하시겠습니까?')) return;"
    ]);
  });

  await check('공용 확인창 통로가 index.html 인라인 스크립트보다 먼저 로드된다', () => {
    const conf0 = HTML.indexOf('<script src="js/core/confirm.js"></script>');
    const caps0 = HTML.indexOf('<script src="js/core/capabilities.js"></script>');
    const inline0 = HTML.indexOf("if(!(await OurgoalCapabilities.call('ui.confirm', ");
    assert.ok(caps0 > 0 && conf0 > caps0, 'capabilities.js → confirm.js 순서');
    assert.ok(inline0 > conf0, '처리기는 confirm.js 뒤');
    assert.strictEqual(caps.request('ui.confirm'), C.confirm, '통로가 등록돼 있다');
  });

  await check('휴지통 영구 삭제(permanentDeleteFromTrash): 취소 → 그대로·저장 0회 · 확인 → 그 항목만 지우고 저장 1회', async () => {
    const sheet = attachSheet();
    const state = { profile: { id: 'guest-1', trash: [{ id: 't1', title: '<b>체크인</b>' }, { id: 't2', title: '일정' }] } };
    let saves = 0;
    const toasts = [];
    const fn = build(sliceFunction('async function permanentDeleteFromTrash(trashId){'), { retName: 'permanentDeleteFromTrash', deps: ['state', 'getTrashList', 'saveProfile', 'toast', 'localStorage', 'OurgoalCapabilities'] }, {
      state, getTrashList: () => state.profile.trash.slice(), saveProfile: async () => { saves++; }, toast: m => toasts.push(m),
      localStorage: { setItem() {} }, OurgoalCapabilities: caps
    });
    let p = fn('t1');
    await tick();
    assert.strictEqual(sheet[0].message, '&quot;&lt;b&gt;체크인&lt;/b&gt;&quot; 항목을 영구 삭제할까요?\n더 이상 복구할 수 없습니다.', '예전 문구를 글자 그대로');
    sheet[0].cancel();
    await p;
    assert.deepStrictEqual(state.profile.trash.map(x => x.id), ['t1', 't2'], '취소 → 그대로');
    assert.strictEqual(saves, 0, '취소 → 저장 0회');
    p = fn('t1');
    await tick();
    sheet[1].ok();
    await p;
    assert.deepStrictEqual(state.profile.trash.map(x => x.id), ['t2'], '확인 → t1 만 지움');
    assert.strictEqual(saves, 1, '확인 → 저장 1회');
    assert.deepStrictEqual(toasts, ['항목을 완전히 영구 삭제했습니다']);
  });

  await check('휴지통 비우기(emptyTrash): 취소 → 그대로 · 확인 → 비우고 저장 1회', async () => {
    const sheet = attachSheet();
    const state = { profile: { id: 'guest-1', trash: [{ id: 't1' }, { id: 't2' }] } };
    let saves = 0;
    const fn = build(sliceFunction('async function emptyTrash(){'), { retName: 'emptyTrash', deps: ['state', 'getTrashList', 'saveProfile', 'toast', 'localStorage', 'OurgoalCapabilities'] }, {
      state, getTrashList: () => state.profile.trash.slice(), saveProfile: async () => { saves++; }, toast() {}, localStorage: { setItem() {} }, OurgoalCapabilities: caps
    });
    let p = fn();
    await tick();
    assert.strictEqual(sheet[0].message, '휴지통을 완전히 비울까요?\n보관 중인 2개 항목이 모두 영구 삭제되며 복구할 수 없습니다.');
    sheet[0].cancel();
    await p;
    assert.strictEqual(state.profile.trash.length, 2);
    assert.strictEqual(saves, 0);
    p = fn();
    await tick();
    sheet[1].ok();
    await p;
    assert.strictEqual(state.profile.trash.length, 0, '확인 → 비움');
    assert.strictEqual(saves, 1);
  });

  await check('사용자 차단(blockUser): 취소 → 차단 목록·원격 저장 0회 · 확인 → 목록 1건·원격 1회·저장 1회', async () => {
    const sheet = attachSheet();
    const state = { profile: { id: 'me', settings: {} }, activeTab: 'home' };
    const inserts = [];
    let saves = 0;
    const sb = { from(t) { return { insert(row) { inserts.push([t, row]); return Promise.resolve({}); } }; } };
    const fn = build(sliceFunction('async function blockUser(userId, userName){'), { retName: 'blockUser', deps: ['state', 'toast', 'nowISO', 'sb', 'saveProfile', 'document', 'renderCommFeed', 'renderTeamGoalsScreen', 'OurgoalCapabilities'] }, {
      state, toast() {}, nowISO: () => '2026-10-05T00:00:00.000Z', sb, saveProfile: async () => { saves++; }, document: {}, renderCommFeed() {}, renderTeamGoalsScreen() {}, OurgoalCapabilities: caps
    });
    let p = fn('u2', '민수');
    await tick();
    assert.strictEqual(sheet[0].message, '민수님을 차단할까요?\r\n차단하면 내 화면에서 이 사용자의 게시물과 댓글이 숨겨집니다.');
    sheet[0].cancel();
    await p;
    assert.strictEqual((state.profile.settings.blockedUsers || []).length, 0, '취소 → 차단 0건');
    assert.strictEqual(inserts.length + saves, 0, '취소 → 원격·저장 0회');
    p = fn('u2', '민수');
    await tick();
    sheet[1].ok();
    await p;
    assert.deepStrictEqual(state.profile.settings.blockedUsers.map(b => b.id), ['u2']);
    assert.deepStrictEqual(inserts, [['user_blocks', { blocker_id: 'me', blocked_id: 'u2' }]]);
    assert.strictEqual(saves, 1);
  });

  await check('샘플 정리(purgeSampleRecordsOneClick): 취소 → 샘플 그대로 · 확인 → 내 기록만 남기고 저장 1회', async () => {
    const sheet = attachSheet();
    const mine = { id: 'r1', text: '내 기록' };
    const state = { profile: { records: [mine, { id: 's1', isSample: true }, { id: 's2', isSample: true }] } };
    let saves = 0, renders = 0;
    const window = {};
    const src = sliceFunction('window.purgeSampleRecordsOneClick = async function(){');
    new Function('window', 'state', 'saveProfile', 'renderRecordsScreen', 'toast', 'triggerHapticFeedback', 'dispatchFullViewPropagation', 'OurgoalCapabilities', '"use strict";\n' + src + ';')(
      window, state, async () => { saves++; }, () => { renders++; }, () => {}, () => {}, () => {}, caps);
    let p = window.purgeSampleRecordsOneClick();
    await tick();
    assert.strictEqual(sheet[0].message, '체험용 샘플 데이터 2건만 말끔히 삭제할까요?\n(내가 직접 적은 기록은 100% 안전하게 유지됩니다)');
    sheet[0].cancel();
    await p;
    assert.strictEqual(state.profile.records.length, 3, '취소 → 그대로');
    assert.strictEqual(saves + renders, 0, '취소 → 저장·다시 그리기 0회');
    p = window.purgeSampleRecordsOneClick();
    await tick();
    sheet[1].ok();
    await p;
    assert.deepStrictEqual(state.profile.records, [mine], '확인 → 내 기록만');
    assert.strictEqual(saves, 1);
    assert.strictEqual(renders, 1);
  });

  console.log('[core/confirm 2단계] ' + n + '건 통과');
})().catch(e => { console.error(e); process.exitCode = 1; });
