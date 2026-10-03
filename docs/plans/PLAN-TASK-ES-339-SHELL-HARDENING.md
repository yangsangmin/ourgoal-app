# 엔지니어링 작업계획서 (PLAN) — #TASK-ES-339 홈 쉘 안정화 및 바텀시트 완전 모듈화

> **문서 ID**: PLAN-TASK-ES-339-SHELL-HARDENING  
> **요구사항 연계**: [REQ-TASK-ES-339-SHELL-HARDENING](../specs/REQ-TASK-ES-339-SHELL-HARDENING.md)  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-06, HOME-12, HOME-13  
> **작성 일시**: 2026-10-04  
> **작성자**: Antigravity 세션 28d56b7f  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 잔존 배너 및 위젯(오늘의 미션 `#todayMissionCard`, 평가 배너 `#homeEvalBanner`)을 바텀시트로 완전 격리(HOME-06)하고, 바텀시트 4중 탈출망 및 배경 35% 암막 규격을 공통화(HOME-12)하며, 375×667(iPhone SE) 스크롤 0px 달성 및 하단 안전 여백을 완성(HOME-13)한다.
- **영향 받는 파일 목록 전수**:
  - `js/tabs/home/sub-onescreen.js`: `todayMissionCard`, `homeEvalBanner` 시트 이관 배선 및 안전장치
  - `ui.css`: 바텀시트 암막 35%, `overscroll-behavior-y: contain`, `@media (max-height: 700px)` 콤팩트 무스크롤 룰셋
  - `docs/rules/TICKETS.md`: `#TASK-ES-339` 티켓 등록
  - `dev_log.md`: 개발 로그 기록
  - `reports/TASK-ES-339/claims.json`: 법정 주장서
  - `reports/TASK-ES-339/scenarios/*.json`: 법정 검증 시나리오

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질]**: 1초 콕핏의 완전무결성. 모바일 어떤 크기에서도 첫 화면 스크롤 0px 및 시트 전환의 극단적 부드러움.
- **[원인]**: 세로 공간을 차지하는 잔여 카드가 메인에 남아 있었고, 소형 높이 뷰포트용 미디어쿼리가 없었음.
- **[중심 배선]**: `sub-onescreen.js`의 `build()` 내 노드 안전 이동 및 `ui.css`의 `home-onescreen` 미디어쿼리.
- **[핵심 안전장치]**: DOM 노드 절대 삭제 금지 (노드째 이동). 기존 이벤트 핸들러 유지.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 변경 성격 |
| :--- | :--- | :---: | :---: | :--- |
| `js/tabs/home/sub-onescreen.js` | 잔여 배너/카드 노드 시트 이동 | +15줄 | -2줄 | 소블록 개선 (255줄, 800줄 이하) |
| `ui.css` | 암막 35% + contain + 700px 미디어쿼리 | +35줄 | -2줄 | 스타일 하드닝 |
| `docs/rules/TICKETS.md` | 대장 등재 | +1줄 | 0 | 규범 동기화 |
| `dev_log.md` | 작업 로그 | +10줄 | 0 | 개발 이력 기록 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] `#todayMissionCard`와 `#homeEvalBanner`의 내부 버튼(`handle오늘_Item25Action`, `openEvalModal`) 정상 작동 확인.
- [x] `#homeAddGoal` 버튼 상단 바 고정 상태 유지.
- [x] 375×812(812px) 및 375×667(667px) 무스크롤 보장.
- [x] `npm test` 38/38 통과 보장.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
- **Step 1**: `js/tabs/home/sub-onescreen.js` 수정 (노드 이동 보강)
- **Step 2**: `ui.css` 수정 (암막 35%, overscroll contain, @media max-height 700px)
- **Step 3**: 브라우저 실측 및 스크롤 높이 0px 검증
- **Step 4**: `npm test` 및 `node court/claims.js validate` 검증
- **Step 5**: `reports/TASK-ES-339/` 주장서 및 시나리오 작성
- **Step 6**: 커밋, 푸시, Draft PR 생성 및 GitHub Court 심사 청구

---

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- **반론**: *"바텀시트가 열렸을 때 뒤 화면이 살짝 비치는 것은 의도된 것인가?"*
  - **격파**: 네, HOME-12 정본에 따라 opacity 0.35로 살짝 비침으로써 유저가 원래 있던 홈 화면의 맥락을 잃지 않도록 보장하며, 백드롭 터치로 즉시 복귀할 수 있습니다.

---

## 7. [원칙 ⑦] 즉시 실행
- 작업 체크리스트에 따라 즉시 코드 수정 및 실측 진행.

---

## 8. [원칙 ⑧] 성과 측정
- 체크리스트 [4단계: 심사 청구] 완료 상태로 Draft PR 등록 및 법정 판정서 확보.
