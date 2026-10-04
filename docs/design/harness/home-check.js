'use strict';
/* 홈 점검 하네스 — 호환 래퍼 (TASK-ES-342 에서 만들고 TASK-ES-349 · 노션 CORE-01 에서 공통 도구로 넘김)
 * 실제 측정은 6개 탭 공통 도구 tab-check.js 가 한다. 이 파일은 예전 명령이 그대로 돌도록 인자를 넘기기만 한다.
 *
 * 사용(예전과 같음): node home-check.js <APP_DIR> <outDir> [tab] [--summary <file.json>]
 *   tab 을 안 주면 home. 결과는 예전처럼 <outDir>/<tab>-check.json 과 장별 PNG.
 *   새 선택지 --deadclick rep|all|off 도 그대로 넘어간다(기본 rep: 대표 장에서 자동 클릭 Dead-Click 탐지).
 * 달라진 점: --summary 요약 JSON 의 모양이 tab-check.js 형식(tabs.<탭>.shots …)이다.
 *   이미 저장소에 있는 out-home-2026-10-04.json(TASK-ES-342 결과)은 다시 쓰지 않는다.
 */
const { main } = require('./tab-check.js');

main(process.argv.slice(2), 'home-check.js').catch(e => { console.error(e); process.exit(1); });
