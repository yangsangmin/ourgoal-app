/**
 * [#TASK-ES-362 CAL-03] AI 일정 비서 자연어 파서(parseNaturalScheduleText, js/tabs/calendar/natural-schedule.js) 부품 시험
 *
 * 결함: "내일 오후 3시 치과 예약" → 제목 "내 치과 예약", 날짜 오늘 15:00.
 * 원인: 정규식 \b 는 한글 사이에서 늘 거짓이라 "내일"이 날짜로 읽히지 않았고, 요일 패턴이 "내일"의 "일"을 일요일로 잡았다.
 * 기준일은 두 번째 인자로 고정한다(2026-10-04 일요일, 2026-10-07 수요일 두 날).
 */
'use strict';
const assert = require('assert');
const path = require('path');

console.log('[TEST] calendar-natural-schedule.test.js: starting execution for TASK-ES-362...');

const K = require(path.join(__dirname, '..', 'js', 'tabs', 'calendar', 'natural-schedule.js'));
assert.strictEqual(typeof K.parseNaturalScheduleText, 'function', '일정 키트에 parseNaturalScheduleText 가 있다');

const SUN = new Date(2026, 9, 4, 10, 0); // 2026-10-04 일요일
const WED = new Date(2026, 9, 7, 10, 0); // 2026-10-07 수요일

let passed = 0;
function check(text, now, title, date, why) {
  const r = K.parseNaturalScheduleText(text, now);
  assert.ok(r, why + ' — 결과가 있다: ' + text);
  assert.strictEqual(r.title, title, why + ' — 제목: ' + JSON.stringify(text));
  assert.strictEqual(r.date, date, why + ' — 날짜: ' + JSON.stringify(text));
  passed++;
}

// 1. 이번 결함(노션 CAL-03) — 내일
check('내일 오후 3시 치과 예약', SUN, '치과 예약', '2026-10-05T15:00', 'CAL-03 원문');
check('내일 오후 3시 치과 예약', WED, '치과 예약', '2026-10-08T15:00', 'CAL-03 원문(수요일 기준)');

// 2. 상대 날짜: 오늘·내일·모레·글피·내일모레, 뒤에 붙는 조사
check('오늘 저녁 7시 운동', SUN, '운동', '2026-10-04T19:00', '오늘');
check('모레 회의', SUN, '회의', '2026-10-06', '모레');
check('글피 이사', SUN, '이사', '2026-10-07', '글피');
check('내일모레 오전 10시 면접', SUN, '면접', '2026-10-06T10:00', '내일모레');
check('내일은 휴가', SUN, '휴가', '2026-10-05', '내일 + 조사');
check('내일까지 보고서', SUN, '보고서', '2026-10-05', '내일까지');
check('월간 회의 내일', SUN, '월간 회의', '2026-10-05', '날짜가 뒤에 와도 된다 · "월간"은 월요일이 아니다');

// 3. N일 후 / N일 뒤
check('3일 후 병원', SUN, '병원', '2026-10-07', 'N일 후');
check('5일 뒤에 발표', SUN, '발표', '2026-10-09', 'N일 뒤에');
check('30일 후 갱신', WED, '갱신', '2026-11-06', 'N일 후(달 넘김)');

// 4. 요일 — 이번 주·다음 주 (계산 방식은 이전과 같다: 이번 주는 지난 요일이면 다음 주로, 다음 주는 +7)
check('금요일 오후 2시 팀 회의', SUN, '팀 회의', '2026-10-09T14:00', '요일');
check('토요일에 영화', SUN, '영화', '2026-10-10', '요일 + 조사');
check('일요일 등산', SUN, '등산', '2026-10-04', '오늘이 그 요일');
check('이번주 수요일 치과', SUN, '치과', '2026-10-07', '이번 주 요일');
check('다음 주 월요일 보고서 제출', SUN, '보고서 제출', '2026-10-12', '다음 주 요일');
check('다음주 금 회식', SUN, '회식', '2026-10-16', '다음 주 + 요일 한 글자');
check('월요일 주간 회의', WED, '주간 회의', '2026-10-12', '이번 주에 지난 요일 → 다음 주');

// 5. 요일 글자가 낱말 안에 있으면 요일이 아니다(이전에는 "수학" → 수요일·제목 "학 공부")
check('수학 공부 오후 4시', SUN, '수학 공부', '2026-10-04T16:00', '낱말 속 요일 글자');
check('토익 시험 접수', SUN, '토익 시험 접수', '2026-10-04', '낱말 속 요일 글자(토)');

// 6. 이전에 되던 입력 형태는 그대로 — 기존 화면 시나리오 calendar-agent-schedule("오후 3시 치과 예약") 포함
check('오후 3시 치과 예약', SUN, '치과 예약', '2026-10-04T15:00', '기존 형태: 날짜 없이 시간만');
check('2026-10-20 14:30 미팅', SUN, '미팅', '2026-10-20T14:30', '기존 형태: YYYY-MM-DD HH:mm');
check('12/25 크리스마스', SUN, '크리스마스', '2026-12-25', '기존 형태: M/D');
check('저녁 9시 30분 독서', SUN, '독서', '2026-10-04T21:30', '기존 형태: N시 M분');
check('새벽 12시 알람', SUN, '알람', '2026-10-04T00:00', '기존 형태: 새벽 12시 → 00시');
check('치과', SUN, '치과', '2026-10-04', '기존 형태: 제목만');

// 7. 이전에는 요일 패턴이 "월"을 먼저 먹어 깨지던 명시 날짜
check('10월 15일 오후 3시 치과', SUN, '치과', '2026-10-15T15:00', 'M월 D일');
check('2026년 11월 3일 생일', SUN, '생일', '2026-11-03', 'YYYY년 M월 D일');

// 8. 시간 뒤 조사, 링크 첨부
check('오후 3시에 치과', SUN, '치과', '2026-10-04T15:00', '시간 + 조사');
{
  const r = K.parseNaturalScheduleText('회의 https://zoom.us/j/123 내일 10:00', SUN);
  assert.strictEqual(r.title, '회의', '링크 — 제목');
  assert.strictEqual(r.date, '2026-10-05T10:00', '링크 — 날짜');
  assert.deepStrictEqual(r.attachments, [{ type: 'link', url: 'https://zoom.us/j/123', name: 'https://zoom.us/j/123' }], '링크 첨부');
  passed++;
}

// 9. 빈 입력·기준일 생략
assert.strictEqual(K.parseNaturalScheduleText('   ', SUN), null, '빈 입력은 null');
{
  const r = K.parseNaturalScheduleText('내일 치과');
  const t = new Date(); const tm = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
  const want = tm.getFullYear() + '-' + String(tm.getMonth() + 1).padStart(2, '0') + '-' + String(tm.getDate()).padStart(2, '0');
  assert.strictEqual(r.date, want, '기준일을 안 주면 오늘 기준(호출부 executeCalAgentNaturalSchedule 는 인자 1개로 부른다)');
  assert.strictEqual(r.title, '치과');
  passed++;
}

console.log('ok · AI 일정 비서 자연어 파서 시험 ' + passed + '건 통과');
