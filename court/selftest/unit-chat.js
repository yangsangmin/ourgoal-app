'use strict';
// 법정 자가시험 — 단위 시험(법정 고정 댓글의 이력과 “누가 고쳤는가”). GitHub 조회는 전부 가짜로 바꿔 끼운다(통신 없음).
// 지키려는 것: 앞선 심사에서 “안 됨”이던 지시는 법정이 다시 확인해 줄 때에만 풀린다 / 법정 기록을 법정이 아닌 계정이 고쳤으면 그 기록을 믿지 않는다 / 못 읽었으면 “문제없음”이 아니라 “못 읽었다”고 답한다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const chat = require('../chat');
const claimsLib = require('../claims');

const sha = c => String(c).repeat(40).slice(0, 40);
const BOT_USER = { login: chat.BOT, type: 'Bot' };
const FOUR = ['**판정: 통과 — 머리말**  ', '**상민님이 하실 일: 하실 일 원문**  ', '**작업자가 적어 낸 지시 항목 1건 중: 화면에서 눌러 확인 1**  ', '**심사 대상 커밋 aaaaaaa (기준 0000000) · 판정번호 ABCDEF12 · GitHub 에서 법정이 직접 실행**  '];
// 법정이 PR 에 다는 고정 댓글의 모양(표식 → 숨은 두 줄 → 굵은 네 줄 → 본문).
function pinnedBody(headSha, history, four) { return [chat.MARKER, '<!-- court-meta head=' + headSha + ' verdictId=ABCDEF12 run=1 -->', chat.historyLine(history || chat.emptyHistory())].concat(four || FOUR, ['', '본문']).join('\n'); }
const verdictWith = reqs => ({ rollup: { reqs }, claims: [] });

