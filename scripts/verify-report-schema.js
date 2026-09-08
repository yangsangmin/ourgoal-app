#!/usr/bin/env node
/*
 * 신고·자동 숨김(실행계획 순서 24·36) 서버 스키마가 실제로 적용됐는지 Supabase REST 로 잰다.
 * 실행: node scripts/verify-report-schema.js
 *
 * 왜 있나: docs/sql/2026-09-08-hidden-rls.sql 은 사람이 SQL Editor 에 붙여넣어야 실행된다.
 * "실행했다"는 말이 아니라 응답 코드로 확인한다. 2026-09-08 에 '완료' 표시된 항목이 실제로는
 * 서버 쪽이 통째로 없었던 적이 있다(hidden 42703, content_reports PGRST205, report_content PGRST202).
 *
 * anon 키로만 잰다. 그래서 잴 수 있는 것과 없는 것을 구분한다:
 *   잴 수 있음 — hidden 컬럼 존재, content_reports 테이블 존재, report_content 함수 존재
 *   잴 수 없음 — select 정책이 숨긴 행을 실제로 거르는지(로그인 사용자 3명이 필요) → '측정불가'
 *
 * 종료코드: 0 = 네 항목 모두 적용, 1 = 하나라도 미적용, 2 = 네트워크 오류(판정 불가)
 */
'use strict';

const SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cW9zdmlxYmNpb2hjeXdremJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MTM0NDYsImV4cCI6MjEwMzk4OTQ0Nn0.DCMMxxHB6kzJ0CjgLN0ERaSk7WY6LDN-pDVdeZ0-cWM';

// 각 항목: 어떤 요청을 보내고, 어떤 응답이 '적용됨'인지.
// PostgREST 오류 코드가 판정 근거다 — 42703 컬럼 없음, PGRST205 테이블 없음, PGRST202 함수 없음.
const CHECKS = [
  { name: 'feed_posts.hidden 컬럼',    path: 'rest/v1/feed_posts?select=hidden&limit=1',    method: 'GET' },
  { name: 'team_comments.hidden 컬럼', path: 'rest/v1/team_comments?select=hidden&limit=1', method: 'GET' },
  { name: 'content_reports 테이블',    path: 'rest/v1/content_reports?select=id&limit=1',   method: 'GET' },
  { name: 'report_content RPC',        path: 'rest/v1/rpc/report_content',                  method: 'POST',
    body: { p_target_type: 'feed_post', p_target_id: 'probe', p_reason: '' } },
];

/**
 * 응답 하나를 판정한다. 순수 함수 — 스모크 테스트가 이것만 검사한다.
 * @param {number} status HTTP 상태
 * @param {object|null} json 응답 본문(JSON 이면)
 * @returns {{ applied: boolean|null, why: string }}  applied: true 적용 / false 미적용 / null 판정불가
 */
function classify(status, json) {
  const code = json && json.code;
  if (code === '42703')    return { applied: false, why: '컬럼 없음(42703)' };
  if (code === 'PGRST205') return { applied: false, why: '테이블 없음(PGRST205)' };
  if (code === 'PGRST202') return { applied: false, why: '함수 없음(PGRST202)' };
  // 42501: 함수는 있는데 anon 에 execute 권한이 없다 — 설계대로(authenticated 만 허용).
  if (code === '42501')    return { applied: true,  why: '함수 존재, anon 거부(42501) — 설계대로' };
  if (status === 200)      return { applied: true,  why: '200' };
  if (status === 401 || status === 403) return { applied: true, why: String(status) + ' — 객체는 존재' };
  return { applied: null, why: '예상 밖 응답 ' + status + (code ? ' ' + code : '') };
}

async function probe(check) {
  const res = await fetch(SUPABASE_URL + '/' + check.path, {
    method: check.method,
    headers: {
      apikey: ANON_KEY,
      Authorization: 'Bearer ' + ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: check.body ? JSON.stringify(check.body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* 본문이 JSON 이 아니면 상태 코드로만 판정 */ }
  return { status: res.status, json };
}

async function main() {
  const rows = [];
  for (const c of CHECKS) {
    let r;
    try { r = await probe(c); }
    catch (err) {
      console.error('네트워크 오류: ' + c.name + ' — ' + (err && err.message));
      process.exit(2);
    }
    const v = classify(r.status, r.json);
    rows.push({ 항목: c.name, 상태: r.status, 판정: v.applied === null ? '판정불가' : (v.applied ? '적용' : '미적용'), 근거: v.why });
  }
  rows.push({ 항목: 'select 정책이 숨긴 행을 거름', 상태: null, 판정: '측정불가', 근거: 'anon 키로는 못 잰다(로그인 사용자 3명 필요)' });
  console.log(new Date().toISOString() + ' ' + SUPABASE_URL);
  console.table(rows);
  const bad = rows.filter(r => r.판정 === '미적용' || r.판정 === '판정불가');
  if (bad.length) {
    console.log('미적용 ' + bad.length + '건 → docs/sql/2026-09-08-hidden-rls.sql 을 Supabase SQL Editor 에서 실행해야 한다.');
    process.exit(1);
  }
  console.log('스키마 4항목 모두 적용됨. 숨김 동작 자체는 로그인 계정으로 따로 확인해야 한다.');
}

module.exports = { classify, CHECKS };
if (require.main === module) main();
