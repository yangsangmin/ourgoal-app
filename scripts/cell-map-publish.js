#!/usr/bin/env node
/**
 * 세포지도 내보내기 재료 만들기 (#TASK-ES-414) — docs/architecture/cell-map.json 하나로 두 화면의 재료를 만든다.
 *
 * 사용:
 *   node scripts/cell-map-publish.js --db-out <폴더>       — 웹페이지 db 적재용 JSON: <폴더>/meta.json + <폴더>/chunk-0.json …
 *   node scripts/cell-map-publish.js --notion-out <폴더>   — 노션 「아워골 세포지도 (실시간)」 본문(노션 마크다운): <폴더>/notion-0.md …
 *                                                          (0 = 머리·전체 구조·분열 진행률, 1… = 영역별 세포 세부. 한 번에 넣기 큰 본문을 나눈 것)
 *   --stored-at <ISO 시각> 을 주면 meta 에 storedAt 을 더한다(웹페이지 상태바 「저장」 시각).
 *   --root <저장소> 를 주면 그 저장소에서 지도를 새로 만들어(게시 시점의 병합 이력으로 prs·tasks·reqs 를 다시 계산) 싣는다(#TASK-ES-427).
 *     새로 만든 것이 저장본(--map 또는 저장소의 cell-map.json)과 도장·병합 이력 칸 말고도 다르면 게시하지 않는다(종료 코드 1 — 지도 갱신 PR 먼저).
 *   두 옵션을 같이 줄 수 있다. --map <파일> 로 다른 cell-map.json 을 읽는다.
 * 결정적이다: 같은 cell-map.json → 같은 바이트. 절차: scripts/cell-map-sync.md
 */
'use strict';

const fs = require('fs');
const path = require('path');

const WEB_URL = 'https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J';
const REPO_URL = 'https://github.com/yangsangmin/ourgoal-app';
const CHUNK_BYTES = 150 * 1024;
const TAB_NAMES = { home: '홈', goals: '목표', records: '기록', calendar: '일정', comm: '소통', settings: '설정' };

/** db 적재: meta 한 문서 + 세포 묶음 문서들(문서 한도 256KiB 아래) */
function dbDocs(map) {
  const chunks = [];
  let cur = [];
  let size = 0;
  for (const c of map.cells) {
    const n = Buffer.byteLength(JSON.stringify(c));
    if (cur.length && size + n > CHUNK_BYTES) { chunks.push(cur); cur = []; size = 0; }
    cur.push(c);
    size += n;
  }
  if (cur.length) chunks.push(cur);
  const meta = Object.assign({}, map, { cells: undefined, chunkCount: chunks.length, cellIds: map.cells.map(c => c.id) });
  delete meta.cells;
  return {
    meta,
    chunks: chunks.map((cells, i) => ({ index: i, commit: map.source.commit, cells }))
  };
}

