# REQ — #TASK-ES-520 인라인 3단계 Z4 이동 1차: FN_NAMES 묶음 5개를 기록·목표 탭 세포 4개로 동작 그대로 이전

- 근거: 헌법 CELL_SPLIT·CELL_SPLIT_PROOF, `docs/architecture/INLINE-STAGE3-DESIGN.md` 4절(「이미 풀림」 — smoke FN_NAMES 는 합본 읽기)·6절 Z4, 시험지 선행 #TASK-ES-519(PR #803, 병합), 작업참고 기준 PR #802(L001·L005·L015·L016·L021·L026·L046).
- 작업 유형(SNOWBALL): (가) 표준 — 생성기 `gen-inline-hard.js` 표준 이음매(L016), 게스트 시나리오(L001), tests 전후(L021), 게스트 조작 비교 기준1·후·기준2(L026). 이탈 없음. 머리 이음매 자리 H3 `[기본값]`(키트 `_goalsKit`·`_recordsKit` 선언 줄이 자리보다 앞 — L046 확인: 가져오기 줄 2790~ > 키트 선언 2383·2454).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
Z4 구역의 smoke FN_NAMES 묶음을 index.html 인라인에서 세포로 옮긴다(옮기기 — 동작 0 변경). 이번 PR 의 묶음:

| 묶음(제목) | 새 세포 | 옮긴 것 | 원래 자리에 남긴 것 |
|---|---|---|---|
| 목표 보관(기록으로 옮기기) | `js/tabs/goals/goal-archive.js` | restoreGoal · goalAchievement · renderArchivedGoals · 로드 중 문 2개 감쌈(bindArchivedPeriodSetter·bindArchivedPageSetter — window.setArchivedPeriod/Page 함수 대입, 원래 자리에서 부름) | 구획 주석 |
| 기록 히트맵 (GitHub 히트맵 스타일) | `js/tabs/records/record-heatmap-levels.js` | HEATMAP_WEEKS · HEATMAP_LEVELS · heatmapLevel · filterRecordsByQuery | — |
| 전문 템플릿 실시간 자동 집계 엔진 (혁신 1) + 📈 표 기록 기반 일자별 자동 성장 추이 차트 | `js/tabs/records/table-analytics-engine.js`(계산 책임 하나) | computeTableAnalytics · computeTrendChartData | — |
| TASK-ES-307: 측정지표 다중 선택 및 동시 렌더링 엔진 | `js/tabs/records/trend-multi-metric-svg.js` | renderMultiMetricSvg | window.TREND_METRICS · window.renderMultiMetricSvg 노출 줄 |

생성기 산출(작업자 측정): 옮김 10 · 감쌈 2 · 남김 2, 새 파일 206·58·309·81줄(`reports/TASK-ES-520/gen-meta.json`).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: index.html 인라인 미분화 덩어리에서 책임 단위 세포를 떼어 낸다.
- **원인**: 이 묶음들은 smoke-test FN_NAMES·구간 절단 시험지 때문에 앞 단계에서 남았다 — 합본 읽기(#751·#465)와 #TASK-ES-519 선행으로 풀렸다.
- **중심**: 생성기로 글자 그대로 옮기고(이름 참조에 `L.` 접두만), 노출 줄·상태는 원래 자리.
- **핵심**: 게스트로 닿는 화면 경로를 세포마다 시나리오 하나로 잰다 — 4세포 모두 게스트 화면으로 닿는다(로그인 뒤 경로 없음, 실계정 비교 불필요).

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-stage3-z4-b.json`(자리 H3) → `gen-inline-hard.js` → `verify-inline-hard.js` → 단독 로드(`module-load-stage3-z4.js`) → 신고서(`module-specs --write`)·`cell-descriptions.json` → tests 전후 → 게스트 조작 비교 → 게스트 시나리오 4개 로컬 기준·작업.

## 4. [원칙 ④] 재검토 — 한계·남긴 묶음
- **「목표 일정 리스케일링」(rescaleGoal)은 이번에 옮기지 않았다**: 호출부가 저장소 전체에 0 이다(grep — index.html·js 모두 정의 줄과 smoke FN_NAMES 뿐). 화면 동작이 없어 게스트 시나리오로 잴 수 없고, 화면 파일에 글자 확인 주장만 내면 L001 의 막다른 길이다. 죽은 함수 — 지울지는 승인선 ③(결함 목록·결심 후보).
- window.setArchivedPeriod/Page(감싼 문)는 보관 목표 4개 이상일 때만 단추가 보여 시나리오에서 누르지 않았다. 감싼 본문은 verify 의 토큰 동일·부르는 줄 위치(③·⑦)로 잰다.

## 5. [원칙 ⑤] 절차
2절 표대로. push 직전 origin/main 합치기, 충돌 시 main 판 index.html 로 생성기 재실행(L010).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 "표 집계와 추이 계산을 한 세포에 넣으면 묶음 경계를 섞는다" → 둘 다 표 기록을 숫자로 바꾸는 계산 책임이고(추이 계산이 집계 함수를 부른다 — 같은 세포 안 이름이라 `L.` 통로가 필요 없다), 그리는 쪽은 이미 `table-analytics-view.js` 로 나뉘어 있다. 책임 단위 분할이다(줄 수 분할 아님).
- 반론 2 "게스트 시나리오가 기준에서도 통과하면 증명이 아니다" → 옮기기 PR 은 「고칠 게 없었음」이 정상(L005). 동작 동일은 토큰 동일·남은 글자 동일(verify)·게스트 조작 비교 0·tests 종료 코드 동일로 함께 잰다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#archivedGoals`·`#sRecArchiveBtn`·`[data-restore]`·`#recSearchInput`·`#recordsList`·`#recordHeatmap .heatmap-cell.active`·`#proAnalyticsBanner`·`#proTableBody .pro-tpl-cell-input`·`#proTrendChartWrap .pro-trend-filter-chip`·`#chartContainer svg.trend-multi-svg` · 함수 위 2절 표 · 파일 2절 표 + 설정·도구 `docs/design/harness/module-split/{inline-stage3-z4-b.json, module-load-stage3-z4.js, real-account-stage3-z4-b-steps.json}`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 측정 | 결과 |
|---|---|
| verify | ok — 토큰 동일·덩어리 줄 동일·남은 글자 동일·누수 0·this/arguments 0·이중 처리기 0·800줄 이하 (`verify-inline-hard.json`) |
| 단독 로드 | 회귀 0, 새 파일 4개 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests 115개 종료 코드 기준 사본 = 작업 트리(`test-compare.json` exitCodesSame). 출력이 다른 3개는 경로·파일 수 출력 차이(git archive 사본) |
| 게스트 조작 비교 | 6단계(홈·기록·히트맵·실천추이·보관함·목표) 기준1 대 작업 0 · 기준1 대 기준2 0 (43값, `guest-compare.json`) |
| 게스트 시나리오 | 4개 기준·작업 통과 (`scenario-local.json`) |

발견 결함(옮기기는 고치지 않음 — 그대로 옮김):
1. `computeTrendChartData`(table-analytics-engine.js): 같은 템플릿 표 기록이 2개 이상이면 지역 변수 선언 없이 `val` 에 대입·비교한다 — 엄격 모드라 ReferenceError(성장 추이 차트가 그 경우 안 그려질 수 있음). verify 의 globals 목록에 `val` 로 드러남. 고치기 티켓 후보.
2. `rescaleGoal`: 호출부 0(죽은 함수). 삭제 여부 결심 후보(③).
