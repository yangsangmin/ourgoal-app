#!/usr/bin/env node
/**
 * verify-expert-templates.js — #TASK-ES-425 세포 분열 검사기 (작업자 측정 = 주장, 판정은 법정)
 *
 * 기준(git archive 로 푼 origin/main 사본) 대비 작업 트리를 잰다.
 *  ① 노출 동일: require 한 두 판의 module.exports 네 이름(MATCH_RULES·TEMPLATE_MAP·findExpertTemplate·formatScheduleBackgroundLayout)
 *     — 자료는 assert.deepStrictEqual, 키 순서·규칙 순서 JSON 문자열 동일, 함수는 소스 글자 동일
 *  ② 글자 동일: 기준 원본의 규칙 원소·지도 항목 줄 = 부품 6개에 옮겨진 줄(접두별, 같은 순서, 한 글자도 안 바뀜)
 *     · 기준 원본의 머리 1줄·꼬리(함수 3개·module.exports) = 작업 원본의 같은 줄
 *  ③ 토큰 동일: 기준 원본 토큰열 = 작업 원본 머리 토큰 + 부품들 자료 토큰 + 작업 원본 꼬리 토큰 (간이 토크나이저, 주석·공백 제외)
 *  ④ 단독 로드: 법정 탐침 loadOne(court/probes/module-load.js)으로 기준 원본·작업 원본·부품 6개를 각각 격리 vm 에서 실행
 *     — 작업 원본의 결과(ok·오류 문구)가 기준과 같고, 부품은 오류 0·새 전역 0
 *  ⑤ 서버 폴백 동일: 두 판의 api/goaltemplate.js 를 require 해 localGoalTemplateFallback·findExpertTemplate 에 같은 입력을 넣어 결과 deepStrictEqual
 *  ⑥ 줄 수: 작업 원본·부품 모두 800줄 이하
 *
 * 사용: node verify-expert-templates.js <기준 앱 루트> <작업 앱 루트> [out.json]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const [baseDir, headDir, outPath] = process.argv.slice(2).map(p => p && path.resolve(p));
if (!baseDir || !headDir) { console.error('사용: node verify-expert-templates.js <기준 앱 루트> <작업 앱 루트> [out.json]'); process.exit(2); }

const PARTS = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
const PREFIX = { health: 'HLT', study: 'STD', career: 'CAR', hobby: 'HOB', mind: 'MND', relation: 'REL' };
const REG = 'js/goal-templates-registry.js';
const read = (d, f) => fs.readFileSync(path.join(d, f), 'utf8').replace(/\r\n/g, '\n');
const out = { ok: false, checks: {} };
function check(name, fn) {
  try { const detail = fn(); out.checks[name] = { ok: true, detail: detail === undefined ? null : detail }; }
  catch (e) { out.checks[name] = { ok: false, error: String(e && e.message || e).slice(0, 600) }; }
}

// ① 노출 동일
function loadFresh(dir, rel) {
  const abs = path.join(dir, rel);
  Object.keys(require.cache).forEach(k => { if (k.startsWith(dir + path.sep)) delete require.cache[k]; });
  return require(abs);
}
const baseMod = loadFresh(baseDir, REG);
const headMod = loadFresh(headDir, REG);
check('exports-deepStrictEqual', () => {
  assert.deepStrictEqual(Object.keys(headMod), Object.keys(baseMod));
  assert.deepStrictEqual(headMod.MATCH_RULES, baseMod.MATCH_RULES);
  assert.deepStrictEqual(headMod.TEMPLATE_MAP, baseMod.TEMPLATE_MAP);
  assert.strictEqual(JSON.stringify(headMod.MATCH_RULES), JSON.stringify(baseMod.MATCH_RULES));
  assert.strictEqual(JSON.stringify(headMod.TEMPLATE_MAP), JSON.stringify(baseMod.TEMPLATE_MAP));
  const src = f => f.toString().replace(/\r\n/g, '\n'); // 기준 사본은 autocrlf 로 CRLF, 저장소 blob 은 둘 다 LF
  assert.strictEqual(src(headMod.findExpertTemplate), src(baseMod.findExpertTemplate));
  assert.strictEqual(src(headMod.formatScheduleBackgroundLayout), src(baseMod.formatScheduleBackgroundLayout));
  return { names: Object.keys(headMod), rules: headMod.MATCH_RULES.length, templates: Object.keys(headMod.TEMPLATE_MAP).length };
});

// ② 글자 동일
const baseSrc = read(baseDir, REG).split('\n');
const headSrc = read(headDir, REG).split('\n');
const rS = baseSrc.indexOf('var MATCH_RULES = ['), rE = baseSrc.indexOf('];', rS), mS = baseSrc.indexOf('var TEMPLATE_MAP = {'), mE = baseSrc.indexOf('};', mS);
function chunk(lines, from, to, isOpen) {
  const res = []; let cur = null;
  for (let i = from + 1; i < to; i++) { const l = lines[i]; if (isOpen(l)) cur = []; cur.push(l); if (l === '  }' || l === '  },') { res.push(cur); cur = null; } }
  return res;
}
const isMapOpen = l => /^  "TPL-[A-Z]{3}-\d{2}": \{$/.test(l);
const baseRules = chunk(baseSrc, rS, rE, l => l === '  {');
const baseMap = chunk(baseSrc, mS, mE, isMapOpen);
const partSrc = {};
for (const p of PARTS) partSrc[p] = read(headDir, 'js/data/expert-templates/' + p + '.js').split('\n');
check('moved-lines-identical', () => {
  let movedLines = 0;
  for (const p of PARTS) {
    const L = partSrc[p];
    const a = L.indexOf('var MATCH_RULES = ['), b = L.indexOf('];', a), c = L.indexOf('var TEMPLATE_MAP = {'), d = L.indexOf('};', c);
    const wantR = baseRules.filter(ch => ch.join('\n').includes('"TPL-' + PREFIX[p] + '-')).flat();
    const wantM = baseMap.filter(ch => ch[0].includes('"TPL-' + PREFIX[p] + '-')).flat();
    assert.deepStrictEqual(L.slice(a + 1, b), wantR, p + ' 규칙 줄');
    assert.deepStrictEqual(L.slice(c + 1, d), wantM, p + ' 지도 줄');
    movedLines += wantR.length + wantM.length;
  }
  const total = (rE - rS - 1) + (mE - mS - 1);
  assert.strictEqual(movedLines, total, '옮긴 줄 수 = 기준 자료 줄 수');
  // 머리·꼬리
  assert.strictEqual(headSrc[0], baseSrc[0], '머리 줄');
  const baseTail = baseSrc.slice(mE + 1);
  assert.deepStrictEqual(headSrc.slice(headSrc.length - baseTail.length), baseTail, '꼬리(함수 3개·module.exports)');
  return { movedLines, baseDataLines: total, tailLines: baseTail.length };
});

// ③ 토큰 동일 (간이 토크나이저: 문자열·정규식 없는 자료/함수 구간이므로 문자열·숫자·이름·구두점으로 충분)
function tokens(text) {
  const t = []; const re = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|\s+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|&&|\|\||[{}()[\];,.:=<>!+\-*/?]/g;
  let m, pos = 0;
  while ((m = re.exec(text))) {
    if (m.index !== pos) throw new Error('토크나이저가 못 읽는 글자 @' + pos + ': ' + JSON.stringify(text.slice(pos, pos + 20)));
    pos = re.lastIndex;
    const s = m[0];
    if (/^\s/.test(s) || s.startsWith('//') || s.startsWith('/*')) continue;
    t.push(s);
  }
  if (pos !== text.length) throw new Error('끝까지 못 읽음 @' + pos);
  return t;
}
check('token-sequence-identical', () => {
  const baseTok = tokens(baseSrc.join('\n'));
  // 기준 토큰열을 재구성: 머리(없음) + 'var MATCH_RULES = [' + 부품 규칙 몸통들 + '];' + 'var TEMPLATE_MAP = {' + 부품 지도 몸통들 + '};' + 꼬리
  const body = (p, open, close) => { const L = partSrc[p]; const a = L.indexOf(open), b = L.indexOf(close, a); return L.slice(a + 1, b).join('\n'); };
  const rebuilt = ['var MATCH_RULES = ['].concat(PARTS.map(p => body(p, 'var MATCH_RULES = [', '];')), ['];', 'var TEMPLATE_MAP = {'], PARTS.map(p => body(p, 'var TEMPLATE_MAP = {', '};')), ['};']).join('\n');
  const tailStart = headSrc.indexOf('// 런타임 RegExp 객체 캐시');
  const rebuiltTok = tokens(rebuilt + '\n' + headSrc.slice(tailStart).join('\n'));
  assert.deepStrictEqual(rebuiltTok, baseTok);
  // 작업 원본 꼬리 토큰 = 기준 꼬리 토큰(함수 토큰 동일)
  const baseTailTok = tokens(baseSrc.slice(baseSrc.indexOf('// 런타임 RegExp 객체 캐시')).join('\n'));
  const headTailTok = tokens(headSrc.slice(tailStart).join('\n'));
  assert.deepStrictEqual(headTailTok, baseTailTok);
  return { baseTokens: baseTok.length, functionTailTokens: headTailTok.length };
});

