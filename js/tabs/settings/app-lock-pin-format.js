/**
 * OurGoal App Lock PIN Format (설정 — 앱 잠금 PIN 해시 저장 형식 접두)
 *
 * 「[71] 앱 잠금 PIN (이 기기)」 묶음의 PIN 해시 저장 형식 접두(APP_LOCK_PIN_PREFIX). js/tabs/settings/app-lock-pin.js 가 해시를 만들고 검증할 때 L.APP_LOCK_PIN_PREFIX 로 읽는다. window 노출 문은 index.html 원래 자리에 있다.
 * #TASK-ES-541(인라인 3단계 구역 Z5 표준 1): index.html 인라인 IIFE 의 구간(이전 전 3820~3825줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 3820~3825줄(#TASK-ES-541 생성기 표지) ---- */
  /* [#TASK-ES-346 SET-01] 이 기능은 서버 2단계 인증이 아니다. 앱 설정(이 기기의 localStorage)에 PIN 을 두고
     이 기기에서 앱을 새로 열 때 확인하는 '앱 잠금'이다. PIN 원문은 저장하지 않고
     SHA-256(소금 + PIN) 값만 'sha256v1$<소금>$<16진수>' 형태로 settings.twoFactorPin 에 둔다.
     소금 = 설정 당시 uid + 무작위 16바이트 → 게스트→회원 이전 뒤에도 같은 값으로 검증된다.
     예전 판이 평문 4자리로 저장한 PIN 은 첫 검증 성공 때 해시로 바꿔 저장한다(잠김 방지). */
  var APP_LOCK_PIN_PREFIX = 'sha256v1$';

  K.APP_LOCK_PIN_PREFIX = APP_LOCK_PIN_PREFIX;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
