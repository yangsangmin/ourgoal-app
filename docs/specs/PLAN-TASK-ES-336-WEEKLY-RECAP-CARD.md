# [엔지니어링 작업계획서] #TASK-ES-336: 기록 탭 위클리 리캡 초경량 요약 카드 연동 및 팩트 기반 성장 피드백 배선

## 1. 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**:
  - 알림 클릭(`/#records`) 또는 기록 탭 진입 시, 3초 만에 이번 주 실천 성장을 확인하고 0.5초 만에 닫을 수 있는 초경량 요약 카드 모달 제공.
  - 별표(⭐) 수동 평가 노동 영구 배제: `사진(1순위) ➔ 몰입시간(2순위) ➔ 스트릭(3순위) ➔ 정성 글자 수(4순위)` 팩트 기반 베스트 실천 1선 자동 하이라이트.
  - 기능 비대화(Feature Creep) 차단: 새 화면이나 복잡한 통계 뷰를 신설하지 않고, 기존 `openWeeklyRecapModal` 인프라를 초경량 3초 카드로 다듬어 제공.
  - 기록 탭 헤더에 `[🐾 이번 주 리캡]` 상시 진입 버튼 배선.
- **영향받는 파일 전수 목록**:
  1. `docs/rules/TICKETS.md`: #TASK-ES-336 티켓 등록 (완료)
  2. `docs/specs/REQ-TASK-ES-336-WEEKLY-RECAP-CARD.md`: 요구사항 정의서 (완료)
  3. `docs/specs/PLAN-TASK-ES-336-WEEKLY-RECAP-CARD.md`: 엔지니어링 작업계획서 (본 문서)
  4. `reports/TASK-ES-336/claims.json`: 법정 심사용 주장 파일
  5. `reports/TASK-ES-336/pr-body.md`: 초안 PR 설명문
  6. `index.html`:
     - `openWeeklyRecapModal()` 함수 개편 (초경량 3초 카드 뷰 및 팩트 기반 베스트 실천 1선 렌더링)
     - 기록 탭 상단 헤더에 `btnOpenWeeklyRecap` 버튼 배선
     - URL 파라미터(`?recap=weekly`) 감지 시 자동 팝업 연동

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **E2 (기록 회고 루프) / UX** — 복잡한 조작이나 인지 피로 없이, 한 주 동안 내가 헛살지 않고 올바른 방향으로 나아갔음을 3초 만에 체감하게 하는 무공해 성장 영수증.
- **[원인] (Technical Causes)**:
  - 기존 `openWeeklyRecapModal`이 이미지 캔버스 생성 옵션 6종 조작 위주로 되어 있어 즉각적인 팩트 요약 카드로 기능하지 못함.
  - 기록 탭 상단에서 위클리 리캡을 직통으로 여는 트리거 UI 부재.
- **[중심] (Core Wire & State)**:
  - `weeklyRecapStats(records)`: 7일간 기록 횟수(`count`), 총 몰입 시간(`totalMs`), 카테고리별 합산 산출.
  - `findBestMoment(records)`: 최근 7일 기록 중 `사진 존재 > 몰입시간 최대 > 글자 수 최다` 기준 베스트 실천 추출.
  - `openWeeklyRecapModal()`: 3대 지표 + 베스트 실천 1선 + 0.5초 닫기 버튼 렌더링.