// ④ 단독 로드 (법정 탐침 loadOne)
const { loadOne } = require(path.join(headDir, 'court/probes/module-load.js'));
check('standalone-load', () => {
  const b = loadOne(path.join(baseDir, REG));
  const h = loadOne(path.join(headDir, REG));
  assert.strictEqual(h.ok, b.ok, '원본 ok 같음');
  assert.strictEqual(h.error, b.error, '원본 오류 문구 같음');
  const parts = {};
  for (const p of PARTS) {
    const r = loadOne(path.join(headDir, 'js/data/expert-templates/' + p + '.js'));
    assert.strictEqual(r.ok, true, p + ' 단독 로드 오류: ' + r.error);
    assert.deepStrictEqual(r.globals, [], p + ' 새 전역');
    parts[p] = r;
  }
  return { base: b, head: h, parts };
});

// ⑤ 서버 폴백 동일
const INPUTS = ['3대 운동 500kg 달성', '풀코스 마라톤 sub-4', '오픽 AL 등급', '공인중개사 1차', 'next.js 포트폴리오', '리트코드 매일',
  'JLPT N1 합격', '이직 준비 연봉 협상', '유튜브 채널 구독자', '명상 습관', '비폭력대화 NVC', '부모님과 대화', '아기 예방접종',
  '그냥 운동하기', '', '   ', 'TPL-HLT-01', '테니스 NTRP 3.5', '하이록스 sub-80', '크로스핏 머슬업', '철인3종 완주', '책 100권 읽기',
  '영어 공부', '매일 일기 쓰기', '친구 모임', '사진 취미', '재테크 투자'];
