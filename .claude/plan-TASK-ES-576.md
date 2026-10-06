# TASK-ES-576 작업계획서: 오늘 미션 해시·카드 렌더 책임 원문 분열

- 기준 PR: #836 (c34a0568b99f6423b929622f022e495c9dd497ac)
- 작업 브랜치: `codex/task-es-576-today-mission`
- 작업 트리: `C:/Users/HP/.codex/worktrees/today-mission-576/ourgoal-app`
- 대상 함수: `computeTodayMissionHash(g)` (index.html:5351), `renderTodayMissionCard()` (index.html:5361)
- 대상 파일: `js/tabs/home/today-mission.js` 생성

## 단계별 체크리스트 (심사 청구까지)
- [x] 1단계: 인계 자료·최신 main(c34a0568 PR #836) 동기화 및 설계 전제 확인, task-link 갱신 (담당: antigravity, 상태: 진행)
- [x] 2단계: 스코프 분석 생성기(inline-today576.json) 실행으로 원문 분열 및 modules.json/cell-descriptions.json 갱신, 무결성 검증 통과 (337개 세포, 새 위반 0)
- [x] 3단계: 원문 보존(토큰 동일·누수 0·이중처리기 0) 및 독립 로드/부팅 회귀 0 측정 완료 (verify-inline-hard, seam, module-load)
- [x] 4단계: 실제 UI 게스트 조작(추천 목표 2개 실제 마우스 클릭 채택, 아코디언 펼침/접기/닫기) 기준 2회 vs 작업 1회 비교(호출수 19회 일치, 비-해시 차이 0개, 1:1 ID 정규화 및 불변식 단언 통과, 기존 해시 계산식 100% 대조 증명), 표준 탭 하네스 비교(408개 지표 차이 0), 전체 시험 전후 비교(115개 시험 회귀 0)
- [ ] 5단계: PR #837 설명 갱신 및 교정 커밋 푸시, 독립 법정 재심 청구 및 판정 확인 (진행 중)

## 막힘 및 위험 요소 대응
- 홈 키트(`OurgoalHomeMegaBlock`) 통째 대입: `afterTag: <script src="js/tabs/home/index.js"></script>`로 태그 배치하여 덮어쓰기 방지
- 활성 목표 0개 시 빈 카드 렌더: 게스트 추천 목표 2개 실제 추가 조작 후 오늘 미션 카드 및 더보기 아코디언 가시성 확보 (실측 19회 호출 확인)
- 기존 AI API(/api/todaymission): 측정 시 로컬 503 fallback을 확인하여 외부 호출 및 과금 방지, 기존 동작 보존
- 법정 시나리오 선택자 고유성: `.btn-quick-adopt-goal[onclick*="10km"]` 및 `#goalFastAddInput` 사용하여 대상 모호성 방지 및 양쪽 통과(allPassedBoth: true, nonVacuousExpects: 11)
