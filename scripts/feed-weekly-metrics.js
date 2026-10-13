#!/usr/bin/env node
/* ============================================================
 * 아워골 — 소통 피드 주간 유익함 지표 (소통-피드 알고리즘 3단계, #TASK-ES-700, 본질 ③)
 *
 * 무엇을 재나(지난 7일 vs 그 앞 7일, 전부 실데이터 · 체류시간·조회수 없음 — 피드 노출 규범 1):
 *   helpfulRatio        도움돼요 / (응원+도움돼요+별로에요)            경보: 기준선보다 20% 넘게 떨어짐
 *   howtoShare          (노하우+새 정보) / 이유 전체                     경보: 30% 아래
 *   sameCategoryRate    반응자의 활성 목표 카테고리 = 글 카테고리 비율   경보: 50% 아래
 *   offTopicShare       별로에요 중 off_topic 비율                      경보: 기준선보다 오름
 *   reach               도움돼요 1건 이상 받은 글 비율                   경보: 20% 아래
 *   connectionsFromFeed 피드에서 시작된 팀 초대(team_pings.source='feed')  — 동반자 추가는 profile JSON 이라 서버에서 못 센다(null)
 *   settings            feed_settings 현재값 + 최근 변경 기록 5건
 * 값을 못 재면 null 이고 measured=false 다. 0 으로 채우지 않는다.
 *
 * 실행: node scripts/feed-weekly-metrics.js [--out <json 경로>] [--vault <폴더>] [--days 7]
 *   자격: 환경변수 SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY (없으면 저장소 루트 .env / .env.local / .env.production.local 에서 읽는다)
 *   service_role 이 필요한 이유: content_reactions·helpful_reasons 는 RLS 로 본인 행만 보인다. 이 스크립트는 사람 PC 나 CI 에서만 돈다.
 *   기본 출력: reports/feed-metrics/<YYYY>-W<주>.json  · --vault 를 주면 그 폴더에 같은 파일 + latest.json 도 쓴다(양비스 상태창이 읽는다)
 * 순수 계산(compute)은 node 시험지가 가짜 행으로 돈다. 정본: 「아워골 소통-피드 알고리즘 정립 보고서」 5-2·5-3절.
 * ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const CM = require(path.join(ROOT, 'js', 'data', 'category-map.js'));

const ALERT = { helpfulDropPct: 20, howtoShareMin: 0.30, sameCategoryMin: 0.50, reachMin: 0.20 };

/* ---------- 자격 ---------- */
function readEnvFile(file, key) {
  if (!fs.existsSync(file)) return null;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = raw.match(new RegExp('^\\s*' + key + '\\s*=\\s*(.+?)\\s*$'));
    if (m) return m[1].replace(/^['"]|['"]$/g, '');
  }
  return null;
}
function loadCreds() {
  const files = ['.env', '.env.local', '.env.production.local'].map(f => path.join(ROOT, f));
  const pick = key => process.env[key] || files.map(f => readEnvFile(f, key)).find(Boolean) || null;
  return { url: pick('SUPABASE_URL'), key: pick('SUPABASE_SERVICE_ROLE_KEY') };
}

/* ---------- 계산(순수) ----------
 * rows = { posts, reactions, reasons, goals, pings, settings, settingsLog, users }
 *   posts:     [{ id, user_id, category, created_at }]
 *   reactions: [{ target_id, user_id, type, reason_tag, created_at }]        (content_reactions, deleted_at null)
 *   reasons:   [{ target_id, user_id, reason_tag, created_at }]              (helpful_reasons, deleted_at null)
 *   goals:     [{ user_id, topic, category, title, archived_at }]
 *   pings:     [{ source, created_at }]                                      (team_pings)
 *   users:     [{ id, is_bot }]
 *   settings:  [{ key, value, updated_at }] | null · settingsLog: [{ key, before, after, reason, changed_at }] | null
 */
function ratio(a, b) { return b > 0 ? Math.round((a / b) * 1000) / 1000 : null; }

function windowStats(rows, from, to) {
  const inWin = iso => { const t = Date.parse(iso || ''); return isFinite(t) && t >= from && t < to; };
  const bots = new Set((rows.users || []).filter(u => u && u.is_bot).map(u => String(u.id)));
  const postById = {}; (rows.posts || []).forEach(p => { if (p && p.id && !/^sim_/.test(String(p.id)) && !bots.has(String(p.user_id))) postById[String(p.id)] = p; });
  const goalCatsByUser = {};
  (rows.goals || []).forEach(g => {
    if (!g || g.archived_at) return;
    const k = CM.fromGoal({ topic: g.topic, category: g.category, title: g.title });
    if (!k) return;
    (goalCatsByUser[String(g.user_id)] = goalCatsByUser[String(g.user_id)] || new Set()).add(k);
  });

  const rx = (rows.reactions || []).filter(r => r && inWin(r.created_at) && postById[String(r.target_id)] && !bots.has(String(r.user_id)) && String(r.user_id) !== String(postById[String(r.target_id)].user_id));
  const n = t => rx.filter(r => r.type === t).length;
  const helpful = n('helpful'), cheer = n('cheer'), poor = n('poor'), advice = n('advice');
  const poorOff = rx.filter(r => r.type === 'poor' && r.reason_tag === 'off_topic').length;

  const rs = (rows.reasons || []).filter(r => r && inWin(r.created_at) && postById[String(r.target_id)] && !bots.has(String(r.user_id)));
  const howto = rs.filter(r => r.reason_tag === 'how_to' || r.reason_tag === 'new_info').length;

  let known = 0, same = 0;
  rx.forEach(r => {
    const cat = postById[String(r.target_id)].category;
    if (!cat) return;
    const mine = goalCatsByUser[String(r.user_id)];
    if (!mine) return;
    known++; if (mine.has(cat)) same++;
  });

  const postsWin = Object.values(postById).filter(p => inWin(p.created_at));
  const withHelpful = new Set(rx.filter(r => r.type === 'helpful').map(r => String(r.target_id)));
  const reachNum = postsWin.filter(p => withHelpful.has(String(p.id))).length;

  const pingsFeed = (rows.pings || []).filter(p => p && p.source === 'feed' && inWin(p.created_at)).length;

  return {
    posts: postsWin.length,
    reactions: { helpful, cheer, poor, advice, total: helpful + cheer + poor },
    helpfulRatio: ratio(helpful, helpful + cheer + poor),
    reasons: rs.length,
    howtoShare: ratio(howto, rs.length),
    sameCategoryRate: ratio(same, known),
    sameCategoryKnown: known,
    offTopicShare: ratio(poorOff, poor),
    reach: ratio(reachNum, postsWin.length),
    connectionsFromFeed: { teamInvites: pingsFeed, companions: null, companionsNote: '동반자 목록은 profile JSON(기기·프로필 문서)에 있어 서버에서 세지 못함 — 측정불가' }
  };
}

function compute(rows, opts) {
  opts = opts || {};
  const now = typeof opts.now === 'number' ? opts.now : Date.now();
  const days = opts.days || 7;
  const w = days * 864e5;
  const cur = windowStats(rows, now - w, now);
  const prev = windowStats(rows, now - 2 * w, now - w);
  const alerts = [];
  if (cur.helpfulRatio !== null && prev.helpfulRatio !== null && prev.helpfulRatio > 0 && (prev.helpfulRatio - cur.helpfulRatio) / prev.helpfulRatio * 100 > ALERT.helpfulDropPct) alerts.push({ key: 'helpfulRatio', text: '도움돼요 비율이 지난주보다 ' + ALERT.helpfulDropPct + '% 넘게 떨어짐 → 직전 설정으로 되돌릴지 검토(5-3 ④)', cur: cur.helpfulRatio, prev: prev.helpfulRatio });
  if (cur.howtoShare !== null && cur.howtoShare < ALERT.howtoShareMin) alerts.push({ key: 'howtoShare', text: '노하우·새 정보 이유 비율 ' + ALERT.howtoShareMin * 100 + '% 아래', cur: cur.howtoShare });
  if (cur.sameCategoryRate !== null && cur.sameCategoryRate < ALERT.sameCategoryMin) alerts.push({ key: 'sameCategoryRate', text: '같은 카테고리 안 응답률 ' + ALERT.sameCategoryMin * 100 + '% 아래(동류성 약화)', cur: cur.sameCategoryRate });
  if (cur.offTopicShare !== null && prev.offTopicShare !== null && cur.offTopicShare > prev.offTopicShare) alerts.push({ key: 'offTopicShare', text: '별로에요 중 off_topic 비율 상승(적합도 저하)', cur: cur.offTopicShare, prev: prev.offTopicShare });
  if (cur.reach !== null && cur.reach < ALERT.reachMin) alerts.push({ key: 'reach', text: '도움돼요 1건 이상 받은 글 비율 ' + ALERT.reachMin * 100 + '% 아래(소수 글 독식)', cur: cur.reach });

  const settings = rows.settings ? Object.fromEntries(rows.settings.map(s => [s.key, s.value])) : null;
  const log = rows.settingsLog ? rows.settingsLog.slice(0, 5) : null;
  return {
    kind: '피드 주간 유익함 지표(작업자 측정 · 판정 아님)',
    measuredAt: new Date(now).toISOString(),
    windowDays: days,
    measured: true,
    current: cur, previous: prev,
    alerts,
    settings, settingsLog: log,
    notes: ['머문 시간·본 횟수·누른 비율 신호 없음(피드 노출 규범 1)', '노출 로그 없음(결심 ②: 집계만) — 추천 묶음 글과 그 외 글의 도움돼요 비율 분리는 4단계', '값이 null 이면 그 주에 분모가 0 이거나 잴 수 없었다는 뜻이다']
  };
}

/* ---------- 서버 읽기(service_role) ---------- */
async function fetchRows(sb, now, days) {
  const since = new Date(now - 2 * days * 864e5).toISOString();
  async function q(table, select, mod) {
    let b = sb.from(table).select(select);
    if (mod) b = mod(b);
    const r = await b;
    if (r.error) { const e = new Error(table + ': ' + (r.error.message || r.error.code)); e.code = r.error.code; throw e; }
    return r.data || [];
  }
  async function optional(fn) { try { return await fn(); } catch (e) { if (/does not exist|schema cache|42P01|PGRST205/i.test(String(e.message || e.code))) return null; throw e; } }
  const posts = await q('feed_posts', 'id,user_id,category,created_at', b => b.gte('created_at', since).limit(5000));
  const reactions = await q('content_reactions', 'target_id,user_id,type,reason_tag,created_at', b => b.is('deleted_at', null).gte('created_at', since).limit(20000));
  const reasons = await q('helpful_reasons', 'target_id,user_id,reason_tag,created_at', b => b.is('deleted_at', null).gte('created_at', since).limit(20000));
  const reactorIds = Array.from(new Set(reactions.map(r => String(r.user_id))));
  const goals = reactorIds.length ? await q('goals', 'user_id,topic,category,title,archived_at', b => b.in('user_id', reactorIds).limit(20000)) : [];
  const pings = await optional(() => q('team_pings', 'source,created_at', b => b.eq('source', 'feed').gte('created_at', since).limit(5000))) || [];
  const users = await optional(() => q('users', 'id,is_bot', b => b.eq('is_bot', true).limit(5000))) || [];
  const settings = await optional(() => q('feed_settings', 'key,value,updated_at'));
  const settingsLog = await optional(() => q('feed_settings_log', 'key,before,after,reason,changed_at', b => b.order('changed_at', { ascending: false }).limit(5)));
  return { posts, reactions, reasons, goals, pings, users, settings, settingsLog };
}

function weekLabel(now) {
  const d = new Date(now); const jan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan) / 864e5 + jan.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(week).padStart(2, '0');
}

