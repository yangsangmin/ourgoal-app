/**
 * #TASK-ES-414 세포지도 생성기 부품 시험 — 결정성(두 번 만들어 바이트 같음) · 필수 칸 · 영역이 모든 세포를 한 번씩 담음
 * 실행: node tests/cell-map-export-es414.test.js (npm test → scripts/test-shipyard-modular.js [Test 6] 경로)
 */
'use strict';

const assert = require('assert');
const path = require('path');
const exporter = require('../scripts/cell-map-export.js');

const root = path.join(__dirname, '..');
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); }
}

const a = exporter.build(root);
const b = exporter.build(root);
const spec = require('../docs/architecture/modules.json');

check('같은 입력으로 두 번 만들면 바이트가 같다', () => {
  assert.strictEqual(exporter.serialize(a), exporter.serialize(b));
});

check('형식 이름과 기준 커밋 칸이 있다', () => {
  assert.strictEqual(a.schema, 'ourgoal.cell-map/1');
  assert.ok('commit' in a.source && 'committedAt' in a.source, 'source.commit · source.committedAt 칸');
  assert.strictEqual(a.source.repo, 'yangsangmin/ourgoal-app');
});

check('세포 수가 신고서와 같고 세포마다 필수 칸이 있다', () => {
  assert.strictEqual(a.cells.length, spec.cells.length);
  for (const c of a.cells) {
    for (const k of ['id', 'kind', 'kindName', 'area', 'does', 'doesSource', 'calls', 'calledBy', 'exposes', 'tasks', 'reqs', 'prs', 'tabs']) {
      assert.ok(c[k] !== undefined, `${c.id}: ${k} 칸`);
    }
    assert.ok(typeof c.does === 'string' && c.does.trim().length > 0, `${c.id}: 하는 일 한 줄이 비어 있다`);
    if (c.file) assert.ok(Number.isInteger(c.lines) && c.lines > 0, `${c.id}: 줄 수`);
    assert.strictEqual(c.over800, c.lines !== null && c.lines > 800, `${c.id}: 800줄 초과 표시`);
  }
});

check('영역들이 모든 세포를 정확히 한 번씩 담는다', () => {
  const seen = {};
  a.areas.forEach(ar => ar.cells.forEach(id => { seen[id] = (seen[id] || 0) + 1; }));
  for (const c of a.cells) assert.strictEqual(seen[c.id], 1, `${c.id} 영역 소속 ${seen[c.id] || 0}회`);
  assert.strictEqual(Object.keys(seen).length, a.cells.length);
});

check('세포 종류 4가지 · 꽂는 자리 15곳', () => {
  assert.deepStrictEqual(a.kinds.map(k => k.key), ['organ', 'tab', 'hybrid', 'future']);
  assert.strictEqual(a.kinds.reduce((s, k) => s + k.count, 0), a.cells.length);
  assert.strictEqual(a.slots.length, 15);
});

check('분열 이력: 처음 800줄 초과 목록이 기준선 첫 기록과 같고 지금 수는 지표와 같다', () => {
  const baseline = require('../docs/architecture/module-baseline.json');
  const first = baseline.history[0].metrics.oversizeJsFiles;
  assert.strictEqual(a.summary.oversize.first, first.count);
  assert.deepStrictEqual(a.splits.map(s => s.file).sort(), Object.keys(first.files).sort());
  const m = require('../scripts/module-metrics.js').measure(root);
  assert.strictEqual(a.summary.oversize.now, m.ratchet.oversizeJsFiles.count);
});

check('부르는/불리는 관계가 서로 맞다', () => {
  const byId = new Map(a.cells.map(c => [c.id, c]));
  for (const c of a.cells) {
    for (const t of c.calls) assert.ok(byId.get(t).calledBy.includes(c.id), `${c.id} → ${t}`);
  }
});

check('머리 주석 줄 추출: 구분선·별표를 빼고 @role 을 벗긴다', () => {
  const raw = "'use strict';\n/**\n * ======\n * @role 홈 카드\n * 둘째 줄\n */\nvar x = 1;\n";
  assert.deepStrictEqual(exporter.headerLines(raw), ['홈 카드', '둘째 줄']);
  assert.deepStrictEqual(exporter.headerLines('var y = 2;\n'), []);
});

