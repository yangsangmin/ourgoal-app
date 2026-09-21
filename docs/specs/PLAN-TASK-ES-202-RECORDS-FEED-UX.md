# 작업계획서 (PLAN) — 기록/통계 탭 5대 UX 단계별 전면 개편

> **문서 ID**: PLAN-TASK-ES-202-RECORDS-FEED-UX  
> **티켓 연계**: #TASK-ES-202  
> **요구사항 정의서**: [REQ-TASK-ES-202-RECORDS-FEED-UX](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-202-RECORDS-FEED-UX.md)  
> **작성 일시**: 2026-09-21  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - 내 기록 피드 및 보관함에 '최신 3개 우선 노출 + 기간별 5개 페이징' 구조 구축.
  - 상단 5단 도구 카드를 1줄 콤팩트 퀵 액션 독으로 압축하여 첫 화면에 피드 즉시 노출.
  - 365일 히트맵을 최근 4주 컴팩트 뷰 및 일자별 실천 요약 팝업 카드로 개선.
  - 성취 통계 차트 상단 3대 핵심 요약 카드 및 엄지 스위처 탑재.
  - 성소 6대 모드와 하단 3분할 세그먼트 간의 상호 보호 동기화 및 320px 모바일 완결.
- **영향받는 파일 전수 목록**:
  1. `index.html`: `renderArchivedGoals`, `#recViewFeed` 퀵독, `renderWeekChart` 요약카드, `setRecordsSegment` 가드.
  2. `js/sanctuary-v3-engine.js`: 보관함 모드 최신3개/5개페이징, 히트맵 4주 뷰 및 `selectHeatDay` 요약카드.
  3. `ui.css`: `.rec-quick-dock-bar`, `.archive-ms-details`, `.date-range` flex-wrap, 320px 오버플로우 방어.
  4. `docs/rules/TICKETS.md`: #TASK-ES-202 승인 티켓 등록.
  5. `reports/TASK-ES-202/claims.json`: 법정 심사 청구 명세.

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별

- **[본질] (Essence)**: 유저가 자신의 실천 기록을 열람할 때 시각적 피로와 스크롤 노동을 0으로 만들고, '최신 3개 즉각 체감'과 '필요한 만큼의 5개 단위 탐색'을 통해 성취감과 통제감을 극대화하는 것.
- **[원인] (Root Causes)**: 피드와 보관함의 전체 배열 나열로 인한 스크롤 피로 및 상단 5단 도구 카드의 첫 뷰포트 독점.
- **[중심] (Core Bottleneck & Anchor)**: 기존 스모크 테스트 식별자를 100% 보존하면서 상단 도구를 1줄 퀵독으로 압축하고, 성소 모드와 세그먼트 간의 상호 보호 가드를 결속하는 것.
- **[핵심] (Critical Safety & Termination)**: 320px 모바일 화면에서도 가로 스크롤 넘침이 없고 사용자 데이터 유실이 0바이트인 상태를 보장하는 것.
- **전역 상태(`state`) 영향 분석**:
  - `state.records`: 읽기 전용으로 최신 3건 슬라이스 및 기간/페이징 슬라이스 적용 (원본 데이터 불변 보존).
  - `state.goals`: 완료된 목표(`status === 'completed'`) 필터링 및 최신순 정렬 (원본 데이터 불변 보존).
  - 클라이언트 페이징 상태 변수: `window.archivedPeriod`, `window.archivedPage` 격리 운용.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [Supabase DB / state.records] ──▶ [최신순 내림차순 정렬]
                                            │
        ┌───────────────────────────────────┴───────────────────────────────────┐
        ▼                                                                       ▼
  [최근 실천 피드: 0~3 인덱스 슬라이스]                              [이전 기록: 3번 인덱스 이후 필터링]
        │                                                                       │
        ▼ (첫 뷰포트 스크롤 0 노출)                                             ▼ (5개 페이징)
  [1줄 퀵독 아래 즉시 렌더링]                                        [기간 칩 + 페이지네이션 내비게이션]
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **파일별 변경 예산 (Diff Budget)**:
  - `index.html`: 약 +210줄 / -30줄 (퀵독 마크업, 보관함 렌더러 분기, 통계 요약 카드)
  - `js/sanctuary-v3-engine.js`: 약 +190줄 / -15줄 (성소 보관함 페이징, 히트맵 4주 뷰, 일자 요약)
  - `ui.css`: 약 +15줄 / 0줄 (320px flex-wrap, 퀵독 스타일, 마일스톤 접기)