check('server-fallback-identical', () => {
  const baseApi = loadFresh(baseDir, 'api/goaltemplate.js');
  const headApi = loadFresh(headDir, 'api/goaltemplate.js');
  let expertHits = 0;
  const rows = [];
  for (const s of INPUTS) {
    const a = baseApi.localGoalTemplateFallback(s), b = headApi.localGoalTemplateFallback(s);
    assert.deepStrictEqual(b, a, '폴백 결과 다름: ' + JSON.stringify(s));
    const x = baseMod.findExpertTemplate(s), y = headMod.findExpertTemplate(s);
    assert.deepStrictEqual(y, x, 'findExpertTemplate 다름: ' + JSON.stringify(s));
    if (y) expertHits++;
    rows.push({ input: s, source: b && b.source, title: b && b.title, matchedRuleId: y ? y.matchedRuleId : null });
  }
  for (const imgs of [null, [], ['a'], ['a', 'b'], ['a', 'b', 'c']]) assert.deepStrictEqual(headMod.formatScheduleBackgroundLayout(imgs), baseMod.formatScheduleBackgroundLayout(imgs));
  assert.ok(expertHits >= 10, '전문가 템플릿 적중이 너무 적다(입력이 경로를 못 밟음): ' + expertHits);
  return { inputs: INPUTS.length, expertHits, rows };
});

// ⑥ 줄 수
check('line-limits', () => {
  const files = [REG].concat(PARTS.map(p => 'js/data/expert-templates/' + p + '.js'));
  const res = {};
  for (const f of files) { const n = read(headDir, f).replace(/\n$/, '').split('\n').length; assert.ok(n <= 800, f + ' ' + n + '줄'); res[f] = n; }
  res.base = baseSrc.length - (baseSrc[baseSrc.length - 1] === '' ? 1 : 0);
  return res;
});

out.ok = Object.values(out.checks).every(c => c.ok);
const text = JSON.stringify(out, null, 2);
if (outPath) fs.writeFileSync(outPath, text + '\n', 'utf8');
console.log(text);
process.exit(out.ok ? 0 : 1);