check('#TASK-ES-417 미추적 파일을 만들어도 출력이 바뀌지 않는다(git 추적 파일만 읽음)', () => {
  const fs = require('fs');
  const task = a.cells.map(c => c.tasks[0]).find(Boolean);
  assert.ok(task, '작업 번호가 달린 세포가 하나는 있어야 한다');
  const extraReq = 'docs/specs/REQ-' + task + '-ZZ-UNTRACKED-ES417-PROBE.md';
  const extraJs = 'js/tabs/home/zz-untracked-es417-probe.js';
  const made = [];
  try {
    for (const [rel, body] of [[extraReq, '# 미추적 탐침\n'], [extraJs, 'window.zzUntrackedEs417Probe = 1;\n' + 'x();\n'.repeat(900)]]) {
      const p = path.join(root, rel);
      assert.ok(!fs.existsSync(p), rel + ' 가 이미 있다');
      fs.writeFileSync(p, body, 'utf8');
      made.push(p);
    }
    const raw = exporter.serialize(exporter.buildFrom(root, root));
    assert.ok(raw.includes(extraReq), '대조군: 작업 트리를 그대로 읽으면 미추적 REQ 가 들어간다');
    assert.strictEqual(exporter.serialize(exporter.build(root)), exporter.serialize(a));
  } finally {
    made.forEach(p => fs.rmSync(p, { force: true }));
  }
});

const publish = require('../scripts/cell-map-publish.js');

check('db 재료: 묶음마다 256KiB 미만이고 다시 이으면 세포 목록이 그대로다', () => {
  const d = publish.dbDocs(a);
  assert.strictEqual(d.meta.chunkCount, d.chunks.length);
  assert.strictEqual(d.meta.cells, undefined);
  d.chunks.forEach(ch => assert.ok(Buffer.byteLength(JSON.stringify(ch)) < 256 * 1024, `묶음 ${ch.index} 크기`));
  assert.deepStrictEqual([].concat(...d.chunks.map(ch => ch.cells)), a.cells);
});

check('노션 본문: 두 번 만들면 같고, 되읽기 대조가 세포 전부를 찾는다', () => {
  const p1 = publish.notionParts(a).join('');
  const p2 = publish.notionParts(b).join('');
  assert.strictEqual(p1, p2);
  const r = publish.verifyNotion(a, p1);
  assert.strictEqual(r.toggles, a.cells.length);
  assert.deepStrictEqual(r.missing, []);
  assert.strictEqual(r.areas, a.areas.length);
  const broken = publish.verifyNotion(a, p1.replace(publish.esc(a.cells[0].does), '바뀐 글'));
  assert.deepStrictEqual(broken.missing, [a.cells[0].id]);
});

// #TASK-ES-418 구조도 이름표: 세포마다 짧은 이름(손으로 쓴 것 우선 → 「하는 일」 첫 구절 → id)
check('세포마다 짧은 이름표(name)가 있고, 손 이름이 없으면 하는 일 첫 구절·id 순으로 대신한다', () => {
  for (const c of a.cells) assert.ok(typeof c.name === 'string' && c.name.trim().length > 0, `${c.id}: name`);
  const dm = a.cells.find(c => c.id === 'team-dm-room');
  assert.strictEqual(dm.name, 'DM 대화방');
  assert.strictEqual(dm.nameSource, 'hand');
  assert.strictEqual(exporter.shortName('', 'DM 대화방 화면 — 메시지 보기', 'x'), 'DM 대화방 화면');
  assert.strictEqual(exporter.shortName(undefined, '홈 탭 전체를 총괄한다', 'home/index'), 'home/index');
});

// #TASK-ES-419 노션 본문 이름표: 세포 펼침 제목은 짧은 한국어 이름(굵게) · 코드 id, 목록도 짧은 이름
check('노션 본문 세포 펼침 제목이 짧은 이름 · id 순이고, 영역 표의 세포 목록도 짧은 이름이다', () => {
  const body = publish.notionParts(a).join('');
  assert.ok(body.includes('<summary>**DM 대화방** · `team-dm-room` — '), 'DM 대화방 펼침 제목');
  const head = publish.notionHead(a);
  assert.ok(head.includes('DM 대화방, DM 받은 목록') || head.includes('DM 받은 목록'), '영역 표 세포 목록에 짧은 이름');
});

// #TASK-ES-424 --check: 내용이 같고 기준 커밋 도장(HEAD)만 다르면 최신, 내용이 다르면 갱신 필요
check('저장본과 내용이 같고 기준 커밋 도장만 다르면 최신으로 본다(내용이 다르면 갱신 필요)', () => {
  const built = exporter.serialize(a);
  assert.deepStrictEqual(exporter.compareSaved(built, built), { fresh: true, stampOnly: false });
  const stamped = JSON.parse(built);
  stamped.source.commit = '0000000000000000000000000000000000000000';
  stamped.source.short = '0000000';
  stamped.source.committedAt = '2000-01-01T00:00:00+09:00';
  stamped.source.subject = 'Merge pull request #0 from x/y';
  assert.deepStrictEqual(exporter.compareSaved(exporter.serialize(stamped), built), { fresh: true, stampOnly: true });
  assert.deepStrictEqual(exporter.compareSaved(exporter.serialize(stamped).replace(/\n/g, '\r\n'), built), { fresh: true, stampOnly: true });
  const changed = JSON.parse(built);
  changed.cells[0].lines = (changed.cells[0].lines || 0) + 1;
  assert.strictEqual(exporter.compareSaved(exporter.serialize(changed), built).fresh, false);
  const repo = JSON.parse(built);
  repo.source.repo = 'other/repo';
  assert.strictEqual(exporter.compareSaved(exporter.serialize(repo), built).fresh, false);
  assert.strictEqual(exporter.compareSaved(null, built).fresh, false);
});

