# 엔지니어링 작업계획서 (PLAN) — 탭바 FAB 삭제 및 홈탭 7대 결함 일괄 정상화

> **문서 ID**: PLAN-TASK-ES-139-HOME-TAB-CLEAN-OVERHAUL  
> **요구사항 연계**: [REQ-TASK-ES-139-HOME-TAB-CLEAN-OVERHAUL](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-139-HOME-TAB-CLEAN-OVERHAUL.md)  
> **티켓 연계**: #TASK-ES-139  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 상민님의 직접 지시 7대 항목(탭배너 FAB 삭제, 어제/오늘/내일 날짜칩 삭제, 아바타 창 아바타 정상화 및 새싹 윙 오버레이 소탕, 커닝페이퍼 영역 삭제, 컨디션/에너지 슬라이더 50% 슬림화, 홈 히트맵 카드 삭제, 레이스 창 페이스메이커 고도화)을 무손실·고품격으로 일괄 정상화.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `#bottomNavFab` 삭제, `#homeDateNav` 삭제, `#quickCheckinChips` 삭제, `#homeGrassSummaryCard` 삭제, `#crewPacingWidget` 리디자인, 아바타 렌더러 안전 배선.
  - `ui.css`: `.bottomnav-inner` 6열 균등 분할 그리드, `.checkin-dimension-sliders` 50% 슬림화, 페이스메이커 위젯 모던 스타일링.
  - `js/avatar-system.js`: 새싹(`🌱`) 윙 오버레이 소탕 및 `profile.avatar` 페르소나 표출 로직 정상화.
  - `docs/rules/TICKETS.md`: 티켓 상태 대장 동기화.
  - `reports/TASK-ES-139/`: claims.json, scenarios, pr-body.md, TASK-ES-139.md 생성.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 홈 화면에 적재된 불필요한 시각 피로 요소를 완전 소탕하고, 아바타 본래 페르소나 표출 및 새싹 오버레이 소탕, 컨디션/에너지 슬라이더 50% 슬림화, 모던 페이스메이커 라이브 카드 고급화를 통해 3초 체크인의 쾌적성과 6대 탭 균형을 완결하는 홈 탭 클린 오버홀.
- **[원인] (Technical Causes)**:
  1. `renderAvatarHtml`이 `profile.avatar`를 무시하고 Lv.1 랭크 테마의 새싹(`🌱`) 윙과 로봇 SVG를 강제 삽입함.
  2. 날짜칩, 커닝페이퍼, 홈 히트맵이 한 화면에 동시 적재되어 390px 뷰포트 기준 수직 200px 이상의 공간을 낭비함.
  3. 실시간 레이스 위젯이 과도한 원색 붉은 톤과 '1등 체크인' 등 유치한 표현을 사용하여 앱의 시각적 완성도를 저해함.
- **[중심 배선] (Core Wire & State)**:
  - 탭바: `#bottomNavFab` 삭제 및 6열 균등 배치 (`grid-template-columns: repeat(6, 1fr)`).
  - 홈 상단: `#homeDateNav`, `#quickCheckinChips`, `#homeGrassSummaryCard` 완전 제거.
  - 아바타: `js/avatar-system.js` 새싹 윙 오버레이 소탕, `profile.avatar` 최우선 렌더링.
  - 슬라이더: `.checkin-dimension-sliders` 높이 65px 이하로 50% 이상 압축.
  - 페이스메이커: `⚡ 러닝메이트 라이브` 모던 슬레이트/에메랄드 톤으로 리디자인.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 6대 탭 이동 기능 100% 무손실 유지.
  - 당일 체크인 저장 및 경험치/스트릭 획득 파이프라인 100% 무손실 유지.
  - 기록 탭 연간 365일 히트맵 100% 보존.
  - 모바일 390px 뷰포트 가로 스크롤 넘침(scrollWidth > 390) 0px 방어.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 화면 진입] -> [내 아바타 100% 표출] -> [슬림 슬라이더 조절] -> [3초 체크인 작성] -> [저장 & +10 EXP] -> [기록 탭 및 스트릭 동시 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | FAB, 날짜칩, 커닝페이퍼, 홈 히트맵 삭제 및 레이스 리디자인 | +25줄 | -65줄 | -40줄 | 외과수술적 diff |
| `ui.css` | 탭바 6열 그리드 및 슬라이더 50% 슬림화, 페이스메이커 스타일 | +30줄 | -10줄 | +20줄 | CSS 토큰 준수 |
| `js/avatar-system.js` | 새싹 윙 오버레이 소탕 및 profile.avatar 표출 | +15줄 | -20줄 | -5줄 | 모듈화 버그 픽스 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 고유 ID 및 접근성 시맨틱 태그 준수.
2. **이벤트 리스너 (Listener)**: 6대 탭 클릭 및 체크인 슬라이더/버튼 바인딩.
3. **비즈니스 로직 (Logic)**: 실제 DB 및 상태 연동 함수 유지 (빈 stub, // TODO 금지).
4. **피드백 & 예외처리 (Feedback)**: 체크인 성공 토스트 및 +10 EXP 피드백 연동.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [ ] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [ ] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [ ] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [ ] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (하단 탭바 및 홈 화면 DOM 정리)**: `index.html`에서 `#bottomNavFab`, `#homeDateNav`, `#quickCheckinChips`, `#homeGrassSummaryCard` 삭제.
2. **Step 2 (조형 및 스타일 토큰 슬림화)**: `ui.css`에서 `.bottomnav-inner` 6열 균등 배치, `.checkin-dimension-sliders` 50% 축소.
3. **Step 3 (페이스메이커 위젯 리디자인)**: `index.html` 및 `ui.css`에서 `#crewPacingWidget`을 `⚡ 러닝메이트 라이브` 조형으로 세련되게 개편.
4. **Step 4 (아바타 렌더러 복원 및 새싹 소탕)**: `js/avatar-system.js`에서 새싹 윙 오버레이 소탕 및 `profile.avatar` 우선 표출 로직 배선.
5. **Step 5 (4대 뷰 실시간 동시 전파 & 회귀 검증)**: `renderHome`, `renderRecordsScreen` 동시 전파 및 `npm test` 무결성 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 신규 버튼 및 6대 탭 전수 클릭 시뮬레이션 -> 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조.
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인.
- **시나리오 D (Full State Propagation)**: 체크인 시 4대 뷰(홈, 기록, 통계, 캘린더) 동시 즉각 렌더링 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 삭제된 DOM(`#quickCheckinChips`, `#homeGrassSummaryCard`)을 호출하는 기존 스크립트의 Null Pointer Exception 가능성.
- **사전 방어 및 우회 로직**: 해당 함수(`renderHomeGrassSummaryCard`, `renderQuickCheckinGuideChips`)에 No-op 안전 가드를 설치하여 수밀성 유지.
- **롤백 계획 (Rollback Strategy)**: 작업 브랜치에서 git checkout으로 원복 가능하도록 세분화된 커밋 유지.
- **재검증 트리거**: 38개 integrity gate 또는 데드클릭 검사에서 1건이라도 실패 시 1~3단계 설계로 즉시 복귀하여 원인 재분석.
