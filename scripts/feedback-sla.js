#!/usr/bin/env node
'use strict';
/**
 * 피드백 SLA 도구 (#T014) — 노션 「아워골 고객 문의 및 오류 제보 원장」을 피드백 DB 로 쓴다.
 *
 * 인앱 신고는 /api/inquiry(api/track.js)가 자동으로 넣는다. 이 도구는 그 뒤를 맡는다:
 *   add      오픈채팅·카톡으로 온 신고를 세션이 원장에 입력
 *   triage   심각도·재현성 분류 (심각도 상 = 가입·체크인 불가 → 24시간 SLA 대상)
 *   resolve  수정 배포일시·수정 링크 기록 → 리드타임(시간)·SLA 판정은 노션 수식이 계산
 *   replied  신고자에게 "고쳤어요" 답장을 보낸 뒤 체크
 *   check    미분류·SLA 진행중·위반·리드타임 요약. 위반이 있으면 종료코드 1
 *
 * 토큰은 환경변수 NOTION_TOKEN 만 쓴다(없으면 FEEDBACK_SLA_ENV_FILE 또는 저장소 루트 .env 를 읽는다).
 * 속성명은 가정하지 않고 실행 때마다 data_source 스키마를 읽어 대조한다.
 * select 에 없는 옵션명을 보내면 노션이 조용히 새 옵션을 만들므로 보내기 전에 막는다.
 * 못 잰 값은 0 이 아니라 null 로 둔다.
 */
const fs = require('node:fs');
const path = require('node:path');

const API = 'https://api.notion.com/v1';
const VERSION = '2025-09-03';
const DEFAULT_DB_ID = '3dd598db-9096-816e-8875-c602c34d251f'; // api/track.js DEFAULT_NOTION_INQUIRIES_DB_ID 와 같은 원장
const SLA_MINUTES = 24 * 60;
const TRIAGE_WARN_MINUTES = 12 * 60; // 미분류가 이보다 오래되면 경고 — 분류 안 된 치명 버그는 SLA 시계가 안 보인다

const TYPE_ALIAS = {
  '버그': '버그/오류 제보', 'bug': '버그/오류 제보',
  'UX': 'UX 불편', 'ux': 'UX 불편',
  '요청': '새로운 기능 제안', 'feature': '새로운 기능 제안',
  '칭찬': '칭찬', 'praise': '칭찬',
  '계정': '계정/보안 관련', '기타': '기타 문의사항',
};
const REQUIRED = {
  '유형': 'select', '상태': 'select', '심각도': 'select', '재현성': 'select', '접수 경로': 'select',
  '접수일시': 'date', '수정 배포일시': 'date', '수정 링크': 'url', '신고자 답장': 'checkbox',
  '문의 내용': 'rich_text', '작성자 닉네임': 'rich_text', '리드타임(시간)': 'formula', 'SLA 판정': 'formula',
};

function loadToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN;
  const candidates = [process.env.FEEDBACK_SLA_ENV_FILE, path.join(__dirname, '..', '.env')].filter(Boolean);
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = raw.match(/^\s*NOTION_TOKEN\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(pathname, method, body, token, attempt = 0) {
  const res = await fetch(API + pathname, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Notion-Version': VERSION, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok) return json;
  // 429 만 재시도한다. 500번대 POST/PATCH 재시도는 중복 행을 만든다.
  if (res.status === 429 && attempt < 5) {
    const wait = (Number(res.headers.get('retry-after')) || 2 ** attempt) * 1000 + Math.floor(Math.random() * 300);
    await sleep(wait);
    return call(pathname, method, body, token, attempt + 1);
  }
  const err = new Error('Notion ' + method + ' ' + pathname + ' ' + res.status + ': ' + (json.code || '') + ' ' + (json.message || ''));
  err.status = res.status;
  throw err;
}

/** 스키마를 읽어 제목 속성명·select 옵션을 돌려준다. 필수 속성이 없거나 타입이 다르면 멈춘다(무차별 재시도 금지). */
async function loadSchema(token) {
  const dbId = process.env.NOTION_INQUIRIES_DB_ID || DEFAULT_DB_ID;
  const db = await call('/databases/' + dbId, 'GET', null, token);
  const sources = db.data_sources || [];
  if (sources.length !== 1) throw new Error('data_source 가 ' + sources.length + '개다. 1개일 때만 동작한다(원장 구조 변경 감지).');
  const ds = await call('/data_sources/' + sources[0].id, 'GET', null, token);
  const props = ds.properties;
  const titleProp = Object.keys(props).find((k) => props[k].type === 'title');
  const problems = [];
  for (const [name, type] of Object.entries(REQUIRED)) {
    if (!props[name]) problems.push('없음: ' + name);
    else if (props[name].type !== type) problems.push('타입 불일치: ' + name + ' (기대 ' + type + ', 실제 ' + props[name].type + ')');
  }
  if (!titleProp) problems.push('제목(title) 속성 없음');
  if (problems.length) throw new Error('스키마 불일치 — ' + problems.join(' / '));
  const options = {};
  for (const [k, v] of Object.entries(props)) if (v.type === 'select') options[k] = v.select.options.map((o) => o.name);
  return { dsId: sources[0].id, titleProp, options, url: db.url };
}

function guardOption(schema, prop, value) {
  if (!schema.options[prop].includes(value)) {
    throw new Error('"' + prop + '" 에 없는 옵션: "' + value + '". 허용: ' + schema.options[prop].join(' | '));
  }
  return value;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

function isoOrNow(v) {
  if (!v || v === true) return new Date().toISOString();
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new Error('시각을 읽을 수 없다: ' + v);
  return d.toISOString();
}

const plain = (arr) => (Array.isArray(arr) ? arr.map((t) => t.plain_text).join('') : '');

function readRow(page, schema) {
  const P = page.properties;
  const sel = (n) => (P[n] && P[n].select ? P[n].select.name : null);
  const date = (n) => (P[n] && P[n].date ? P[n].date.start : null);
  const formula = (n) => {
    const f = P[n] && P[n].formula;
    if (!f) return null;
    const v = f[f.type];
    return v === undefined || v === '' ? null : v;
  };
  return {
    id: page.id,
    title: plain(P[schema.titleProp].title),
    type: sel('유형'), status: sel('상태'), severity: sel('심각도'), repro: sel('재현성'), channel: sel('접수 경로'),
    receivedAt: date('접수일시'), fixedAt: date('수정 배포일시'),
    fixLink: P['수정 링크'] ? P['수정 링크'].url : null,
    replied: P['신고자 답장'] ? P['신고자 답장'].checkbox : null,
    leadHours: formula('리드타임(시간)'), sla: formula('SLA 판정'),
  };
}

async function queryAll(schema, token) {
  const rows = [];
  let cursor;
  for (let page = 0; page < 50; page++) {
    const r = await call('/data_sources/' + schema.dsId + '/query', 'POST', { page_size: 100, start_cursor: cursor }, token);
    rows.push(...r.results);
    if (!r.has_more) return rows;
    cursor = r.next_cursor;
  }
  throw new Error('50쪽을 넘겼다. 조회가 잘렸을 수 있어 집계를 내지 않는다.');
}

async function cmdAdd(args, schema, token) {
  const content = typeof args.content === 'string' ? args.content.trim() : '';
  if (!content) throw new Error('--content 가 필요하다');
  const type = guardOption(schema, '유형', TYPE_ALIAS[args.type] || args.type || '버그/오류 제보');
  const channel = guardOption(schema, '접수 경로', args.channel || '오픈채팅');
  const nick = (typeof args.nick === 'string' && args.nick.trim()) || '익명';
  const receivedAt = isoOrNow(args.received);
  const title = ('[' + type + '] ' + content.replace(/[\r\n]+/g, ' ').slice(0, 25) + (content.length > 25 ? '...' : '') + ' (' + nick + ')').normalize('NFC');
  const properties = {
    [schema.titleProp]: { title: [{ type: 'text', text: { content: title.slice(0, 100) } }] },
    '유형': { select: { name: type } },
    '상태': { select: { name: guardOption(schema, '상태', '접수') } },
    '접수 경로': { select: { name: channel } },
    '작성자 닉네임': { rich_text: [{ type: 'text', text: { content: nick.normalize('NFC').slice(0, 100) } }] },
    '문의 내용': { rich_text: [{ type: 'text', text: { content: content.normalize('NFC').slice(0, 2000) } }] },
    '접수일시': { date: { start: receivedAt } },
  };
  if (args.severity) properties['심각도'] = { select: { name: guardOption(schema, '심각도', args.severity) } };
  if (args.repro) properties['재현성'] = { select: { name: guardOption(schema, '재현성', args.repro) } };
  const page = await call('/pages', 'POST', { parent: { type: 'data_source_id', data_source_id: schema.dsId }, properties }, token);
  const back = readRow(await call('/pages/' + page.id, 'GET', null, token), schema);
  if (back.title !== title.slice(0, 100)) throw new Error('왕복 대조 실패 — 보낸 제목과 읽은 제목이 다르다: ' + back.title);
  return { added: back, url: page.url };
}

async function cmdPatch(pageId, properties, schema, token) {
  if (!pageId) throw new Error('페이지 id 가 필요하다');
  const before = await call('/pages/' + pageId, 'GET', null, token);
  if (!before.parent || before.parent.data_source_id !== schema.dsId) throw new Error('이 원장의 행이 아니다: ' + pageId);
  await call('/pages/' + pageId, 'PATCH', { properties }, token);
  return { before: readRow(before, schema), after: readRow(await call('/pages/' + pageId, 'GET', null, token), schema) };
}

function summarize(rows, now = Date.now()) {
  const minutesSince = (iso) => (iso ? Math.floor((now - new Date(iso).getTime()) / 60000) : null);
  const open = rows.filter((r) => !r.fixedAt && r.status !== '답변완료' && r.status !== '보류');
  const untriaged = open.filter((r) => !r.severity);
  const critical = open.filter((r) => r.severity === '상').map((r) => {
    const age = minutesSince(r.receivedAt);
    return { id: r.id, title: r.title, receivedAt: r.receivedAt, hoursLeft: age === null ? null : Math.round((SLA_MINUTES - age) / 6) / 10 };
  });
  const breachedOpen = critical.filter((c) => c.hoursLeft !== null && c.hoursLeft < 0);
  const breachedClosed = rows.filter((r) => r.sla === '위반');
  const leads = rows.map((r) => r.leadHours).filter((v) => typeof v === 'number').sort((a, b) => a - b);
  const median = leads.length ? (leads.length % 2 ? leads[(leads.length - 1) / 2] : (leads[leads.length / 2 - 1] + leads[leads.length / 2]) / 2) : null;
  const needReply = rows.filter((r) => r.fixedAt && r.replied === false);
  return {
    total: rows.length,
    open: open.length,
    untriaged: untriaged.map((r) => ({ id: r.id, title: r.title, ageHours: minutesSince(r.receivedAt) === null ? null : Math.round(minutesSince(r.receivedAt) / 6) / 10 })),
    untriagedStale: untriaged.filter((r) => (minutesSince(r.receivedAt) || 0) > TRIAGE_WARN_MINUTES).length,
    criticalOpen: critical,
    breachedOpen: breachedOpen.length,
    breachedClosed: breachedClosed.length,
    leadTime: { count: leads.length, medianHours: median, maxHours: leads.length ? leads[leads.length - 1] : null },
    needReply: needReply.map((r) => ({ id: r.id, title: r.title })),
  };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (!cmd || cmd === 'help' || args.help) {
    console.log([
      '사용법:',
      '  node scripts/feedback-sla.js add --type 버그|UX|요청|칭찬 --channel 오픈채팅|카카오톡|인앱|기타 --nick 닉네임 --content "내용" [--severity 상|중|하] [--repro 항상|가끔|1회|미확인] [--received ISO시각]',
      '  node scripts/feedback-sla.js triage <pageId> --severity 상|중|하 [--repro ...] [--type ...]',
      '  node scripts/feedback-sla.js resolve <pageId> --link <PR 또는 커밋 URL> [--at ISO시각] [--replied]',
      '  node scripts/feedback-sla.js replied <pageId>',
      '  node scripts/feedback-sla.js check [--json]',
    ].join('\n'));
    return 0;
  }
  const token = loadToken();
  if (!token) throw new Error('NOTION_TOKEN 이 없다. 환경변수 또는 FEEDBACK_SLA_ENV_FILE 로 .env 경로를 지정하라.');
  const schema = await loadSchema(token);

  if (cmd === 'add') { console.log(JSON.stringify(await cmdAdd(args, schema, token), null, 2)); return 0; }

  if (cmd === 'triage') {
    const p = {};
    if (!args.severity) throw new Error('--severity 가 필요하다');
    p['심각도'] = { select: { name: guardOption(schema, '심각도', args.severity) } };
    if (args.repro) p['재현성'] = { select: { name: guardOption(schema, '재현성', args.repro) } };
    if (args.type) p['유형'] = { select: { name: guardOption(schema, '유형', TYPE_ALIAS[args.type] || args.type) } };
    p['상태'] = { select: { name: guardOption(schema, '상태', '확인중') } };
    console.log(JSON.stringify(await cmdPatch(args._[0], p, schema, token), null, 2));
    return 0;
  }

  if (cmd === 'resolve') {
    if (typeof args.link !== 'string' || !/^https?:\/\//.test(args.link)) throw new Error('--link 에 수정 PR·커밋 URL 이 필요하다(근거 없는 수정 완료 기록 금지)');
    const p = { '수정 배포일시': { date: { start: isoOrNow(args.at) } }, '수정 링크': { url: args.link } };
    if (args.replied) { p['신고자 답장'] = { checkbox: true }; p['상태'] = { select: { name: guardOption(schema, '상태', '답변완료') } }; }
    console.log(JSON.stringify(await cmdPatch(args._[0], p, schema, token), null, 2));
    return 0;
  }

  if (cmd === 'replied') {
    const p = { '신고자 답장': { checkbox: true }, '상태': { select: { name: guardOption(schema, '상태', '답변완료') } } };
    console.log(JSON.stringify(await cmdPatch(args._[0], p, schema, token), null, 2));
    return 0;
  }

  if (cmd === 'check') {
    const rows = (await queryAll(schema, token)).map((pg) => readRow(pg, schema));
    const s = summarize(rows);
    if (args.json) console.log(JSON.stringify(s, null, 2));
    else {
      console.log('피드백 원장: ' + schema.url);
      console.log('전체 ' + s.total + '건 · 미해결 ' + s.open + '건 · 미분류 ' + s.untriaged.length + '건(12시간 초과 ' + s.untriagedStale + '건)');
      console.log('심각도 상 미해결 ' + s.criticalOpen.length + '건 · SLA 위반(미수정) ' + s.breachedOpen + '건 · SLA 위반(수정됨) ' + s.breachedClosed + '건');
      for (const c of s.criticalOpen) console.log('  [상] 남은 ' + (c.hoursLeft === null ? '측정불가' : c.hoursLeft + '시간') + ' · ' + c.title + ' · ' + c.id);
      for (const u of s.untriaged) console.log('  [미분류] 접수 후 ' + (u.ageHours === null ? '측정불가' : u.ageHours + '시간') + ' · ' + u.title + ' · ' + u.id);
      for (const n of s.needReply) console.log('  [답장 필요] ' + n.title + ' · ' + n.id);
      console.log('리드타임: ' + (s.leadTime.count ? s.leadTime.count + '건 · 중앙값 ' + s.leadTime.medianHours + '시간 · 최대 ' + s.leadTime.maxHours + '시간' : '측정불가(수정 배포 기록 0건)'));
    }
    return s.breachedOpen > 0 ? 1 : 0;
  }

  throw new Error('모르는 명령: ' + cmd);
}

if (require.main === module) {
  main().then((code) => { process.exitCode = code; }).catch((e) => { console.error('오류: ' + e.message); process.exitCode = 2; });
}

module.exports = { parseArgs, summarize, TYPE_ALIAS, SLA_MINUTES };