// #TASK-ES-427 병합 이력 칸(prs 와 거기서 온 tasks·reqs)만 다르면 최신 · 게시는 새로 만든 판(게시 시점 이력)을 쓴다
check('병합 이력 칸(prs·그 PR 의 작업 번호·REQ)만 다르면 최신으로 보고, 게시는 새로 만든 판을 쓴다', () => {
  const built = exporter.serialize(a);
  const withPr = a.cells.find(c => c.prs.length && c.prs[0].task);
  assert.ok(withPr, 'PR 이 걸린 세포가 있다');
  const older = JSON.parse(built);
  const oc = older.cells.find(c => c.id === withPr.id);
  const dropTask = oc.prs[0].task;
  oc.prs = oc.prs.slice(1);
  if (!oc.prs.some(p => p.task === dropTask)) {
    oc.tasks = oc.tasks.filter(t => t !== dropTask);
    oc.reqs = oc.reqs.filter(r => r.indexOf('REQ-' + dropTask) < 0);
  }
  older.source.short = '0000000';
  const olderText = exporter.serialize(older);
  assert.deepStrictEqual(exporter.compareSaved(olderText, built), { fresh: true, stampOnly: true, historyOnly: true });
  const pub = publish.mapForPublish(olderText, built);
  assert.strictEqual(pub.ok, true);
  assert.strictEqual(pub.refreshed, true);
  assert.deepStrictEqual(pub.map.cells.find(c => c.id === withPr.id).prs, withPr.prs);
  const changed = JSON.parse(olderText);
  changed.cells.find(c => c.id === withPr.id).lines += 1;
  assert.strictEqual(exporter.compareSaved(exporter.serialize(changed), built).fresh, false);
  assert.strictEqual(publish.mapForPublish(exporter.serialize(changed), built).ok, false);
  const extraTask = JSON.parse(built);
  extraTask.cells.find(c => c.id === withPr.id).header = ['다른 머리 주석'];
  assert.strictEqual(exporter.compareSaved(exporter.serialize(extraTask), built).fresh, false);
});

// #TASK-ES-430 전문가 템플릿 자료(data/expert-templates/*)는 「목표 템플릿」 영역
check('전문가 템플릿 자료 세포는 목표 템플릿 영역에 든다', () => {
  const fam = exporter.FAMILIES.find(f => f.key === 'templates');
  assert.ok(fam.test('data/expert-templates/career'), 'expert-templates 규칙');
  assert.ok(fam.test('data/goal-templates/career'), '기존 goal-templates 규칙 그대로');
  assert.ok(!fam.test('data/avatar-personas/enfj'), '다른 자료는 아니다');
  const experts = a.cells.filter(c => /^data\/expert-templates\//.test(c.id));
  experts.forEach(c => assert.strictEqual(c.area, 'family-templates', c.id));
});

// #TASK-ES-455 800줄 초과 파일이 없으면 요약 줄 끝에 「— 」를 남기지 않고, 있으면 파일 목록 앞에 붙인다
check('노션 요약 줄: 800줄 초과 파일이 0개면 「— 」 없이 끝나고, 있으면 「— 파일 줄수」가 붙는다', () => {
  const line = m => publish.notionHead(m).split('\n').find(l => l.includes('800줄 넘는 세포'));
  const none = JSON.parse(JSON.stringify(a));
  none.summary.oversize.now = 0; none.summary.oversize.nowFiles = [];
  assert.ok(/지금 \*\*0\*\*$/.test(line(none)), line(none));
  const some = JSON.parse(JSON.stringify(a));
  some.summary.oversize.now = 1; some.summary.oversize.nowFiles = [{ file: 'js/big.js', lines: 900 }];
  assert.ok(/지금 \*\*1\*\* — big\.js 900줄$/.test(line(some)), line(some));
});

const failed = results.filter(r => !r.ok);
results.forEach(r => console.log((r.ok ? '  통과 ' : '  실패 ') + r.name + (r.ok ? '' : ' — ' + r.msg)));
console.log(`cell-map-export 부품 시험: ${results.length - failed.length}/${results.length}`);
if (failed.length) process.exitCode = 1;
