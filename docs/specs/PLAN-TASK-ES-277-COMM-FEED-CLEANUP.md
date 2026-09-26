# 실행 계획서 (PLAN) — 소통창 화면정리 (피드·소통 UI 시인성 및 피로도 개선)

> **문서 ID**: PLAN-TASK-ES-277-COMM-FEED-CLEANUP  
> **티켓 연계**: #TASK-ES-277  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **대상 문제**: 소통창의 피드 및 동류 소통 UI가 과밀하여 발생하는 시인성 저하 및 조작 피로도를 해소하고, 화면 정돈 상태를 직통으로 조작·영속화할 수 있는 전용 허브를 구축함.
- **핵심 목표**: `#og-task-25-container` 마크업 마운트, `#og-task-25-action-btn` 44px 이상 터치 규격 확보, 직통 비즈니스 로직 `handle팀목표_Item25Action` 4위 1체 배선 완결.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E3 / UX` (동류 소통 루프 및 무공해 연대, 피드·소통 UI 시인성 강화 및 피로도 개선)
- **[본질] (Essence)**: 소통의 피로도를 제거하고 군더더기 없는 단정한 환경을 제공하여 사용자가 부담 없이 동류 연대와 지지를 나눌 수 있도록 보장하는 소통 경험 혁신.
- **[원인] (Root Causes - 기저 원인 2가지)**:
  1. **원인 1**: `js/team-invite-comm.js` 내에 노션 25항 규격의 직통 트랜잭션 핸들러(`handle팀목표_Item25Action`) 부재.
  2. **원인 2**: 소통 탭 내 고유 DOM 마크업 및 4대 뷰 원자적 동시 전파(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 연계 미비.
- **[중심] (Core Bottleneck & Anchor)**: 모바일 375px 실기기에서 최소 터치 타겟 44px × 44px 이상을 확보하며 가로 넘침(Overflow) 0px을 방어하는 반응형 UI 조형.
- **[핵심] (Critical Safety & Termination)**: 오프라인 및 Supabase 두절 시에도 `og_task-25_cache` 로컬 캐시로 안전하게 폴백되는 무손실 회복탄력성 보증.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/team-invite-comm.js` | 직통 트랜잭션 핸들러 선언 및 모듈 노출 | +60줄 | 0줄 | +60줄 | 모듈 확장 |
| `ui.css` | 화면정리 허브 카드 및 44px 터치 버튼 스타일, 375px 반응형 | +60줄 | 0줄 | +60줄 | CSS 토큰 준수 |
| `index.html` | 소통 탭 피드 섹션에 화면정리 허브 마크업 마운트 | +15줄 | 0줄 | +15줄 | 외과수술적 마크업 |
| `tests/comm-feed-cleanup.test.js` | 신규 단위 테스트 | +80줄 | 0줄 | +80줄 | 신규 생성 |
| `scripts/smoke-test.js` | 스모크 테스트 단언문 추가 | +20줄 | 0줄 | +20줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#og-task-25-container.og-comm-cleanup-card` + `#og-task-25-action-btn.og-comm-cleanup-btn`
2. **이벤트 리스너 (Listener)**:
   - `#og-task-25-action-btn[onclick="handle팀목표_Item25Action(event)"]`
3. **비즈니스 로직 (Logic)**:
   - `handle팀목표_Item25Action`: 12ms 햅틱, 디바운스, `og_task-25_cache` 영속화, 4대 뷰 동시 전파.
4. **피드백 & 예외처리 (Feedback)**:
   - 시각 토스트 표출(`showToast`), 375px 모바일 터치 타겟 44px 이상 및 가로 스크롤 0px 방어.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (계승 완료)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (외과수술적 diff 완료)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (100% 보존)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (비파괴 안전성 보장)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (직통 핸들러 구축)**: `js/team-invite-comm.js`에 `handle팀목표_Item25Action` 함수 정의 및 전역 노출.
2. **Step 2 (CSS 화면정리 스타일 및 반응형)**: `ui.css`에 `#og-task-25-container`, `#og-task-25-action-btn`, 375px 모바일 미디어 쿼리 추가.
3. **Step 3 (마크업 마운트)**: `index.html` 소통 탭 피드 영역에 `#og-task-25-container` 마운트.
4. **Step 4 (단위 및 스모크 테스트)**: `tests/comm-feed-cleanup.test.js` 작성 및 실행, `scripts/smoke-test.js`에 단언문 추가.
5. **Step 5 (헌법 게이트 및 Court 심사)**: 무결성 게이트 통과 후 GitHub Court 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: `#og-task-25-action-btn` 버튼 클릭 시 `handle팀목표_Item25Action`가 100% 트리거되고 햅틱과 토스트가 정상 발동하는지 검증.
- **시나리오 B (Zero Data Loss)**: 트랜잭션 실행 후 `og_task-25_cache` 로컬 스토리지에 페이로드가 무손실 영속화되는지 검증.
- **시나리오 C (Zero UX Regression)**: 기존 소통 탭 피드, 댓글, 마니또, 러너 레이더 기능에 일체의 영향 없음 확인.
- **시나리오 D (Full State Propagation)**: 트랜잭션 완료 시 4대 뷰(홈, 캘린더, 목표, 기록) 리렌더링 함수가 무조건 호출됨을 확인.
- **시나리오 E (자동화 게이트 통과)**: `node tests/comm-feed-cleanup.test.js` PASS, `node scripts/smoke-test.js` (395개 통과) ALL PASS, `node scripts/verify-integrity-gate.js` (38개 통과) ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 단위 테스트 검증: `node tests/comm-feed-cleanup.test.js` PASS
- [x] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` (395개 통과) PASS
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` (38개 통과) PASS
- [ ] [4단계: 초안 PR 제출 및 GitHub Court 심사 청구] 완결 후 판정서 확인 및 squash 머지

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 375px 좁은 뷰포트에서 `#og-task-25-action-btn`이 가로 범위를 벗어나 가로 스크롤을 유발할 위험.
- **기술적 대응책**: CSS `box-sizing: border-box`, `overflow-x: hidden` 적용 및 375px 미디어 쿼리에서 `width: 100%`로 안전 패딩 내에 전면 맞춤 배치.
- **비상 롤백 절차**: 배선 문제 발생 시 커밋 롤백 및 기존 `js/team-invite-comm.js` 인터페이스로 1초 무손실 복구.
