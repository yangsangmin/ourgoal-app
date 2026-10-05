/**
 * OurGoal Starter Goal Templates (목표 — 갓생 스타터 목표 템플릿 상수)
 *
 * 「신규 유저 10초 활성화: 갓생 스타터 목표 템플릿」 묶음의 상수 STARTER_GOAL_TEMPLATES(js/tabs/goals/starter-goal.js 의 quickCreateStarterGoal 이 L. 로 읽는다).
 * #TASK-ES-548(인라인 3단계 구역 Z5 표준 2): index.html 인라인 IIFE 의 구간(이전 전 6243~6281줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 6243~6281줄(#TASK-ES-548 생성기 표지) ---- */
  /* ============ 신규 유저 10초 활성화: 갓생 스타터 목표 템플릿 ============ */
  var STARTER_GOAL_TEMPLATES = {
    workout: {
      title: '주 3회 헬스 & 기초체력 기르기',
      category: 'workout',
      milestones: [
        { title: '운동 전후 스트레칭 5분', status: 'todo' },
        { title: '웨이트 또는 유산소 30분 집중', status: 'todo' },
        { title: '운동 후 단백질 및 수분 챙기기', status: 'todo' }
      ]
    },
    running: {
      title: '매일 3km 러닝 & 심폐지구력',
      category: 'workout',
      milestones: [
        { title: '러닝화 신고 밖으로 나가기', status: 'todo' },
        { title: '3km 페이스 유지하며 완주', status: 'todo' },
        { title: '러닝 후 쿨다운 걷기 및 수분 보충', status: 'todo' }
      ]
    },
    study: {
      title: '매일 1시간 몰입 & 자격증 합격',
      category: 'study',
      milestones: [
        { title: '스마트폰 치우고 1시간 집중 몰입', status: 'todo' },
        { title: '기출문제 1회분 풀고 채점', status: 'todo' },
        { title: '핵심 오답 정리 및 내일 복습 체크', status: 'todo' }
      ]
    },
    reading: {
      title: '하루 15분 독서 & 지적 성장',
      category: 'reading',
      milestones: [
        { title: '잠들기 전 책 15분 읽기', status: 'todo' },
        { title: '마음에 와닿는 문장 1줄 기록', status: 'todo' },
        { title: '이번 주 1권 완독하기', status: 'todo' }
      ]
    }
  };

  K.STARTER_GOAL_TEMPLATES = STARTER_GOAL_TEMPLATES;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