const TESTS = [
  {
    id: 'U-chat-history', title: '법정 댓글의 이력: 앞선 심사에서 “안 됨”이던 지시는 법정의 재확인으로만 풀리고, 같은 커밋의 재심사는 횟수를 올리지 않는다',
    run(t) {
      const A = sha('a'), B = sha('b');
      t.eq(chat.reqKey('R1'), 'R1', '안전한 지시 id 는 그대로'); t.eq(chat.reqKey('__proto__'), '__proto__', '객체 열쇠처럼 생긴 id 도 글자일 뿐이다');
      t.ok(/^x[0-9a-f]{12}$/.test(chat.reqKey('R1 --> <!-- x')) && /^x[0-9a-f]{12}$/.test(chat.reqKey('a--b')), '주석을 끊을 수 있는 글자가 든 id 는 해시로 적는다'); t.eq(chat.reqKey(7), '7', '글자가 아닌 id 는 글자로 바꿔 본다');
      t.eq(JSON.stringify(chat.parseHistory('이력 줄이 없는 옛 댓글')), JSON.stringify(chat.emptyHistory()), '이력 줄이 없으면 빈 이력');
      const dmg = chat.parseHistory(chat.MARKER + '\n<!-- court-history {"v":1,"rejects":-5,"shas":[],"failed":[]} -->');
      t.ok(dmg.damaged === true && dmg.rejects === 0, '모양이 틀린 이력 줄은 빈 이력 + 손상 표시');
      const h0 = { v: 1, rejects: 2, shas: [A.slice(0, 12)], failed: [['R1', 'b'], ['R2', 's']] };
      t.eq(JSON.stringify(chat.parseHistory(pinnedBody(A, h0))), JSON.stringify(h0), '이력 줄 왕복');
      // 이미 있는 댓글에서 이력 한 줄만 바꾼다(굵은 네 줄은 그대로)
      const swapped = chat.withHistory(pinnedBody(A, h0), { ...h0, rejects: 3 });
      t.ok(chat.parseHistory(swapped).rejects === 3 && FOUR.every(l => swapped.includes(l)) && (swapped.match(/court-history/g) || []).length === 1, '이력 줄만 바뀐다');
      const noLine = [chat.MARKER, '<!-- court-meta head=' + A + ' verdictId=ABCDEF12 run=1 -->'].concat(FOUR).join('\n');
      t.eq(chat.withHistory(noLine, h0).split('\n')[2], chat.historyLine(h0), '이력 줄이 없던 댓글에는 court-meta 줄 바로 아래에 넣는다');
      // 다음 이력
      const failing = { rollup: { reqs: [{ id: 'R1', bucket: '안 됨' }, { id: 'R2', bucket: '안 됨' }, { id: 'R3', bucket: '화면에서 눌러 확인' }] }, claims: [{ req: 'R1', kind: 'behavior', outcome: '아직 안 됨' }, { req: 'R2', kind: 'static', outcome: '아직 안 됨' }] };
      const n1 = chat.nextHistory(chat.emptyHistory(), { sha: A, rejected: true, verdict: failing });
      t.eq(JSON.stringify(n1), JSON.stringify({ v: 1, rejects: 1, shas: [A.slice(0, 12)], failed: [['R1', 'b'], ['R2', 's']] }), '돌려보냄 1회 · 화면 주장이 안 된 지시는 b, 글자 확인 주장만 안 된 지시는 s');
      t.eq(chat.nextHistory(n1, { sha: A, rejected: true, verdict: failing }).rejects, 1, '같은 커밋을 다시 심사한 것은 세지 않는다');
      t.eq(chat.nextHistory(n1, { sha: B, rejected: true, verdict: failing }).rejects, 2, '새 커밋의 돌려보냄은 센다');
      t.eq(chat.nextHistory(n1, { sha: 'not-a-sha', rejected: true, verdict: null }).rejects, 1, '커밋을 모르는 판정은 세지 않는다');
      const fixed = chat.nextHistory(n1, { sha: B, rejected: false, verdict: verdictWith([{ id: 'R1', bucket: '화면에서 눌러 확인' }, { id: 'R2', bucket: '글자만 확인(이 종류는 그걸로 충분)' }]) });
      t.eq(JSON.stringify(fixed.failed), '[]', '법정이 다시 확인해 주면 풀린다(글자 확인 주장만 안 됐던 지시는 글자 확인이 충분한 칸으로도 풀린다)');
      const dodge = chat.nextHistory(n1, { sha: B, rejected: false, verdict: verdictWith([{ id: 'R1', bucket: '글자만 확인(이 종류는 그걸로 충분)' }, { id: 'R2', bucket: '확인 못 함' }]) });
      t.eq(JSON.stringify(dodge.failed), JSON.stringify([['R1', 'b'], ['R2', 's']]), '화면 주장이 안 됐던 지시는 글자 확인으로 풀리지 않고, “확인 못 함”으로 바꿔도 풀리지 않는다');
      const addOnly = chat.nextHistory({ v: 1, rejects: 1, shas: [], failed: [['R1', 'b']] }, { sha: A, rejected: true, addOnly: true, verdict: verdictWith([{ id: 'R1', bucket: '화면에서 눌러 확인' }, { id: 'R2', bucket: '안 됨' }]) });
      t.eq(JSON.stringify(addOnly.failed), JSON.stringify([['R1', 'b'], ['R2', 'b']]), '최신이 아닌 옛 커밋의 판정은 “안 됨”을 더하기만 한다(옛 판정을 근거로 빼지 않는다)');
      // 확인 없이 바뀐 지시
      const hist = { v: 1, rejects: 1, shas: [], failed: [['R1', 'b'], ['R2', 's']] };
      const l = v => chat.launderedReqs(hist, v).map(x => x.id + ':' + x.now).join(',');
      t.eq(l(verdictWith([{ id: 'R1', bucket: '글자만 확인(이 종류는 그걸로 충분)' }, { id: 'R2', bucket: '코드만 확인(화면에서는 안 봄)' }])), 'R1:글자만 확인(이 종류는 그걸로 충분),R2:코드만 확인(화면에서는 안 봄)', '확인 없이 다른 칸으로 바뀐 지시');
      t.eq(l(verdictWith([{ id: 'R1', bucket: '안 됨' }, { id: 'R2', bucket: '안 됨' }])), '', '여전히 “안 됨”인 지시는 바뀐 것이 아니다');
      t.eq(l(verdictWith([{ id: 'R1', bucket: '화면에서 눌러 확인' }, { id: 'R2', bucket: '글자만 확인(이 종류는 그걸로 충분)' }])), '', '법정이 확인해 준 지시');
      t.eq(l({ rollup: null }), 'R1:지시 목록에서 사라짐,R2:지시 목록에서 사라짐', '주장 파일이 통째로 사라지면 전부 “사라짐”으로 잡힌다');
      // 주장 판정기(claims.js)가 내는 글자와 이 모듈의 상수가 같아야 한다(한쪽만 고치면 “안 됨”을 알아보지 못한다)
      const O = claimsLib.OUTCOME;
      const r = claimsLib.rollup({ requirements: [{ id: 'R1', text: 'a' }, { id: 'R2', text: 'b' }, { id: 'R3', text: 'c' }] }, [
        { id: 'C1', req: 'R1', outcome: O.CONFIRMED, meetsFloor: true, notes: [] }, { id: 'C2', req: 'R2', outcome: O.NOT_WORKING, meetsFloor: false, notes: [] }, { id: 'C3', req: 'R3', outcome: O.TEXT_ONLY, meetsFloor: true, notes: [] }]);
      t.eq(r.reqs[0].bucket, chat.BUCKET_CONFIRMED, '칸 이름: 화면에서 눌러 확인'); t.eq(r.reqs[1].bucket, chat.BUCKET_FAILED, '칸 이름: 안 됨'); t.eq(r.reqs[2].bucket, chat.BUCKET_TEXT_ENOUGH, '칸 이름: 글자만 확인(충분)');
      t.eq(JSON.stringify(chat.FAILED_OUTCOMES.slice().sort()), JSON.stringify([O.NOT_WORKING, O.BROKE].sort()), '“안 됨”으로 치는 주장 결과');
      t.eq(chat.ESCALATE_AT, 3, '돌려보냄이 이만큼 쌓이면 작업자는 멈추고 보고한다');
    },
  },
  {
    id: 'U-chat-comment', title: '법정 댓글 읽기: 법정 계정이 쓴 표식 댓글만 고르고, 굵은 네 줄은 줄 번호가 아니라 표식 아래 연달아 나오는 굵은 줄로 읽는다',
    run(t) {
      const A = sha('a');
      const p = chat.parseVerdictComment(pinnedBody(A));
      t.ok(!!p && p.head === A && p.verdictId === 'ABCDEF12' && p.run === '1' && p.lines.length === 4 && p.lines[0] === '판정: 통과 — 머리말', '굵은 네 줄: ' + JSON.stringify(p));
      t.eq(chat.parseVerdictComment(pinnedBody(A).replace(chat.MARKER, '<!-- other -->')), null, '표식이 없으면 믿지 않는다');
      t.eq(chat.parseVerdictComment(pinnedBody(A, null, [FOUR[0], '끼어든 줄', FOUR[1], FOUR[2], FOUR[3]])), null, '굵은 줄 사이에 다른 줄이 끼면 믿지 않는다');
      t.eq(chat.parseVerdictComment(pinnedBody(A, null, ['**통과**  ', FOUR[1], FOUR[2], FOUR[3]])), null, '첫 줄이 “판정: ”으로 시작하지 않으면 믿지 않는다');
      t.eq(chat.parseVerdictComment(pinnedBody('zzz')), null, '숨은 줄(court-meta)의 모양이 다르면 믿지 않는다');
      const enc = chat.parseVerdictComment(pinnedBody(A, null, [FOUR[0], '**상민님이 하실 일: &#64;someone &lt;b>**  ', FOUR[2], FOUR[3]]));
      t.eq(enc && enc.lines[1], '상민님이 하실 일: @someone <b>', '게시할 때 바꿔 둔 두 글자만 되돌린다');
      const comments = [{ id: 1, user: { login: 'someone', type: 'User' }, body: pinnedBody(A) }, { id: 2, user: { login: chat.BOT, type: 'User' }, body: pinnedBody(A) }, { id: 3, user: BOT_USER, body: '표식 없는 봇 댓글' }, { id: 4, user: BOT_USER, body: pinnedBody(A) }];
      t.eq((chat.findPinned(comments) || {}).id, 4, '사람 계정이 같은 표식으로 단 댓글·이름만 같은 계정은 고르지 않는다');
      t.eq(chat.findPinned([]), null, '댓글이 없으면 null');
      t.eq(JSON.stringify(chat.parseTarget('#344')), JSON.stringify({ kind: 'pr', value: 344 }), '대상: PR 번호'); t.eq(chat.parseTarget('abc'), null, '대상: 너무 짧은 sha'); t.eq((chat.parseTarget('ABCDEF1') || {}).value, 'abcdef1', '대상: sha');
    },
  },
  {
    id: 'U-chat-editor', title: '법정 기록을 누가 고쳤는가: 법정이 아닌 계정이 고친 댓글은 믿지 않고, 그 표시는 그 PR 에서 지워지지 않으며, 못 읽었으면 “안 고쳐졌다”고 하지 않는다',
    run(t) {
      const T = d => JSON.stringify(chat.editorTrust(d));
      const node = (editor, lastEditedAt) => ({ node: { editor, lastEditedAt: lastEditedAt === undefined ? 'x' : lastEditedAt } });
      t.eq(T(node(null, null)), '{"known":true,"by":null}', '한 번도 안 고친 댓글');
      t.eq(T(node({ __typename: 'Bot', login: 'github-actions' })), '{"known":true,"by":null}', '법정 계정이 고친 댓글');
      t.eq(T(node({ __typename: 'User', login: 'worker-1' })), '{"known":true,"by":["worker-1","u"]}', '사람 계정이 고친 댓글');
      t.eq(T(node({ __typename: 'Bot', login: 'vercel' })), '{"known":true,"by":["vercel","o"]}', '다른 봇이 고친 댓글');
      t.eq(T(node({ __typename: 'User', login: 'github-actions' })), '{"known":true,"by":["github-actions","u"]}', '이름만 같은 사람 계정');
      t.eq(T(node(null, '2026-01-01T00:00:00Z')), '{"known":true,"by":["?","o"]}', '고친 기록은 있는데 누구인지 안 나옴');
      t.eq(T(node({ __typename: 'User', login: 'a --> <b' })), '{"known":true,"by":["?","u"]}', '주석을 끊는 글자가 든 계정 이름');
      for (const bad of [null, {}, { node: null }, { node: {} }, { node: { editor: 'x' } }]) t.eq(chat.editorTrust(bad).known, false, '응답 모양이 다르면 알 수 없음(조회 실패로 다룬다): ' + JSON.stringify(bad));
      t.eq(chat.editedByText(['worker-1', 'u']), '사람 계정(worker-1)', '찍는 글자(사람)'); t.eq(chat.editedByText(['vercel', 'o']), '법정이 아닌 계정(vercel)', '찍는 글자(그 밖)'); t.eq(chat.editedByText(['?', 'o']), '법정이 아닌 계정(알 수 없음)', '찍는 글자(모름)'); t.eq(chat.editedByText('x'), '법정이 아닌 계정(알 수 없음)', '찍는 글자(모양이 틀림)');
      const d = chat.distrust({ v: 1, rejects: 1, shas: ['a'.repeat(12)], failed: [['R1', 'b']] }, ['worker-1', 'u']);
      t.ok(d.rejects === chat.ESCALATE_AT && JSON.stringify(d.editedBy) === '["worker-1","u"]' && d.failed.length === 1 && d.shas.length === 1, '믿지 않기: 누적을 3으로 올리고 고친 계정을 남긴다(안 됨 목록은 그대로): ' + JSON.stringify(d));
      t.eq(chat.distrust({ v: 1, rejects: 7, shas: [], failed: [] }, ['x', 'u']).rejects, 7, '이미 3회를 넘었으면 내리지 않는다');
      t.eq(JSON.stringify(chat.distrust(d, ['other', 'u']).editedBy), '["worker-1","u"]', '이미 남은 계정이 있으면 처음 것을 둔다');
      const back = chat.parseHistory(chat.MARKER + '\n' + chat.historyLine(d));
      t.ok(!back.damaged && JSON.stringify(back.editedBy) === '["worker-1","u"]' && back.rejects === 3, '이력 줄 왕복에 고친 계정이 남는다');
      t.ok(!chat.historyLine(chat.emptyHistory()).includes('editedBy'), '고쳐진 적 없는 PR 의 이력 줄에는 그 칸이 없다');
      t.eq(chat.parseHistory(chat.MARKER + '\n<!-- court-history {"v":1,"rejects":0,"shas":[],"failed":[],"editedBy":["a b","u"]} -->').damaged, true, '모양이 틀린 editedBy 는 손상');
      t.eq(JSON.stringify(chat.nextHistory(back, { sha: sha('a'), rejected: false, verdict: null }).editedBy), '["worker-1","u"]', '다음 이력으로 넘어간다(그 PR 에서는 지워지지 않는다)');

      // historyCheck: 가짜 조회로 네 갈래를 본다. 조회 실패는 "없는 대상"으로 흉내 낸다(일시 실패는 3초씩 두 번 더 기다리므로 단위 시험에는 쓰지 않는다).
      const A = sha('a');
      const tmp = path.join(os.tmpdir(), 'court-unit-chat-' + process.pid + '.json');
      fs.writeFileSync(tmp, JSON.stringify(verdictWith([{ id: 'R1', bucket: '확인 못 함' }])), 'utf8');
      try {
        const pinned = { id: 9, node_id: 'IC_abc123', user: BOT_USER, body: pinnedBody(A, { v: 1, rejects: 1, shas: [A.slice(0, 12)], failed: [['R1', 'b']] }) };
        const comments = list => () => ({ ok: true, data: list });
        const editor = data => () => ({ ok: true, data });
        const never = () => { throw new Error('부르면 안 된다'); };
        let r = chat.historyCheck(21, tmp, comments([pinned]), editor(node({ __typename: 'Bot', login: 'github-actions' })));
        t.ok(r.state === 'laundered' && r.laundered.length === 1 && r.laundered[0].id === 'R1' && r.rejects === 1, '법정만 고친 기록 + “안 됨”이던 R1 이 확인 못 함으로 바뀜 → 확인 없이 바뀜: ' + JSON.stringify(r));
        const humanEdited = { ...pinned, body: chat.withHistory(pinned.body, chat.emptyHistory()) }; // 사람이 안 됨 목록과 횟수를 비웠다 — 이력만 보면 걸릴 것이 없다
        r = chat.historyCheck(21, tmp, comments([humanEdited]), editor(node({ __typename: 'User', login: 'worker-1' })));
        t.ok(r.state === 'tampered' && r.by === '사람 계정(worker-1)' && r.rejects === 3, '사람 계정이 고친 기록 → 믿지 않음 · 계정 이름 · 누적 3: ' + JSON.stringify(r));
        r = chat.historyCheck(21, tmp, comments([humanEdited]), () => ({ ok: false, notFound: true, why: 'HTTP 404' }));
        t.ok(r.state === 'lookup-failed' && /마지막으로 고친 계정/.test(r.why), '누가 고쳤는지 못 읽으면 “안 고쳐졌다”가 아니라 못 읽었다: ' + JSON.stringify(r));
        r = chat.historyCheck(21, tmp, comments([humanEdited]), editor({ node: {} }));
        t.eq(r.state, 'lookup-failed', '응답 모양이 다를 때도 못 읽었다');
        const marked = { ...pinned, body: chat.withHistory(pinned.body, chat.distrust(chat.emptyHistory(), ['worker-1', 'u'])) };
        r = chat.historyCheck(21, tmp, comments([marked]), never);
        t.ok(r.state === 'tampered' && r.by === '사람 계정(worker-1)', '이력에 표시가 남아 있으면 다시 묻지 않고 그대로 믿지 않는다(검사를 다시 돌려도 풀리지 않는다): ' + JSON.stringify(r));
        r = chat.historyCheck(22, tmp, comments([]), never);
        t.eq(r.state, 'clean', '고정 댓글이 없으면 누가 고쳤는지 묻지 않는다(앞선 기록이 없으니 바뀐 것도 없다)'); t.eq(r.rejects, 0, '그때의 누적 횟수');
        r = chat.historyCheck(21, tmp, () => ({ ok: false, notFound: true, why: 'HTTP 404' }), never);
        t.eq(r.state, 'lookup-failed', '댓글 조회 실패는 “바뀐 것 없음”이 아니다');
        t.eq(chat.historyCheck(21, tmp + '.none', comments([pinned]), never).state, 'lookup-failed', '판정서를 못 읽어도 못 읽었다');

        // 보고 블록(lookup): 사람이 고친 댓글의 굵은 네 줄은 옮기지 않는다
        const api = list => endpoint => {
          if (/\/pulls\/\d+$/.test(endpoint)) return { ok: true, data: { number: 26, state: 'open', head: { sha: A } } };
          if (/\/check-runs\?/.test(endpoint)) return { ok: true, data: { check_runs: [{ name: 'court', app: { id: chat.ACTIONS_APP_ID }, status: 'completed', conclusion: 'success', started_at: '2026-09-21T00:00:00Z', html_url: 'https://example.invalid/check' }] } };
          if (/\/issues\/\d+\/comments\?/.test(endpoint)) return { ok: true, data: list };
          return { ok: false, notFound: true, why: 'HTTP 404' };
        };
        const target = { kind: 'pr', value: 26 };
        let res = chat.lookup(target, { ghApi: api([pinned]), lookupEditor: editor(node(null, null)) });
        t.ok(res.state === 'verdict' && res.lines[0] === '판정: 통과 — 머리말' && res.lines.length === 5, '법정만 쓴 댓글 → 굵은 네 줄 + 검사 결론 줄을 옮긴다: ' + res.state + ' ' + JSON.stringify(res.notes));
        const edited = { ...pinned, body: pinned.body.replace('하실 일 원문', '확인 못 한 것 없음') };
        res = chat.lookup(target, { ghApi: api([edited]), lookupEditor: editor(node({ __typename: 'User', login: 'worker-4' })) });
        t.ok(res.state === 'no-comment' && res.notes.some(n => /사람 계정\(worker-4\)에 의해 고쳐졌다/.test(n)) && !res.lines.join('\n').includes('확인 못 한 것 없음'), '사람 계정이 고친 댓글 → 옮기지 않는다(고친 글자가 보고에 실리지 않는다): ' + res.state);
        res = chat.lookup(target, { ghApi: api([pinned]), lookupEditor: () => ({ ok: false, notFound: false, missing: false, why: '조회 실패' }) });
        t.eq(res.state, 'lookup-failed', '누가 고쳤는지 못 읽으면 옮기지 않는다(조회 실패)');
        const fake = { id: 5, node_id: 'IC_fake', user: { login: 'worker-1', type: 'User' }, body: pinned.body };
        res = chat.lookup(target, { ghApi: api([fake]), lookupEditor: never });
        t.eq(res.state, 'no-comment', '사람 계정이 같은 표식으로 단 댓글은 법정 판정이 아니다');
        const wrongApp = endpoint => (/\/check-runs\?/.test(endpoint) ? { ok: true, data: { check_runs: [{ name: 'court', app: { id: 1 }, status: 'completed', conclusion: 'success', started_at: 'x', html_url: 'u' }] } } : api([pinned])(endpoint));
        res = chat.lookup(target, { ghApi: wrongApp, lookupEditor: never });
        t.ok(res.state === 'not-yet' && res.lines[0].startsWith(chat.NOT_YET), '같은 이름의 검사를 다른 주체가 만들었으면 심사 전이다: ' + res.lines[0]);
      } finally { fs.rmSync(tmp, { force: true }); }
    },
  },
];

module.exports = { TESTS };
