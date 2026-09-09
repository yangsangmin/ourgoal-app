'use strict';
/**
 * docs/sql/*.sql 문법 검사 (실행계획 순서 37, AUD-7 지적)
 *
 * 왜 필요한가:
 *   SQL 은 Supabase 콘솔에 사람이 붙여넣어야 실행된다. 즉 CI 가 돌려보지 않는다.
 *   2026-09-08 에 실제로 `returns int` 줄에서 42601 이 나서 붙여넣기가 통째로 실패했고,
 *   그 사이 사용자는 무엇이 잘못됐는지 알 수 없었다. 실행은 못 하더라도 **읽어서 잡을 수 있는
 *   실수**는 병합 전에 잡아야 한다.
 *
 * 진짜 파서가 아니다. 문자열·주석·달러 인용을 걷어낸 뒤, 확실히 틀린 것만 본다.
 * 애매하면 통과시킨다 — 거짓 경보가 쌓이면 아무도 안 보게 된다.
 */

/**
 * 주석과 리터럴을 공백으로 치환해 구조만 남긴다.
 * 달러 인용 블록($$ ... $$, $tag$ ... $tag$)의 **본문**은 함수 정의라 문법 규칙이 다르므로 통째로 비운다.
 * @returns {{stripped:string, dollarTags:string[], unterminated:string|null}}
 */
function strip(sql) {
  let out = '';
  const tags = [];
  let unterminated = null;
  let i = 0;

  while (i < sql.length) {
    const two = sql.slice(i, i + 2);

    // 줄 주석
    if (two === '--') {
      const nl = sql.indexOf('\n', i);
      const end = nl === -1 ? sql.length : nl;
      out += ' '.repeat(end - i);
      i = end;
      continue;
    }
    // 블록 주석
    if (two === '/*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      out += sql.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    // 작은따옴표 문자열 ('' 는 이스케이프)
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
        if (sql[j] === "'") { j++; break; }
        j++;
      }
      out += sql.slice(i, j).replace(/[^\n]/g, ' ');
      i = j;
      continue;
    }
    // 달러 인용
    const dq = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
    if (dq) {
      const tag = dq[0];
      tags.push(tag);
      const close = sql.indexOf(tag, i + tag.length);
      if (close === -1) {
        unterminated = tag;
        out += sql.slice(i).replace(/[^\n]/g, ' ');
        i = sql.length;
        continue;
      }
      tags.push(tag);
      const stop = close + tag.length;
      out += sql.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    out += sql[i];
    i++;
  }
  return { stripped: out, dollarTags: tags, unterminated };
}

/**
 * @param {string} sql
 * @returns {string[]} 문제 목록. 비어 있으면 통과.
 */
function lintSql(sql) {
  const problems = [];
  const { stripped, dollarTags, unterminated } = strip(String(sql || ''));

  // 1) 달러 인용 짝 — 함수 본문이 안 닫히면 그 뒤 전체가 문자열로 먹힌다
  if (unterminated) {
    problems.push(`달러 인용 ${unterminated} 이 닫히지 않았다`);
  }
  const counts = {};
  for (const t of dollarTags) counts[t] = (counts[t] || 0) + 1;
  for (const [t, n] of Object.entries(counts)) {
    if (n % 2 !== 0) problems.push(`달러 인용 ${t} 의 짝이 맞지 않는다 (${n}회 등장)`);
  }

  // 2) 마지막 문장에 세미콜론이 없다
  const tail = stripped.split(';').pop();
  if (tail && tail.trim()) {
    problems.push(`마지막 문장에 세미콜론이 없다: "${tail.trim().replace(/\s+/g, ' ').slice(0, 60)}"`);
  }

  // 3) create policy 뒤에 on <테이블> 이 없다 — 붙여넣으면 42601 이 난다
  const stmts = stripped.split(';');
  for (const s of stmts) {
    const t = s.replace(/\s+/g, ' ').trim();
    if (!/^create\s+(or\s+replace\s+)?policy\b/i.test(t)) continue;
    if (!/\bon\s+[A-Za-z_"][\w."]*/i.test(t)) {
      problems.push(`create policy 에 on <테이블> 이 없다: "${t.slice(0, 70)}"`);
    }
  }

  // 4) 괄호 짝
  let depth = 0;
  for (const ch of stripped) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) problems.push(`괄호 짝이 맞지 않는다 (${depth > 0 ? '닫는' : '여는'} 괄호 ${Math.abs(depth)}개 부족)`);

  return problems;
}

module.exports = { lintSql, strip };
