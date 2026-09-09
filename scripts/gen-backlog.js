'use strict';
/**
 * BACKLOG.md 를 노션 「프로젝트 실행계획」에서 만든다 (2026-09-09 신설).
 *
 * 왜 스크립트로 고정하나.
 * 지금까지 BACKLOG.md 는 사람이 손으로 옮겨 적었다(PR #90 이 그랬다). 손으로 옮기면
 * 노션과 파일이 서서히 갈라지고, 야간 자동화 루틴(1호 직원)은 갈라진 쪽을 보고 일한다.
 * 원본은 노션 한 곳이어야 하고, 파일은 그 원본에서 기계가 뽑아낸 사본이어야 한다.
 *
 * **파일을 통째로 덮지 않는다.** BACKLOG.md 에는 노션에 없는 항목이 있다 —
 * 감사·PR 리뷰에서 나온 후속처럼 실행계획 DB 에 행이 없는 것들이다(2026-09-09 실측 5건).
 * 통째로 생성하면 그게 조용히 사라진다. 그래서 표시된 구간만 갈아 끼우고 나머지는 손대지 않는다.
 *
 * 무엇을 담나: 아워골 프로젝트의 실행계획 중
 *   담당 = Claude Code   (사람이 해야 하는 일은 루틴에 시킬 수 없다)
 *   상태 ≠ 완료          (끝난 걸 다시 시키지 않는다)
 *   백로그(분모제외) 미체크 (분모에서 뺀 항목은 진행률 계산에도 안 들어간다)
 *
 * 쓰는 법:
 *   node scripts/gen-backlog.js            BACKLOG.md 갱신
 *   node scripts/gen-backlog.js --dry-run  화면에만 출력하고 파일은 안 건드린다
 *
 * 토큰은 C:/dev/command-center/.env 의 NOTION_TOKEN 을 빌려 쓴다(같은 인테그레이션).
 * 환경변수 NOTION_TOKEN 이 있으면 그걸 우선한다.
 */
const fs = require('node:fs');
const path = require('node:path');

const DS_PLAN = '3acd7a4a-6008-46cb-be3a-8fbb75360b29';   // 프로젝트 실행계획
const OURGOAL = '아워골';
const OUT = path.join(__dirname, '..', 'BACKLOG.md');
const DRY = process.argv.includes('--dry-run');

function token() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN;
  for (const p of ['C:/dev/command-center/.env', path.join(__dirname, '..', '.env')]) {
    try {
      const line = fs.readFileSync(p, 'utf8').split(/\r?\n/).find((l) => l.startsWith('NOTION_TOKEN='));
      if (line) return line.slice('NOTION_TOKEN='.length).trim();
    } catch { /* 다음 후보 */ }
  }
  console.error('NOTION_TOKEN 을 못 찾았다. 환경변수로 넣거나 command-center/.env 를 확인할 것.');
  process.exit(2);
}

