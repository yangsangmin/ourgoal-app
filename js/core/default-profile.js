/**
 * 기본 프로필 생성
 *
 * 기존 게스트·로그인 진입의 기본 프로필 구조와 설정 초기값을 동작 그대로 생성한다.
 * #TASK-ES-574(기본 프로필 생성 책임 분열): index.html 인라인 IIFE 의 구간(이전 전 3612~3625줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 3612~3625줄(#TASK-ES-574 생성기 표지) ---- */
  /* 원문 AST 끝 3625:3 · defaultProfile · 같은 줄 window 노출 보존 */
  /* [#TASK-ES-522] totalCompletedMilestones → js/core/profile-load.js 로 옮김(인라인 3단계 Z1 로그인·계정 2차 — 앞 주석 포함) */
  /* [#TASK-ES-482] badgeContext · BADGES · openHallOfFame → js/core/badges.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  function defaultProfile(id, username, displayName){
    return {
      id: id, username: username, displayName: displayName,
      bio: '', avatarUrl: '', interests: [], region: '', regionPublic: false,
      schemaVersion: 1, createdAt: L.nowISO(),
      goals: [],
      records: [],
      companions: [],
      settings: L.defaultSettings()
    };
  }

  K.defaultProfile = defaultProfile;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
