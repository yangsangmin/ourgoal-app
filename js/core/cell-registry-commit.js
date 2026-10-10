/**
 * OurGoal Cell Registry Commit (세포 등록 기관의 own 적용 시점 — index.html 인라인 IIFE 바로 앞에서 한 번)
 *
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1절 own 모드 · #TASK-ES-614(B3a).
 * 세포들이 등록 기관(js/core/cell-registry.js)에 등록한 이름을, 기관이 직접 통로(OurgoalAppScope)와 window 에 내주게 한다(OurgoalCellRegistry.commit()).
 *
 * 왜 따로 있는가(시점): 같은 window 이름을 세포 말고 다른 바깥 파일도 쓰는 경우가 있고, 지금까지는 맨 뒤에 도는 인라인 IIFE 가 그 이름을 다시 덮어 이겼다.
 *   기관이 세포 로드 때 바로 내주면 그 뒤에 로드되는 파일이 이겨 승자가 뒤집힌다. 그래서 바깥 스크립트가 전부 로드된 뒤 — IIFE 바로 앞 — 에 한 번만 내준다.
 *   이 태그와 IIFE 사이에는 다른 태그를 두지 않는다.
 * 이 파일은 전역을 만들지 않는다. 기관이 없으면(파일 단독 로드) 아무것도 하지 않는다.
 */
(function (global) {
  'use strict';
  var R = global.OurgoalCellRegistry;
  if (R && typeof R.commit === 'function') R.commit();
})(typeof window !== 'undefined' ? window : globalThis);
