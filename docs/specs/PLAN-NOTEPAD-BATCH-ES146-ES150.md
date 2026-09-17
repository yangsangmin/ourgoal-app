# [PLAN] #TASK-ES-146 ~ #TASK-ES-150 생각메모장 5대 과제 실행 계획서

- **문서 번호**: PLAN-NOTEPAD-BATCH-ES146-ES150
- **작성 일자**: 2026-09-17
- **적용 규칙**: 아워골 최고 헌법 15대 조문 (AGENTS.md) & 문제해결 8원칙 (2사이클 PLAN)
- **대상 과제**: #TASK-ES-146, #TASK-ES-147, #TASK-ES-148, #TASK-ES-149, #TASK-ES-150

---

## 1. 아키텍처 및 구현 설계

### 1.1 #TASK-ES-146 (홈 탭 평가 배너 및 90% 모달)
- `index.html`:
  - `renderHomeScreen()` 하단에 `#homeEvalBanner` HTML 추가.
  - `openAppEvaluationModal()`: 90% 뷰포트 대형 모달 레이아웃 구현.
  - 5개 필드(점수, 장점, 단점, 추가요청, 대표에게 하고싶은말) 바인딩 및 제출 시 토스트 + 로컬/서버 동기화.
- `ui.css`: `.eval-banner-box`, `.eval-modal-sheet-90` 스타일.
- `js/customize.js`: `CORE_IDS`에 `homeEvalBanner` 등록.

### 1.2 #TASK-ES-147 (목표 탭 '목표만' 이격 배치 및 확인 UI)
- `index.html`:
  - `renderGoalsScreen()` 필터 바 렌더링 시 `msFilter` 항목 중 `'milestones_only'`와 `'tasks_only'` 사이에 마진 적용 또는 `'goals_only'` 버튼 우측 이격(`margin-left: 14px;`).
  - `state.goalViewMode === 'goals_only'` 또는 필터 선택 시 전체 목표를 마일스톤형 카드 블록으로 수직 나열.

### 1.3 #TASK-ES-148 (스톱워치 표 시간기입 안내문구)
- `index.html`:
  - 맞춤 템플릿 스톱워치 렌더링 영역에 `넣을 칸 누르고 '표에시간기입'누르면 바로입력됨` 마이크로 안내 추가.

### 1.4 #TASK-ES-149 (팀목표 가이드 소멸 안내문구)
- `index.html`:
  - `renderTeamGoalsScreen()` 내 '팀 목표 200% 활용 가이드' 옆에 `* 팀 목표를 생성하면 사라짐` 태그 추가.

### 1.5 #TASK-ES-150 (아바타 레벨업 팝업 & 성향 프롬프트)
- `index.html`:
  - `openAvatarLevelUpModal(avatar, level)`: 큰 아바타 이미지 + SNS 공유 + 이미지 저장 + 확인 닫기 버튼.
  - `levelBadgeRow` 클릭 또는 레벨업 달성 시 호출 가능하도록 연결.
  - 아바타 설정 화면에 '성장 성향(스타일 키워드)' 입력 필드 탑재.

---

## 2. 검증 계획
- `scripts/smoke-test.js`에 5대 과제별 컴플라이언스 테스트 신설 (284개 -> 289개 통과).
- 헌법 15대 게이트 및 Zero Dead Click 전수 통과 확인.