async function main(argv) {
  const arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const days = Number(arg('--days')) || 7;
  const now = Date.now();
  const out = arg('--out') || path.join(ROOT, 'reports', 'feed-metrics', weekLabel(now) + '.json');
  const vault = arg('--vault');
  let result;
  const creds = loadCreds();
  if (!creds.url || !creds.key) {
    result = { kind: '피드 주간 유익함 지표', measuredAt: new Date(now).toISOString(), windowDays: days, measured: false, reason: 'SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 없음 — 측정불가', current: null, previous: null, alerts: [] };
  } else {
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(creds.url, creds.key, { auth: { autoRefreshToken: false, persistSession: false } });
    const rows = await fetchRows(sb, now, days);
    result = compute(rows, { now, days });
  }
  const json = JSON.stringify(result, null, 2) + '\n';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, json, { encoding: 'utf8' });
  if (vault) { fs.mkdirSync(vault, { recursive: true }); fs.writeFileSync(path.join(vault, path.basename(out)), json, { encoding: 'utf8' }); fs.writeFileSync(path.join(vault, 'latest.json'), json, { encoding: 'utf8' }); }
  const c = result.current;
  console.log(result.measured
    ? `[피드 지표 ${weekLabel(now)}] 글 ${c.posts} · 도움돼요 비율 ${c.helpfulRatio === null ? 'null' : c.helpfulRatio} · 노하우 비율 ${c.howtoShare === null ? 'null' : c.howtoShare} · 같은 카테고리 ${c.sameCategoryRate === null ? 'null' : c.sameCategoryRate} · 도달 ${c.reach === null ? 'null' : c.reach} · 경보 ${result.alerts.length} → ${out}`
    : `[피드 지표] 측정불가: ${result.reason} → ${out}`);
  return result;
}

module.exports = { compute, windowStats, fetchRows, loadCreds, weekLabel, ALERT };
if (require.main === module) main(process.argv.slice(2)).catch(e => { console.error('[피드 지표] 실패:', e.message || e); process.exitCode = 1; });
