# TASK-ES-576 오늘 미션 해시·카드 렌더 분열

작업참고 기준 PR #836 (c34a0568b99f6423b929622f022e495c9dd497ac). 기준 origin/main c34a0568b99f6423b929622f022e495c9dd497ac.
표준 분열(L001·L002·L005·L006·L015·L016·L019·L021·L009).

## 1. [원칙 ①] 문제 정확히 파악
index.html의 `computeTodayMissionHash(g)`(5351줄)와 `renderTodayMissionCard()`(5361줄) 두 함수가 인라인 미분화 스크립트에 남아 있다.
- `computeTodayMissionHash(g)`: 목표 상태 해시(computeGoalStatusHash)와 관련 최신 기록 ID·시각을 결합하여 변경 여부를 감지한다.
- `renderTodayMissionCard()`: 활성 목표 필터, 날짜 및 해시 캐시 판별, 미션 카드 및 더보기 UI 렌더링, 더보기 토글 바인딩, pending 중복 억제, requestTodayMission 비동기 호출 후 settings.todayMissions 저장 및 재렌더를 담당한다.
- 실제 호출부: `js/tabs/home/home-render.js:27` (L.renderTodayMissionCard), `js/core/date-rollover.js:29` (자정 갱신), `js/tabs/home/sub-today.js:50~51` (있을 때 global 호출), 내부 더보기 토글/비동기 응답 후 재호출.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 오늘 목표 시트(#homeDetailSheet) 안에서 렌더되는 오늘 미션 카드 한 책임.
- 원인: 이전 분열 작업들에서 조건부 AI 요청 관련 핵심 렌더러가 인라인에 보존되어 남아 있었음.
- 중심: 기존 키트(`OurgoalHomeMegaBlock` / `_homeKit`), `window.computeTodayMissionHash` 전역 노출, 캐시 판별 및 저장 순서의 무손실 보존.
- 핵심: 두 함수만 `js/tabs/home/today-mission.js`로 원문 이전하고, 실제 게스트 환경에서 목표 없는 상태 빈 카드 처리, 목표 2개 생성 후 미션 카드 헤더·아코디언 펼침/접기/닫기 동작을 기준과 동일하게 측정·증명하는 것.

## 3. [원칙 ③] 해결방식
`docs/design/harness/module-split/inline-today576.json` 설정과 `gen-inline-hard.js` 스코프 분석 생성기를 사용하여 `js/tabs/home/today-mission.js`를 생성한다.
- 키트: `OurgoalHomeMegaBlock`, 키트 변수: `_homeKit`.
- `js/tabs/home/index.js`가 키트를 통째 대입하므로 `afterTag: "<script src=\"js/tabs/home/index.js\"></script>"`로 그 뒤에 배치한다.
- `requestTodayMission`, `localTodayMission`, `computeGoalStatusHash` 등은 기존 세포의 책임이므로 이번 분열 범위에 포함하지 않고 보존한다.

## 4. [원칙 ④] 재검토
- 시험지 선행 파일: `today-mission-next-design.md` 실측 결과 선행 파일 목록은 빈 목록이다.
- `tests/ai-conditional-call-optimization.test.js`와 `tests/today-mission-card-guide.test.js`는 이미 `inline-bundle`을 사용하므로 분열 후에도 새 세포를 함께 읽는다.
- `scripts/smoke-test.js`는 `APP_SRC` 합본을 읽는다.
- 신규 파일(`js/tabs/home/today-mission.js`)은 800줄 상한선(약 120줄 예상)을 엄격히 준수한다.
- 최상위 `this`/`arguments` 사용 없음.

## 5. [원칙 ⑤] 절차
1. 실제 UI 게스트 조작 절차:
   - 게스트 시작: `#btnLandingPreviewDirect` 클릭
   - 빈 카드 확인: `#homeCompassQuest` 클릭 -> `#homeDetailSheet` 열림 -> 목표 없는 `#todayMissionCard` 빈 상태 확인 -> `#homeDetailClose` 클릭
   - 추천 목표 2개 추가: `.navbtn[data-tab="goals"]` 클릭 -> 서로 다른 추천 카드의 `.btn-quick-adopt-goal`을 실제 2회 클릭하여 2개 활성 목표 확인
   - 오늘 미션 카드 확인: `.navbtn[data-tab="home"]` 클릭 -> `#homeCompassQuest` 클릭 -> `#todayMissionCard` 헤더, 목표 제목, 미션 문구, 첫 번째 목표 행, `#missionRestList` 접힘 상태 확인
   - 아코디언 토글 조작: `#btnToggleMissionAccordion` 클릭으로 펼침 -> 다시 클릭하여 접힘 -> `#homeDetailClose` 닫기
2. 기준 2회(base1, base2) vs 작업 1회(after) 측정: 화면, 저장값(localStorage), 토스트, 콘솔 에러 동일성 확인.
3. 대상 함수 실제 실행 계측: 함수 직접 호출이 아닌 실제 UI 조작 흐름에 의한 호출 횟수 측정.
4. AI API 격리: 테스트 시 로컬 API 503 fallback으로 기존 `localTodayMission` 경로를 관찰하며 외부 유료 AI 호출/데이터 전송 차단.
5. 표준 탭 하네스 비교 및 npm test 전체 전후 비교 수행.

## 6. [원칙 ⑥] 절차 재검증
- 반론 1: 빈 카드 상태만 확인해도 분열 검증이 충분하다.
  - 격파: 목표가 0개면 `renderTodayMissionCard`가 즉시 빈 문자열을 반환하여 카드 내부 UI와 아코디언 배선이 전혀 실행되지 않는다. 따라서 추천 목표 2개를 실제 UI로 추가하여 카드와 아코디언 펼침/접기까지 완전히 조작해야 한다.
- 반론 2: 실제 유료 AI API를 호출해야 미션 카드 동작이 완전 증명된다.
  - 격파: 이번 작업은 원문 분열이며, 기존에도 네트워크 오류 시 로컬 fallback(`localTodayMission`)으로 안전하게 동작하도록 설계되어 있다. API 실패 시 fallback 동작을 기준과 작업에서 동일하게 관찰함으로써 외부 유료 호출 및 데이터 오염 없이 카드 렌더, 캐시 저장, 재렌더 경로를 완전하게 증명할 수 있다.

## 7. [원칙 ⑦] 단계별 실행
- 1단계: 인계 및 최신 main(c34a0568) 동기화, 설계 전제 확인, task-link 갱신
- 2단계: 스코프 분석 생성기로 `js/tabs/home/today-mission.js` 분열, `modules.json` 갱신
- 3단계: 원문 보존 검증(`verify-inline-hard.js`), 단독 로드 탐침, 앱 부팅 회귀 0 측정
- 4단계: 실제 UI 게스트 조작 비교 (2+1), 표준 탭 하네스 비교 (2+1), npm 전체 시험 비교
- 5단계: claims.json 및 상대경로 시나리오 작성, 정상 훅 커밋 및 PR 생성, 독립 법정 심사 확인
- 6단계: 검토 인계문 작성 및 보고 (병합하지 않음)

## 8. [원칙 ⑧] 막히는 지점 예상
- 카드 슬롯 `#todayMissionCard`는 홈 첫 화면의 직접 자식일 때 숨김 CSS가 적용되지만, `sub-onescreen.js`가 `#homeSheetPanelQuest`로 노드째 이동시켜 시트 안에서 정상 노출된다. 화면 은폐로 오인하지 않고 실제 시트 안에서 가시성을 검증한다.
- 추천 목표 2개 추가 시 버튼 선택기가 유일하게 클릭되도록 정확한 DOM 쿼리를 사용한다.
- 날짜/시간(nowISO), 캐시 해시, 임의 ID 등 정상 변동 요인은 정규화 규칙을 명확히 기록하고 원시 데이터를 보존한다.
