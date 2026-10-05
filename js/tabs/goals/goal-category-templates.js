/**
 * OurGoal Goal Category Templates (목표 — 목표 종류별 기본 마일스톤·온보딩 프리셋·퀵 액션·결과 단위 상수)
 *
 * 「Goal category templates」 묶음의 상수 GOAL_TEMPLATES(새 목표 직접 설정 창의 종류 칸·템플릿 마일스톤)·ONBOARDING_PRESETS·QUICK_ACTIONS_BY_CAT, 「결과 기록 (체크박스 대신 수치 입력)」 묶음의 RESULT_UNITS.
 * ONBOARDING_PRESETS·QUICK_ACTIONS_BY_CAT·RESULT_UNITS 는 지금 부르는 곳이 0 이다(그대로 옮김 — 발견 목록).
 * #TASK-ES-541(인라인 3단계 구역 Z5 표준 1): index.html 인라인 IIFE 의 구간(이전 전 4375~4382 · 4383~4391 · 4392~4399 · 5339~5340줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 4375~4382줄(#TASK-ES-541 생성기 표지) ---- */
  var GOAL_TEMPLATES = {
    study:    { label:'공부', icon:'📚', ms:['학습 계획 세우기','1회독 끝내기','기출문제 풀어보기','약점 보완하기','최종 점검'] },
    exercise: { label:'운동', icon:'💪', ms:['현재 기록 재보기','주 3회 루틴 만들기','1개월차 기록 갱신','2개월차 기록 갱신','목표 기록 달성'] },
    business: { label:'사업', icon:'💼', ms:['아이디어 검증하기','MVP 만들기','첫 고객 확보하기','수익 모델 정하기','매출 목표 달성'] },
    exam:     { label:'시험', icon:'📝', ms:['시험 범위 파악하기','기본서 1회독','기출문제 분석','모의고사 반복','최종 정리'] },
    travel:   { label:'여행', icon:'✈️', ms:['목적지·일정 정하기','예산 짜기','항공·숙소 예약하기','일정표 완성하기','짐 싸기'] },
    etc:      { label:'기타', icon:'🎯', ms:['목표 구체화 및 실행 준비', '매일 작은 실천 루틴 지속', '중간 점검 및 최종 성과 완성'] }
  };
  /* ---- 이전 전 index.html 4383~4391줄(#TASK-ES-541 생성기 표지) ---- */
  /* [#TASK-ES-437] templateMilestones → js/tabs/goals/template-quick-import.js 로 옮김(인라인 스크립트 세포화 P0) */

  /* 60초 온보딩 추천 목표 프리셋 & 퀵 액션 칩 (TASK-BG-3.5, TASK-RD-T010) */
  var ONBOARDING_PRESETS = [
    { label: '매일 30분 운동하기', title: '매일 30분 운동하기', category: 'exercise', topic: 'workout' },
    { label: '자격증 / 어학 매일 1강', title: '자격증 / 어학 매일 1강 완강', category: 'study', topic: 'study' },
    { label: '사이드 프로젝트 / 코딩', title: '사이드 프로젝트 완성하기', category: 'business', topic: 'career' },
    { label: '매일 시험 기출문제 풀기', title: '매일 시험 기출문제 풀기', category: 'exam', topic: 'study' }
  ];
  /* ---- 이전 전 index.html 4392~4399줄(#TASK-ES-541 생성기 표지) ---- */
  var QUICK_ACTIONS_BY_CAT = {
    exercise: ['오늘 30분 런닝 완료 🏃', '헬스장 출석 및 하체 운동 완료 💪', '가벼운 스트레칭과 홈트 🧘'],
    study: ['강의 1강 수강 완료 📖', '핵심 요약노트 정리 ✍️', '취침 전 10분 독서 📚'],
    business: ['기능 1개 구현 및 커밋 💻', '아이디어 기획안 작성 📄', '시장 조사 아티클 정독 📑'],
    exam: ['기출문제 1회분 풀이 ✏️', '영단어 50개 암기 완료 🔤', '오답노트 복습 🔍'],
    travel: ['여행 일정표 정리 ✈️', '숙소 및 교통편 예약 🏨'],
    etc: ['오늘 할 일 1개 완료 🎯', '하루 감사일기 작성 📝']
  };

  /* ---- 이전 전 index.html 5339~5340줄(#TASK-ES-541 생성기 표지) ---- */
  /* ============ 결과 기록 (체크박스 대신 수치 입력) ============ */
  var RESULT_UNITS = ['회','일','페이지','분','시간','km','kg','개','%'];

  K.GOAL_TEMPLATES = GOAL_TEMPLATES;
  K.ONBOARDING_PRESETS = ONBOARDING_PRESETS;
  K.QUICK_ACTIONS_BY_CAT = QUICK_ACTIONS_BY_CAT;
  K.RESULT_UNITS = RESULT_UNITS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
