### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서
* **Task ID**: TASK-ES-576

#### [블록 1] 개요
홈 화면의 오늘 미션 해시 계산과 카드 렌더를 담당하는 `computeTodayMissionHash`와 `renderTodayMissionCard`를 기존 홈 탭 키트(`OurgoalHomeMegaBlock`)의 책임 파일 `js/tabs/home/today-mission.js`로 원문 분열한다. 기존 동작을 100% 보존한다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
기준 작업참고 PR #836 (c34a0568). `docs/specs/REQ-TASK-ES-576-TODAY-MISSION.md`, `.claude/plan-TASK-ES-576.md`.
함수: `computeTodayMissionHash(g)`, `renderTodayMissionCard()`.
호출: `index.html` 렌더 파이프라인, 홈 퀘스트 나침반 `#homeCompassQuest`, 오늘 미션 카드 `#todayMissionCard`, 더보기 아코디언 `#btnToggleMissionAccordion`, 잔여 목록 `#missionRestList`.
PLAN은 4단계 심사 청구까지다.

#### [블록 3] 핵심 변경사항
스코프 분석 생성기 `inline-today576.json`으로 `index.html`에서 `js/tabs/home/today-mission.js`로 이전.
기존 홈 키트(`OurgoalHomeMegaBlock`) 및 `OurgoalAppScope` 이음매와 window 노출 유지. 홈 키트를 통째 대입하는 `js/tabs/home/index.js` 뒤에 `<script src="js/tabs/home/today-mission.js">`를 배치하여 덮어쓰기 방어.
토큰 동일(`tokenCount: 466`), 남은 원문 동일, 누수 0, setter 누락 0, 이중처리기 0, 단독 로드(`OurgoalHomeMegaBlock`) 정상, 회귀 0.
모듈 신고서 `modules.json` 및 `cell-descriptions.json` 갱신 (총 337개 세포).
인라인 스크립트 줄 수 6007 → 5942 (-65), 함수 수 74 → 71 (-3), 전역 직접 대입 260 유지.
지도 4종(baseline, cell-map, inline-script-map 2종) main 판 유지. 시험·금고·헌법·API 변경 0.

#### [블록 4] Claims (주장) 및 독립 검토 교정 측정 결과
`reports/TASK-ES-576/claims.json`은 실제 화면 동작과 config 기록을 명확히 구분한다 (L001/L002 준수, C1 ui-behavior, C2~C20 config 정적 적재 검증).
작업자 측정 및 독립 검토 피드백 반영 완료:
- 추천 목표 2개 실제 마우스 클릭 채택: 1번째 '10km 마라톤 완주 로드맵' 실제 마우스 클릭 채택, 2번째 목표 화면 헤더 '활용가이드' 창(#modalSheet)의 '정보처리기사 실기 합격' 실제 마우스 클릭 채택 (`today-mission-ui576.js`).
- 실제 대상 함수 호출 수: 19 / 19 / 19 일치. pageerrors: 0 / 0 / 0. completed: true / true / true.
- 함수 직접 호출, 함수 교체, wrap, 상태 주입 일체 없음.
- 1:1 ID 정규화 및 불변식 검증: guest, goal, milestone, schedule, record ID를 전단사(bijective) 1:1 정규화 맵으로 치환하고, 목표·미션·요약의 항목 수와 연결 관계(`schedule.linkedGoalId === goal.id`, `schedule.linkedId === milestone.id`, `todayMissions[goal.id]`, `goalStatusSummaries[goal.id]`)가 정규화 전후 엄격히 보존됨을 단언 검증 (`invariantsPreserved: true`).
- 해시 차이 원인 수학적 입증: 해시를 삭제하거나 상수로 바꾸지 않고, 기존 계산식(`computeGoalStatusHash`, `computeTodayMissionHash`)과 전수 대조하여 100% 일치 확인 (`allFormulaChecksPassed: true`). 대조군 마일스톤 ID를 대체한 반사실적 대조(`proveHashDifferenceCause`)에서 계산식이 base2 및 after의 실제 해시와 일치함을 증명.
- 비교 결과: 비-해시 차이 0개 (`baselineNonHashDiffs: 0`, `afterNonHashDiffs: 0`). 해시 차이 30개(2개 목표 × 3개 해시 × 5스텝)는 Date.now() 마일스톤 ID 전파임이 수식 대조로 증명됨.
- 법정 시나리오 `today-mission-actual-ui`: 기준/작업 양쪽 통과 (`allPassedBoth: true`, `nonVacuousExpects: 11`).
- 표준 탭 하네스: 24장 샷 비교 결과 408개 지표 차이 0 (`differingValues: 0`).
- npm test 양쪽 종료코드 0, smoke-test 440/0, 무결성 게이트 38/38 ALL PASS. 115개 전체 시험 비교 회귀 0건 (`exitDiff: []`). 기존 실패 27건은 기준과 동일하게 유지되어 전체 개별 시험 성공을 주장하지 않음.
- 원시 로그는 로컬에 보존하고 게시 로그의 URL apikey만 가림. 원시/게시 sha256 해시 구분 및 publication 기록 적재 (`proof.json`).
- 최종 판정은 GitHub 독립 법정만 낸다.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)
판정: 확인 부족(막지는 않지만, 확인 못 한 채 나가는 것이 있습니다) — 작업자가 적어 낸 지시 항목 3건 중 1건은 필요한 수준까지 확인하지 못했습니다
상민님이 하실 일: 배포를 결정하실 수 있습니다. 다만 확인 못 한 채 나가는 것이 있습니다: R1 실제 오늘 미션 카드 렌더 및 미션 해시 계산 원문을 보존한다. — 고칠 게 없었음 · 필요한 확인: PC 화면에서 눌러 봄
작업자가 적어 낸 지시 항목 3건 중: 글자만 확인(이 종류는 그걸로 충분) 2 · 고칠 게 없었음 1
심사 대상 커밋 bd707af (기준 c34a056) · 판정번호 0C636618 · GitHub 에서 법정이 직접 실행(작업자 PC 밖 · 실행 번호 37447241361) · 이 PR 돌려보냄 누적 1회
GitHub court 검사 결론: success(통과 또는 확인 부족) · https://github.com/yangsangmin/ourgoal-app/actions/runs/37447241361/job/112214926810
이번 범위는 PR 작성과 독립 법정 판정 확인까지이며 main에 병합하지 않고 종료함.