- **[핵심] (Critical Safety & Persistence)**:
  - 모달 닫기 시 기존 기록 탭 피드로 100% 무손실 복귀.
  - 기존 캔버스 이미지 공유 기능(`generateWeeklyRecapImage`)은 `[카드 이미지 공유]` 보조 버튼으로 100% 온전히 보존.
  - 유저의 기존 설정, 데이터, 필터 상태 0바이트 손실.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [푸시 알림 또는 기록 탭 진입]
            │
            ▼
    [#recHeaderActionArea] ──► [🐾 이번 주 리캡] 버튼 클릭
            │
            ▼
    openWeeklyRecapModal()
            │
            ├─► weeklyRecapStats(records): 횟수, 몰입시간 산출
            ├─► computeStreakDays(): 연속 스트릭 산출
            ├─► findBestMoment(records): 팩트 기반 1위 실천 추출
            │
            ▼ (초경량 3초 요약 카드 렌더링)
    ┌────────────────────────────────────────────────────────┐
    │ 🐾 이번 주 나의 실천 리캡                             │
    │ 5회 실천 · 6시간 40분 몰입 · 12일 연속 스트릭           │
    │ [🌟 베스트 실천 썸네일 + 실천 내용]                     │
    │ [ 기록 보러가기 (닫기) ]    [ 카드 이미지 공유 ]        │
    └────────────────────────────────────────────────────────┘
            │ 0.5초 닫기 (✕ 버튼 / 기록 보러가기 / 바깥 터치)
            ▼
    기존 기록 피드로 자연스럽게 복귀
  ```

## 3. 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `index.html`: 추가 약 75줄, 변경 약 20줄 (총 diff 95줄 이내)
  - `docs/specs/*`: 신규 생성 2개 파일
  - `reports/TASK-ES-336/*`: 신규 생성 2개 파일
- **카드 조형 규격**:
  - 모달 최대 폭 360px, 모바일 375px 화면에서 여백 16px 확보하여 스크롤 없이 한 화면에 완결.

## 4. 기존 코드와의 조화 및 리팩터링 안전핀 (Integration & Safety)
- 기존 `window.openWeeklyRecapModal`, `window.generateWeeklyRecapImage`, `window.weeklyRecapStats` 함수 시그니처 100% 유지.
- 기존 스모크 테스트 및 무결성 게이트의 Dead-Click 린터 100% 통과 보장.

## 5. 단계별 구현 절차 (Implementation Steps)
1. `index.html` 내 `findBestMoment` 팩트 기반 추출 헬퍼 작성.
2. `openWeeklyRecapModal()` 함수를 초경량 3초 요약 카드로 개편하고 0.5초 닫기 및 공유 분기 배선.
3. 기록 탭 헤더에 `[🐾 이번 주 리캡]` 버튼 추가 및 `renderRecordsScreen`에 바인딩.
4. URL 해시/파라미터(`?recap=weekly`) 감지 시 자동 팝업 연동.
5. 로컬 무결성 게이트 및 `npm test` 전수 검증.
6. `reports/TASK-ES-336/claims.json` 및 `pr-body.md` 작성.

## 6. 절차 재검증: 법정 주장(claims) 설계 (Claims Design & Anti-SPOF)
- **법정 심사용 정적 단언문 설계 (claims.json)**:
  - **C1**: `index.html` 내에 3대 팩트 지표(기록수, 몰입시간, 스트릭)를 렌더링하는 `openWeeklyRecapModal` 코드가 존재한다.
  - **C2**: `index.html` 내에 팩트 기반 베스트 실천 1선 추출 알고리즘 코드가 존재한다.
  - **C3**: `index.html` 내에 기록 탭 상단 `btnOpenWeeklyRecap` 리캡 버튼 배선이 존재한다.
  - **C4**: `index.html` 내에 0.5초 원터치 닫기(`closeModal`) 핸들러 코드가 존재한다.
  - **C5**: `index.html` 내에 기존 캔버스 공유 기능 호출 배선(`generateWeeklyRecapImage`)이 보존되어 있다.
- **Anti-SPOF 재검증**:
  - 기록 데이터가 0건이거나 잘못된 형식이더라도 안전한 폴백 카드를 띄워 에러나 흰 화면이 발생하지 않음.

## 7. 단계별 실행 체크리스트 (Execution Checklist)
- [ ] 1. `docs/rules/TICKETS.md` 티켓 등록 (완료)
- [ ] 2. `docs/specs/REQ-TASK-ES-336-WEEKLY-RECAP-CARD.md` 작성 (완료)
- [ ] 3. `docs/specs/PLAN-TASK-ES-336-WEEKLY-RECAP-CARD.md` 작성 (완료)
- [ ] 4. `index.html` 위클리 리캡 초경량 카드 및 헤더 버튼 구현
- [ ] 5. `reports/TASK-ES-336/claims.json` 및 `pr-body.md` 작성
- [ ] 6. 무결성 게이트 및 단위 테스트 통과
- [ ] 7. Draft PR 생성 및 GitHub 법정 심사 청구

## 8. 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 모달 내 신규 버튼이 Zero Dead-Click 린터에 걸릴 가능성.
- **재검증 트리거**: `npm test` 실행 시 Dead-Click 린터가 실패하면 버튼에 명시적 핸들러와 `type="button"`이 배선되었는지 즉시 대조한다.