const H = { Authorization: 'Bearer ' + token(), 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const T = (p, k) => {
  const v = p.properties[k];
  if (!v) return '';
  switch (v.type) {
    case 'title': return v.title.map((x) => x.plain_text).join('');
    case 'rich_text': return v.rich_text.map((x) => x.plain_text).join('');
    case 'select': return v.select ? v.select.name : '';
    case 'number': return v.number;
    case 'checkbox': return v.checkbox;
    case 'relation': return v.relation.map((r) => r.id.replace(/-/g, ''));
    default: return '';
  }
};

async function queryAll(ds) {
  let out = [], cur;
  do {
    const r = await fetch(`https://api.notion.com/v1/data_sources/${ds}/query`, {
      method: 'POST', headers: H, body: JSON.stringify({ page_size: 100, start_cursor: cur }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`${j.code}: ${j.message}`);
    out = out.concat(j.results || []);
    cur = j.next_cursor;
    if (cur) await sleep(350);
  } while (cur);
  return out;
}

/** 아워골 프로젝트 페이지 id 를 찾는다. 이름을 하드코딩하면 이름이 바뀔 때 조용히 빈 목록이 된다. */
async function ourgoalIds() {
  const r = await fetch('https://api.notion.com/v1/search', {
    method: 'POST', headers: H,
    body: JSON.stringify({ query: OURGOAL, filter: { property: 'object', value: 'page' }, page_size: 20 }),
  });
  const j = await r.json();
  const ids = new Set();
  for (const p of (j.results || [])) {
    const t = Object.values(p.properties || {}).find((v) => v.type === 'title');
    const name = t ? t.title.map((x) => x.plain_text).join('') : '';
    if (name.includes(OURGOAL)) ids.add(p.id.replace(/-/g, ''));
  }
  return ids;
}

(async () => {
  const [rows, ids] = await Promise.all([queryAll(DS_PLAN), ourgoalIds()]);

  const mine = rows.filter((p) => {
    const proj = T(p, '프로젝트');
    const isOurgoal = !ids.size || (Array.isArray(proj) && proj.some((x) => ids.has(x)));
    return isOurgoal
      && T(p, '담당') === 'Claude Code'
      && T(p, '상태') !== '완료'
      && !T(p, '백로그(분모제외)');
  }).sort((a, b) => (T(a, '순서') || 9999) - (T(b, '순서') || 9999));

  const byPart = {};
  for (const p of mine) (byPart[T(p, '파트') || '분류 없음'] ||= []).push(p);

  const START = '<!-- gen-backlog:start — 이 아래는 node scripts/gen-backlog.js 가 생성한다. 손으로 고치지 마라 -->';
  const END = '<!-- gen-backlog:end -->';

  const L = [];
  L.push(START);
  L.push('');
  L.push('## 노션 실행계획에서 생성 (아워골 · 담당 Claude Code · 미완료)');
  L.push('');
  L.push('고칠 것이 있으면 노션 「프로젝트 실행계획」을 고치고 \`node scripts/gen-backlog.js\` 를 다시 돌려라.');
  L.push('여기 손으로 적으면 다음 생성에서 사라진다. 이 표시 구간 **밖**은 사람이 쓰는 자리다.');
  L.push('');
  L.push(`생성 ${new Date().toLocaleString('ko-KR')} · 조건: 담당=Claude Code · 상태≠완료 · 백로그(분모제외) 미체크 · 총 ${mine.length}건`);
  L.push('');

  for (const [part, list] of Object.entries(byPart)) {
    L.push(`### ${part} (${list.length}건)`);
    L.push('');
    for (const p of list) {
      const no = T(p, '순서');
      L.push(`- [ ] **${no != null ? no + '. ' : ''}${T(p, '작업명')}** · 상태 ${T(p, '상태')}`
        + (T(p, '예상 소요(분)') ? ` · 예상 ${T(p, '예상 소요(분)')}분` : ''));
      if (T(p, '범위')) L.push(`  - 범위: ${T(p, '범위')}`);
      if (T(p, '완료 기준')) L.push(`  - 완료 기준: ${T(p, '완료 기준')}`);
      if (T(p, '선행 작업')) L.push(`  - 선행: ${T(p, '선행 작업')}`);
      // 비고는 길다(수천 자짜리 검증 기록이 들어 있다). 파일이 읽히게 앞부분만.
      const memo = String(T(p, '비고') || '').replace(/\s+/g, ' ').trim();
      if (memo) L.push(`  - 비고: ${memo.slice(0, 300)}${memo.length > 300 ? ' …(전문은 노션)' : ''}`);
    }
    L.push('');
  }
  L.push(END);
  const block = L.join('\n');

  let file = '';
  try { file = fs.readFileSync(OUT, 'utf8'); } catch { file = ''; }

  let next;
  if (file.includes(START.slice(0, 28)) && file.includes(END)) {
    // 표시 구간만 갈아 끼운다 — 사람이 쓴 부분은 한 글자도 안 건드린다
    const a = file.indexOf(file.slice(file.indexOf('<!-- gen-backlog:start')).split('\n')[0]);
    const b = file.indexOf(END) + END.length;
    next = file.slice(0, a) + block + file.slice(b);
  } else if (file) {
    next = file.trimEnd() + '\n\n' + block + '\n';
  } else {
    next = '# BACKLOG — 아워골\n\n' + block + '\n';
  }

  if (DRY) {
    console.log(block);
    console.log(`\n(dry-run — 파일은 안 건드렸다. ${mine.length}건 / 기존 파일 ${file.split('\n').length}줄 유지)`);
    return;
  }

  const handKept = (file.match(/^- \[ \]/gm) || []).length;
  fs.writeFileSync(OUT, next, 'utf8');
  const back = fs.readFileSync(OUT, 'utf8');
  console.log(`${OUT} 갱신 — 생성 ${mine.length}건 / 파트 ${Object.keys(byPart).length}개`);
  console.log('왕복 대조:', back === next ? '일치' : '불일치!');
  console.log(`기존 파일 미완료 표시 ${handKept}개 → 지금 ${(back.match(/^- \[ \]/gm) || []).length}개`);
})().catch((e) => { console.error('실패: ' + e.message); process.exitCode = 1; });
