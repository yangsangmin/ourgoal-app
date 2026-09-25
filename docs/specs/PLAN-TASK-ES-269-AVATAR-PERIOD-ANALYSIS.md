# 엔지니어링 작업계획서 (PLAN) — 기간 설정(목표·팀·기록 분석) 맞춤형 아바타 생성 결합 및 설정창 확대

> **문서 ID**: PLAN-TASK-ES-269-AVATAR-PERIOD-ANALYSIS  
> **요구사항 연계**: [REQ-TASK-ES-269-AVATAR-PERIOD-ANALYSIS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-269-AVATAR-PERIOD-ANALYSIS.md)  
> **티켓 연계**: #TASK-ES-269 (노션 생각 메모장 [15]번, Page ID: `3de598db-9096-81ac-8d89-cd3622e657a1`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 아바타 모달에서 사진 선택 후 `[아바타 생성 기준 기간 정하기]` 버튼 및 직접 기간(시작일/종료일) 설정 칸 배치.
  - 지시 원문 그대로 2줄 안내멘트 배치:
    *“설정한 기간의 내 목표, 팀, 기록들을 분석하여”*  
    *“그에 맞는mbti와 좌우명을 가진 아바타를 생성합니다.”*
  - 지정 기간 내 목표·팀·기록 데이터를 실측 분석하여 맞춤 MBTI와 좌우명을 도출하는 비즈니스 로직 결합.
  - 아바타 설정 모달 창 크기 확대 (`max-width: 580px`, `height: 92vh`).
- **영향 받는 파일 목록 전수**:
  - `js/avatar-system.js`: 기간 설정 UI 렌더링, 2줄 안내멘트, 실데이터 분석 및 페르소나 도출 함수, 모달 크기 확장.
  - `ui.css`: `.avatar-modal-sheet` 크기 확대, `.avatar-period-box`, `.avatar-period-guide` 375px 반응형 스타일.
  - `tests/avatar-period-analysis.test.js`: 신규 단위 테스트.
  - `scripts/smoke-test.js`: `#TASK-ES-269` 단언 추가.
  - `reports/TASK-ES-269/claims.json`: 법정 청구서.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 사용자의 실제 과거 실천 궤적(목표, 팀, 기록)을 특정 기간 단위로 정밀 분석하여 아바타의 페르소나와 결합하는 실시간 데이터 인텔리전스 파이프라인.
- **[원인] (Technical Causes)**:
  - 사진 업로드 이후 단계에서 기간 설정 UI와 데이터 집계 로직이 부재했음.
- **[중심 배선] (Core Wire & State)**:
  - `#btnToggleAvatarPeriod` 클릭 ➔ 기간 설정 패널(#avatarPeriodPanel) 토글.
  - `#btnMakeCustomAvatar` 클릭 ➔ `analyzeUserPeriodData(profile, startDate, endDate)` 호출 ➔ 기간 내 `goals`, `teams`, `records` 집계 ➔ MBTI/좌우명 도출 ➔ 아바타 생성 및 보관함 적재 ➔ 4대 뷰 동시 전파.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기간 내 데이터 부족 시 기본 페르소나 자가 치유(Self-Healing).
  - 375px 모바일 뷰포트에서 터치 타겟 44px 이상 및 넘침 0건 보증.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[사진 선택] -> [아바타 생성 기준 기간 정하기 클릭] -> [시작일/종료일 지정] -> [2줄 안내멘트 확인] -> [아바타 제작 클릭] -> [기간 데이터 분석] -> [맞춤 MBTI/좌우명 아바타 생성] -> [10슬롯 인벤토리 및 4대 뷰 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/avatar-system.js` | 기간 설정 UI, 2줄 안내멘트, 실데이터 분석 로직 | +80줄 | -10줄 | +70줄 | 비즈니스 로직 |
| `ui.css` | 모달 창 확대 및 기간 설정 스타일링 | +25줄 | -2줄 | +23줄 | CSS 컴포넌트 |
| `tests/avatar-period-analysis.test.js` | 신규 단위 테스트 | +65줄 | 0줄 | +65줄 | 단위 테스트 |
| `scripts/smoke-test.js` | 스모크 테스트 단언 | +20줄 | 0줄 | +20줄 | 무결성 단언 |
| `reports/TASK-ES-269/claims.json` | 법정 청구서 | +100줄 | 0줄 | +100줄 | 규격 정본 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#btnToggleAvatarPeriod`, `#avatarPeriodPanel`, `#avatarPeriodStart`, `#avatarPeriodEnd`, `.avatar-period-guide`
2. **이벤트 리스너 (Listener)**: 기간 버튼 클릭 토글, 날짜 변경 및 퀵 프리셋 칩 클릭 이벤트 바인딩.
3. **비즈니스 로직 (Logic)**: `analyzeUserPeriodData` 함수로 기간 내 목표·팀·기록 실제 분석 및 MBTI/좌우명 도출.
4. **피드백 & 예외처리 (Feedback)**: 분석 중 피드백 토스트, 완료 시 맞춤 페르소나 표출.

---

## 4. [원칙 ④] 기존 기능 불파괴 보증 (Zero-Breakage Guarantee)
- [x] 기존 10개 슬롯 인벤토리 및 아바타 커스텀 제작 파이프라인이 100% 무손실 보존되는가?
- [x] 기간을 설정하지 않더라도 기존 방식대로 안전하게 아바타가 생성되는가?
- [x] 386개 스모크 단언과 38개 헌법 게이트가 100% 통과하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `js/avatar-system.js` 내 사진 선택 후 영역에 `[아바타 생성 기준 기간 정하기]` 버튼 및 직접 기간 설정 폼, 2줄 안내멘트 마크업 추가.
2. **Step 2**: 기간 내 목표(goals), 팀 활동(teams), 기록(records) 실데이터 분석 함수 `analyzeUserPeriodData` 구현.
3. **Step 3**: `ui.css` 내 `.avatar-modal-sheet` 크기 확대 (`max-width: 580px`, `height: 92vh`) 및 반응형 스타일링.
4. **Step 4**: `tests/avatar-period-analysis.test.js` 작성 및 로컬 실행.
5. **Step 5**: `scripts/smoke-test.js` 단언 추가 및 전체 스모크 테스트(387개), 헌법 게이트(38개) 100% 통과 확인.
6. **Step 6**: 법정 청구서 `reports/TASK-ES-269/claims.json` 작성 및 밸리데이션.
7. **Step 7**: 커밋, 푸시, GitHub Draft PR 생성, Ready for review, Court 심사 통과 및 squash 머지.
8. **Step 8**: Tri-Sync 완료 갱신 및 최종 보고.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification Procedure)
- **단위 테스트**: `node tests/avatar-period-analysis.test.js` (PASS)
- **스모크 테스트**: `node scripts/smoke-test.js` (ALL PASS)
- **헌법 게이트**: `node scripts/verify-integrity-gate.js` (38개 ALL PASS)
- **GitHub Court**: `node court/chat.js <PR번호>` (success)

---

## 7. [원칙 ⑦] 안전핀 및 롤백 대책 (Rollback Strategy)
- 문제 발생 시 `git restore js/avatar-system.js ui.css`로 즉각 복원 가능.
- 기존 아바타 객체 구조에 안전하게 하위 호환 필드 추가.
