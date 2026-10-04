/**
 * #TASK-ES-364 — 목표 템플릿 데이터 파일 분리 동일성 시험 (쪼개는 순서 7)
 *
 * js/goal-templates-data.js 의 템플릿 60종을 js/data/goal-templates/<category>.js 6개로 나눈 뒤에도
 * OURGOAL_60_TEMPLATES 가 내는 배열이 분리 전과 같은지(개수·순서·내용) 잰다.
 *  1) Node 경로(require) 배열 = 분리 전 원본 배열 — deepStrictEqual (원본: git 기준 커밋, 못 읽으면 지문 해시)
 *  2) 브라우저 경로(index.html 처럼 <script> 6개 → 조립자 순서로 실행) 배열 = Node 경로 배열
 *  3) 읽는 쪽 함수(getByCategory·getById·search) 결과가 원본과 같다
 *  4) 데이터 파일 각 800줄 이하 · index.html 에서 6개가 조립자보다 먼저 읽힌다
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const Module = require('module');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BASE_COMMIT = '9962457'; // 분리 전 main(#675 병합)
const PART_ORDER = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
// 분리 전 원본 list 의 JSON 지문(sha256) — 기준 커밋을 못 읽는 얕은 복제본에서 쓴다
const BASE_SHA256 = '6151e77aadc183947b520c94b31f44653ea8b093455df156d06213815b3e0a0a';
const BASE_IDS = PART_ORDER.map(c => ({ health: 'hlt', study: 'std', career: 'car', hobby: 'hob', mind: 'mnd', relation: 'rel' })[c])
  .reduce((acc, k) => acc.concat(Array.from({ length: 10 }, (_, i) => 'tpl_' + k + '_' + String(i + 1).padStart(2, '0'))), []);

let passed = 0;
function ok(name, fn) { fn(); passed++; console.log('  ok · ' + name); }

const sha = (list) => crypto.createHash('sha256').update(JSON.stringify(list)).digest('hex');
const plain = (x) => JSON.parse(JSON.stringify(x));

// 1) Node 경로
const after = require(path.join(ROOT, 'js', 'goal-templates-data.js'));

let base = null;
const g = spawnSync('git', ['show', BASE_COMMIT + ':js/goal-templates-data.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
if (g.status === 0 && g.stdout && g.stdout.indexOf('var TEMPLATES = [') !== -1) {
  const m = new Module(path.join(ROOT, 'js', '__base-goal-templates-data.js'));
  m.filename = path.join(ROOT, 'js', '__base-goal-templates-data.js');
  m.paths = [];
  m._compile(g.stdout, m.filename);
  base = m.exports;
}

console.log('[goal-templates-data-split] #TASK-ES-364');
ok('Node 경로: 60종·id 순서가 분리 전과 같다', () => {
  assert.strictEqual(after.list.length, 60);
  assert.deepStrictEqual(after.list.map(t => t.id), BASE_IDS);
});
ok('Node 경로: list JSON 지문 = 분리 전 지문(' + BASE_SHA256.slice(0, 12) + '…)', () => {
  assert.strictEqual(sha(after.list), BASE_SHA256);
});
if (base) {
  ok('Node 경로: list deepStrictEqual 분리 전 원본(git ' + BASE_COMMIT + ')', () => {
    assert.strictEqual(sha(base.list), BASE_SHA256, '기준 원본 지문 자체 확인');
    assert.deepStrictEqual(after.list, base.list);
  });
} else {
  console.log('  - 기준 커밋 ' + BASE_COMMIT + ' 을 못 읽음(얕은 복제) — 지문 해시 비교로 대신함');
}

// 2) 브라우저 경로: index.html 과 같은 순서로 같은 전역에서 실행
function runBrowser(files) {
  const ctx = { console };
  ctx.self = ctx;
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const rel of files) vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  return ctx;
}
const browserFiles = PART_ORDER.map(c => 'js/data/goal-templates/' + c + '.js').concat(['js/goal-templates-data.js']);
const win = runBrowser(browserFiles);
ok('브라우저 경로: window.OURGOAL_60_TEMPLATES.list = Node 경로 list', () => {
  assert.ok(win.OURGOAL_60_TEMPLATES && Array.isArray(plain(win.OURGOAL_60_TEMPLATES.list)));
  assert.deepStrictEqual(plain(win.OURGOAL_60_TEMPLATES.list), plain(after.list));
  assert.strictEqual(sha(win.OURGOAL_60_TEMPLATES.list), BASE_SHA256);
});
ok('브라우저 경로: 전역 이름은 OURGOAL_60_TEMPLATES 하나 + 데이터 묶음 OurgoalGoalTemplateParts 하나만 새로 생김', () => {
  const names = Object.keys(win).filter(k => !['console', 'self', 'window'].includes(k)).sort();
  assert.deepStrictEqual(names, ['OURGOAL_60_TEMPLATES', 'OurgoalGoalTemplateParts']);
  assert.deepStrictEqual(Object.keys(win.OurgoalGoalTemplateParts), PART_ORDER);
});

// 3) 읽는 쪽 함수
const ref = base || after;
ok('getByCategory: all·6카테고리 결과가 원본과 같다(각 10종)', () => {
  ['all', null].concat(PART_ORDER).forEach(c => {
    assert.deepStrictEqual(plain(after.getByCategory(c)), plain(ref.getByCategory(c)));
    assert.deepStrictEqual(plain(win.OURGOAL_60_TEMPLATES.getByCategory(c)), plain(ref.getByCategory(c)));
  });
  PART_ORDER.forEach(c => assert.strictEqual(after.getByCategory(c).length, 10));
});
ok('getById: tplId·id 양쪽 표기, 없는 id 는 null', () => {
  ['TPL-HLT-01', 'tpl_rel_10', 'TPL-MND-05', 'tpl_car_03'].forEach(id => {
    assert.deepStrictEqual(plain(after.getById(id)), plain(ref.getById(id)));
    assert.ok(after.getById(id));
  });
  assert.strictEqual(after.getById('TPL-NONE-99'), null);
  assert.strictEqual(after.getById(''), null);
});
ok('search: 키워드 결과가 원본과 같다', () => {
  ['마라톤', '토익', 'NVC', '주기화', '', '없는키워드zz'].forEach(q => {
    assert.deepStrictEqual(plain(after.search(q)).map(t => t.id), plain(ref.search(q)).map(t => t.id));
  });
});

// 4) 파일 크기·로드 순서
ok('데이터 파일 6개 각 800줄 이하, 조립자 800줄 이하', () => {
  browserFiles.forEach(rel => {
    const n = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').length;
    assert.ok(n <= 800, rel + ' ' + n + '줄');
  });
});
ok('index.html: 데이터 파일 6개가 PART_ORDER 순서로 조립자보다 먼저 읽힌다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const pos = browserFiles.map(rel => html.indexOf('<script src="' + rel));
  pos.forEach((p, i) => assert.ok(p > 0, browserFiles[i] + ' <script> 없음'));
  for (let i = 1; i < pos.length; i++) assert.ok(pos[i - 1] < pos[i], browserFiles[i - 1] + ' 가 ' + browserFiles[i] + ' 보다 먼저');
});

console.log('[goal-templates-data-split] ' + passed + ' passed');