// 노션 마크다운 특수 문자 이스케이프(표·본문 공통)
function esc(s) {
  return String(s === null || s === undefined ? '' : s).replace(/[\\*~`$[\]<>{}|^]/g, ch => '\\' + ch);
}

function num(n) {
  return typeof n === 'number' ? n.toLocaleString('en-US') : esc(n);
}

function kst(iso) {
  if (!iso) return '측정불가';
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  const p = x => String(x).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())} KST`;
}

// 세포 이름표: 짧은 한국어 이름(cell-map.json name, #TASK-ES-418) — 없으면 id
let LABELS = {};
function setLabels(map) {
  LABELS = {};
  (map.cells || []).forEach(c => { if (c.name) LABELS[c.id] = c.name; });
}
function label(id) {
  return LABELS[id] || id;
}
function names(ids) {
  return ids.map(id => esc(label(id))).join(', ');
}

function notionHead(map) {
  setLabels(map);
  const s = map.summary;
  const src = map.source;
  const L = [];
  L.push(`<callout icon="🧬" color="blue_bg">`);
  L.push(`\t**웹페이지(눌러 보는 세포지도):** [${WEB_URL}](${WEB_URL})`);
  L.push(`\t**기준 커밋:** [${esc(src.short || '측정불가')}](${REPO_URL}/commit/${src.commit || ''}) · **그 커밋 시각:** ${esc(kst(src.committedAt))}`);
  L.push(`\t이 페이지는 생성기(scripts/cell-map-export.js → scripts/cell-map-publish.js)가 통째로 다시 쓴다. 손으로 고친 내용은 다음 갱신 때 사라진다. 갱신 절차: [scripts/cell-map-sync.md](${REPO_URL}/blob/main/scripts/cell-map-sync.md)`);
  L.push(`</callout>`);
  L.push(`## 한눈에`);
  L.push(`- 세포 **${num(s.cells)}개** — 기관 ${num(s.kinds.organ)} · 탭 세포 ${num(s.kinds.tab)} · 하이브리드 ${num(s.kinds.hybrid)} · 미래 ${num(s.kinds.future)} (js 파일 ${num(s.files)}개, ${num(s.jsLines)}줄)`);
  L.push(`- 800줄 넘는 세포: 처음 **${num(s.oversize.first)}** (${esc(s.oversize.firstDate)}) → 지금 **${num(s.oversize.now)}** — ${s.oversize.nowFiles.map(f => esc(f.file.replace(/^js\//, '')) + ' ' + num(f.lines) + '줄').join(' · ')}`);
  L.push(`- 미분화 덩어리(index.html 안 스크립트): **${num(s.undifferentiated.inlineScriptLines)}줄**, 함수 ${num(s.undifferentiated.functionDecls)}개 — 여기서 세포를 하나씩 떼어 낸다`);
  L.push(`- 실제로 그리는 작은 세포 ${num(s.health.drawingSmallCells.drew)}/${num(s.health.drawingSmallCells.total)} · 전역 직접 연결 ${num(s.health.globalLinks)} · 탭 간 직접 참조 ${num(s.health.crossTabRefs)}`);
  if (s.descriptionsPending.length) L.push(`- 「하는 일」 설명 대기(머리 주석으로 대신 표시): ${names(s.descriptionsPending)}`);
  L.push(`## 전체 구조 — 영역별 세포`);
  L.push(`<table header-row="true" fit-page-width="true">`);
  L.push(`\t<tr>\n\t\t<td>영역</td>\n\t\t<td>무엇</td>\n\t\t<td>세포</td>\n\t\t<td>줄 수</td>\n\t\t<td>세포 목록</td>\n\t</tr>`);
  for (const a of map.areas) {
    L.push(`\t<tr>\n\t\t<td>**${esc(a.name)}**</td>\n\t\t<td>${esc(a.desc)}</td>\n\t\t<td>${num(a.cells.length)}</td>\n\t\t<td>${num(a.lines)}${a.over800 ? ' (800줄 초과 ' + a.over800 + ')' : ''}</td>\n\t\t<td>${names(a.cells)}</td>\n\t</tr>`);
  }
  L.push(`</table>`);
  L.push(`## 분열 진행률 — 800줄 초과 처음 ${num(s.oversize.first)} → 지금 ${num(s.oversize.now)}`);
  L.push(`<table header-row="true" fit-page-width="true">`);
  L.push(`\t<tr>\n\t\t<td>원본 세포</td>\n\t\t<td>처음</td>\n\t\t<td>지금</td>\n\t\t<td>줄 수 흐름</td>\n\t\t<td>떼어 낸 부품</td>\n\t</tr>`);
  for (const sp of map.splits) {
    const state = sp.over800Now ? '<span color="red">아직 초과</span>' : '<span color="green">800줄 이하</span>';
    L.push(`\t<tr>\n\t\t<td>${esc(sp.name)}</td>\n\t\t<td>${num(sp.firstLines)}</td>\n\t\t<td>${sp.nowLines === null ? '없음' : num(sp.nowLines)} ${state}</td>\n\t\t<td>${sp.steps.map(x => num(x.lines)).join(' → ')}</td>\n\t\t<td>${sp.parts.length ? num(sp.parts.length) + '개' : '-'}</td>\n\t</tr>`);
  }
  L.push(`</table>`);
  L.push(`## 꽂는 자리 15곳`);
  L.push(`<table header-row="true" fit-page-width="true">`);
  L.push(`\t<tr>\n\t\t<td>자리</td>\n\t\t<td>뜻</td>\n\t\t<td>주인</td>\n\t\t<td>지금 꽂힌 세포</td>\n\t\t<td>꽂을 계획</td>\n\t</tr>`);
  for (const sl of map.slots) {
    L.push(`\t<tr>\n\t\t<td>\`${sl.key}\`</td>\n\t\t<td>${esc(sl.label)}${sl.future && !/미래/.test(sl.label) ? ' (미래)' : ''}</td>\n\t\t<td>${esc(sl.host)}</td>\n\t\t<td>${sl.contributors.length ? names(sl.contributors) : '-'}</td>\n\t\t<td>${sl.planned.length ? names(sl.planned) : '-'}</td>\n\t</tr>`);
  }
  L.push(`</table>`);
  L.push(`## 세포별 세부`);
  L.push(`영역을 펼치면 세포가, 세포를 펼치면 파일·줄 수·노출 이름·누구를 부르고 누가 부르는지·관련 작업이 나온다.`);
  return L.join('\n') + '\n';
}

function cellToggle(c) {
  const L = [];
  const tabs = c.tabs.map(t => TAB_NAMES[t] || t).join('·');
  const flag = c.over800 ? ' <span color="red">800줄 초과</span>' : '';
  L.push(`\t<details>`);
  L.push(`\t<summary>**${esc(label(c.id))}** · \`${c.id}\` — ${esc(c.does)}${flag}</summary>`);
  L.push(`\t\t${c.file ? '`' + c.file + '` · ' + num(c.lines) + '줄' : '파일 없음'} · ${esc(c.kindName)}${tabs ? ' · 탭: ' + esc(tabs) : ''}${c.doesSource === 'hand' ? '' : ' · 「하는 일」 설명 대기'}`);
  if (c.exposes.length) L.push(`\t\t노출 이름: ${c.exposes.map(x => '`' + x + '`').join(' ')}`);
  const by = c.calledBy.slice();
  if (c.usedByIndexHtml.length) by.push('index.html');
  L.push(`\t\t부르는 세포: ${c.calls.length ? names(c.calls) : '없음'} / 이 세포를 부르는 쪽: ${by.length ? names(by) : '없음'}`);
  const sig = [];
  if (c.emits.length) sig.push('내보내는 신호 ' + c.emits.map(x => '`' + x + '`').join(' '));
  if (c.listens.length) sig.push('받는 신호 ' + c.listens.map(x => '`' + x + '`').join(' '));
  if (c.provides.length) sig.push('주는 능력 ' + c.provides.map(x => '`' + x + '`').join(' '));
  if (c.requiresAbilities.length) sig.push('필요한 능력 ' + c.requiresAbilities.map(x => '`' + x + '`').join(' '));
  if (c.contributes.length) sig.push('꽂는 자리 ' + c.contributes.map(x => '`' + x + '`').join(' '));
  if (sig.length) L.push(`\t\t${sig.join(' · ')}`);
  if (c.prs.length || c.tasks.length) {
    const prs = c.prs.slice(0, 2).map(p => `[#${p.number}](${REPO_URL}/pull/${p.number})`);
    L.push(`\t\t관련 PR ${prs.length ? prs.join(' ') : '없음'} · 작업 ${c.tasks.length ? esc(c.tasks.slice(-3).join(' ')) : '없음'}`);
  }
  L.push(`\t</details>`);
  return L.join('\n');
}

function notionAreas(map) {
  setLabels(map);
  const byId = new Map(map.cells.map(c => [c.id, c]));
  return map.areas.map(a => {
    const L = [`### ${esc(a.name)} — 세포 ${num(a.cells.length)}개 · ${num(a.lines)}줄 {toggle="true"}`];
    a.cells.forEach(id => L.push(cellToggle(byId.get(id))));
    return L.join('\n') + '\n';
  });
}

/** 노션 본문 조각: [머리·구조·분열, 영역 묶음…] — 조각 하나가 40KB 를 넘지 않게 영역을 모은다 */
function notionParts(map) {
  const parts = [notionHead(map)];
  let cur = '';
  for (const block of notionAreas(map)) {
    if (cur && Buffer.byteLength(cur + block) > 40 * 1024) { parts.push(cur); cur = ''; }
    cur += block;
  }
  if (cur) parts.push(cur);
  return parts;
}

/** 노션에서 되읽은 본문과 세포지도를 대조한다(세포 펼침 수·「하는 일」 글자·영역 제목·깨진 글자·기준 커밋) */
function verifyNotion(map, fetched) {
  let text = fetched;
  try { const j = JSON.parse(fetched); if (j && typeof j.text === 'string') text = j.text; } catch (e) { /* 그냥 본문 */ }
  return {
    toggles: (text.match(/<summary>/g) || []).length,
    missing: map.cells.filter(c => !text.includes(esc(c.does)) || !text.includes(esc(c.id))).map(c => c.id),
    areas: map.areas.filter(a => text.includes('### ' + esc(a.name))).length,
    broken: (text.match(/\uFFFD/g) || []).length,
    commit: !!(map.source.short && text.includes(map.source.short))
  };
}

/**
 * 게시할 지도(#TASK-ES-427): 저장소에서 새로 만든 지도가 저장본과 도장·병합 이력 칸만 다르면 새로 만든 것(게시 시점 이력)을 쓴다.
 * 내용이 다르면 { ok: false } — 저장본이 낡았으니 지도 갱신 PR 이 먼저다.
 */
function mapForPublish(savedText, builtText) {
  const exporter = require('./cell-map-export');
  const r = exporter.compareSaved(savedText, builtText);
  if (!r.fresh) return { ok: false, map: null, refreshed: false };
  return { ok: true, map: JSON.parse(builtText), refreshed: String(savedText).replace(/\r\n/g, '\n') !== builtText };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const mapPath = arg('--map') || path.join(__dirname, '..', 'docs', 'architecture', 'cell-map.json');
  let map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const repoRoot = arg('--root');
  if (repoRoot) {
    const exporter = require('./cell-map-export');
    const built = exporter.serialize(exporter.build(path.resolve(repoRoot)));
    const r = mapForPublish(fs.readFileSync(mapPath, 'utf8'), built);
    if (!r.ok) {
      console.log('게시 안 함: 저장소에서 새로 만든 지도가 저장본과 내용이 다르다 — node scripts/cell-map-export.js 로 지도 갱신 PR 을 먼저 낸다');
      process.exit(1);
    }
    map = r.map;
    console.log(`게시 지도: 저장소 ${repoRoot} 에서 새로 만든 판(기준 커밋 ${map.source.short}, 병합 이력 다시 계산${r.refreshed ? ' — 저장본과 도장·PR 목록이 다름' : ' — 저장본과 같음'})`);
  }
  const dbOut = arg('--db-out');
  const notionOut = arg('--notion-out');
  const storedAt = arg('--stored-at'); // db 적재 시각(선택) — 웹페이지 상태바의 「저장」 시각. 주면 그 값만 meta 에 더한다
  const verify = arg('--verify-notion'); // 노션 fetch 결과(JSON, text 칸) 파일 — 적재 후 되읽어 대조
  if (!dbOut && !notionOut && !verify) {
    console.log('사용: node scripts/cell-map-publish.js --db-out <폴더> --notion-out <폴더> | --verify-notion <노션 fetch 결과 파일>');
    process.exitCode = 1;
  }
  if (verify) {
    const r = verifyNotion(map, fs.readFileSync(verify, 'utf8'));
    console.log(`노션 되읽기 대조: 세포 펼침 ${r.toggles}/${map.cells.length} · 「하는 일」 일치 ${map.cells.length - r.missing.length}/${map.cells.length} · 영역 제목 ${r.areas}/${map.areas.length} · 깨진 글자 ${r.broken} · 기준 커밋 ${r.commit ? '있음' : '없음'}`);
    if (r.missing.length) console.log('  어긋난 세포: ' + r.missing.join(', '));
    if (r.missing.length || r.broken || !r.commit || r.toggles !== map.cells.length) process.exitCode = 1;
  }
  if (dbOut) {
    const d = dbDocs(map);
    if (storedAt) d.meta.storedAt = storedAt;
    fs.mkdirSync(dbOut, { recursive: true });
    fs.writeFileSync(path.join(dbOut, 'meta.json'), JSON.stringify(d.meta) + '\n', 'utf8');
    d.chunks.forEach(ch => fs.writeFileSync(path.join(dbOut, `chunk-${ch.index}.json`), JSON.stringify(ch) + '\n', 'utf8'));
    console.log(`db 재료: meta 1 + 세포 묶음 ${d.chunks.length} (${d.chunks.map(ch => Buffer.byteLength(JSON.stringify(ch))).join(' · ')}바이트) → ${dbOut}`);
  }
  if (notionOut) {
    const parts = notionParts(map);
    fs.mkdirSync(notionOut, { recursive: true });
    parts.forEach((t, i) => fs.writeFileSync(path.join(notionOut, `notion-${i}.md`), t, 'utf8'));
    console.log(`노션 본문: 조각 ${parts.length} (${parts.map(t => Buffer.byteLength(t)).join(' · ')}바이트) → ${notionOut}`);
  }
}

module.exports = { dbDocs, notionParts, notionHead, verifyNotion, mapForPublish, esc, kst, WEB_URL };