- **4위 1체 배선 명세**:
  1. 마크업: 고유 ID 및 접근성 라벨 완비 (`recQuickDockBar`, `archiveMsDetails` 등).
  2. 리스너: `onclick="window.setArchivedPeriod(...)"`, `onclick="window.setArchivedPage(...)"` 등 직결.
  3. 로직: 시간순 정렬 및 페이지 인덱싱 수학적 정합성 보장 (`Math.ceil(total / 5)`).
  4. 피드백: 활성 칩 에메랄드 강조, 비활성 버튼 disabled 처리, 부드러운 전환.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- **기존 기능 불파괴 보증**:
  - 기존 335개 스모크 테스트의 정적 검증 타깃인 4개 핵심 카드 식별자(`recTimeTrackerActionCard`, `recProTemplateCard`, `recMiniPulseBar`, `recUniversalTopBanner`)를 DOM에 100% 보존.
  - 기존 체크인 생성, 수정, 삭제(CRUD) 비즈니스 로직 0바이트도 손상 없이 그대로 계승.
  - 유저 자산 100% 무손실 보존 (Zero Data Loss).

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1**: `index.html` 내 `renderArchivedGoals` 리팩토링 (최신 3개 전면 노출 + 마일스톤 `<details>` 접기 + 5개 페이징).
2. **Step 2**: `index.html` 내 `#recViewFeed` 상단에 `.rec-quick-dock-bar` 탑재 및 도구 카드 토글 연결.
3. **Step 3**: `js/sanctuary-v3-engine.js`에 히트맵 4주 뷰 및 `selectHeatDay` 일자별 요약 카드 팝업 배선.
4. **Step 4**: `index.html` 내 `renderWeekChart` 상단에 3대 핵심 요약 카드(시간, 스트릭, 횟수) 및 엄지 스위처 탑재.
5. **Step 5**: `setRecordsSegment` 가드 추가 및 `ui.css` 320px 반응형 오버플로우 방어 스타일 반영.
6. **Step 6**: 회귀 스모크 테스트 335개 전수 검증 및 CDP 320px 실측 스크린샷 5종 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계

- **법정 주장(claims) 명세 설계**:
  - `R1` (피드 최신 3개 및 5개 페이징): `scenarios/records-feed-pager.json` 동작 검증.
  - `R2` (1줄 퀵독 압축): 퀵독 버튼 토글 및 첫 뷰포트 피드 노출.
  - `R3` (보관함 최신 3개 및 마일스톤 접기): 보관함 아코디언 및 5개 페이저 동작.
  - `R4` (히트맵 4주 뷰 및 일자 요약): 날짜 셀 클릭 시 요약 카드 팝업.
  - `R5` (성취 통계 요약 카드 및 스위처): 요약 수치 렌더링 및 기간 전환.
  - `R6` (320px 모바일 가로스크롤 제로): `scrollWidth === 320` 무오버플로우.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트

- [x] `index.html` 보관함 최신 3개 + 5개 페이징 구현
- [x] `index.html` 1줄 퀵독 압축 및 첫 뷰포트 피드 노출 구현
- [x] `js/sanctuary-v3-engine.js` 히트맵 4주 뷰 및 일자 요약 카드 구현
- [x] `index.html` 통계 3대 요약 카드 및 스위처 구현
- [x] `ui.css` 320px 오버플로우 제로 스타일 주입
- [x] 회귀 스모크 테스트 335개 전수 통과 확인
- [x] CDP 320px 실측 `hasHorizontalScroll: false` 확인
- [x] `docs/rules/TICKETS.md` 티켓 등록
- [x] `reports/TASK-ES-202/claims.json` 법정 심사 청구서 작성
- [x] GitHub PR 생성 및 법정 심사 청구

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **막히는 지점 예상**:
  - GitHub Court에서 시나리오 파일 실행 시 브라우저 뷰포트 로딩 타이밍 이슈.
  - **대응**: `waitForSelector` 및 넉넉한 대기 시간 설정.
- **롤백 계획**:
  - 문제 발생 시 `git reset --hard HEAD~1`로 즉각 원상 복구 가능하도록 원자적 커밋 구성.
