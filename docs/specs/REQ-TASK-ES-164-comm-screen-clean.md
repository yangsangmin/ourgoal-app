# 요구사항 정의서 (REQ) — 소통창 화면정리 및 피드·소통 UI 시인성·피로도 개선

> **문서 ID**: REQ-TASK-ES-164-comm-screen-clean  
> **티켓 연계**: #TASK-ES-164  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 정의 (Problem Definition)
- **상민님 원문 요구사항**:
  - "소통창 화면정리" (노션 생각 메모장 [25]번)
  - "기타 정리안된 메모들에서 이관 · 소통창 시인성 개선"
- **현상적 결함 및 시각적 피로도 요인**:
  - 1) **서브탭 과밀 및 정돈 부족**: 6개 서브탭(피드, 팀, 🎁 마니또, 공유, DM, 동반자)이 한 화면에 비대칭하게 나열되어 모바일에서 텍스트가 잘리거나 시인성이 저하됨.
  - 2) **상단 영역 과다 점유**: 피드 탭 진입 시 상단에 거대한 템플릿 아코디언 배너와 퀵 게시 배너가 연달아 위치하여, 실제 동료들의 소통 글을 보려면 과도한 스크롤이 필요함.
  - 3) **피드 카드 시각적 피로도**: 카드 간 여백이 불균형하고, AI 생성물에 대한 3줄짜리 장문 고지문("이는 ai봇 생성물입니다...")이 매 카드마다 거대하게 차지하여 시각적 피로도가 극심함.
  - 4) **소통 뷰 전환 필터 부재**: 피드가 길어졌을 때 '전체 소통', '내 소통', '인증샷 피드'를 빠르게 골라볼 수 있는 정돈 장치가 부재함.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 분석 (Root Cause & 4 Elements)
- **[본질] (Essence)**:
  - 동류(비슷한 목표를 가진 사람들)와의 연결과 응원으로 고립되지 않고 꾸준히 실천하게 만드는 소통의 즐거움(E3 본질).
- **[원인] (Causes)**:
  - 기능이 점진적으로 추가되면서(피드, 팀, 마니또, DM, 동반자, 공유) 소통 탭 최상단 레이아웃이 누적되어 시인성 중심의 체계적 화면 정리가 이루어지지 않음.
- **[중심] (Core)**:
  - 모던 세그먼트 필(Pill) 탭 바, 상단 거대 배너의 슬림 툴바화, 피드 카드의 컴팩트 정돈 및 AI 미니 칩화.
- **[핵심] (Anchor)**:
  - 1) **서브탭 바 정돈**: 6대 탭에 통일된 아이콘과 세련된 필(Pill) 스타일 적용, 가로 스크롤 매끄러움 및 DM 레드 닷 뱃지 완벽 유지.
  - 2) **상단 퀵 배너 정리**: 거대 배너 2종을 세련된 1줄 접이식 퀵 배너 및 '게시하기' 플로팅/헤더 직결 버튼으로 시각적 뷰포트 확보.
  - 3) **피드 카드 슬림화 및 AI 뱃지 정돈**: 장문 AI 안내문을 세련된 '🤖 AI 가이드' 미니 뱃지와 툴팁으로 슬림화하여 피드 카드 높이 30% 절감.
  - 4) **피드 빠른 필터 칩 (전체 / 내 글 / 인증샷만)**: 사진 인증글이나 내 글만 빠르게 골라볼 수 있는 뷰 정돈 필터 제공.
  - 5) **빈 화면(Empty State) 정돈**: OurgoalComponents.emptyState 기반 깔끔한 안내 화면 통일.

---

## 3. [원칙 ③] 설계 및 아키텍처 방안 (Design & Architecture)
- **소통 네비게이션 (`index.html`, `ui.css`)**:
  - `renderCommScreen()`: 6대 서브탭을 모던 글래스모피즘 필 세그먼트 `.comm-subtabs-clean`으로 리팩토링.
- **피드 뷰 정돈 (`index.html`)**:
  - `renderCommFeed(body)`: 상단 배너를 컴팩트 툴바로 슬림화하고, 피드 카드 렌더링 시 AI 고지문을 1줄 배지로 정돈.
  - `state.commFeedFilter` (all / mine / photo) 연동.
- **스타일 시스템 (`ui.css`)**:
  - `.comm-subtabs-clean`, `.comm-clean-card`, `.ai-mini-badge`, `.comm-quick-strip` 등 세련된 스타일 추가.
- **PWA 서비스워커 (`sw.js`)**:
  - `ourgoal-shell-v20260917-es164` 캐시 갱신.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases & Countermeasures)
- DM 미확인 레드닷 뱃지 연동 보존: `dmSubtabBadge` 엘리먼트 ID 및 `OurgoalTeamInviteComm` 함수 완벽 보존.
- 기존 피드 기능 무손실: 리액션(불꽃/박수/하트/반짝임), 댓글 작성/토글, 신고/차단 팝업 100% 보존.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
- Step 1: `ui.css`에 소통창 전용 정돈 스타일(`.comm-subtabs-clean`, `.ai-mini-badge` 등) 정의.
- Step 2: `index.html` 내 `renderCommScreen` 서브탭 및 `renderCommFeed` 상단 배너·카드 마크업 정돈.
- Step 3: `sw.js` 캐시 버전 갱신 (`ourgoal-shell-v20260917-es164`).
- Step 4: `scripts/smoke-test.js`에 #TASK-ES-164 검증 로직 추가.
- Step 5: `npm test` 및 헌법 게이트 전수 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 304개 전수 통과 확인.
- `node scripts/verify-integrity-gate.js` 17대 게이트 100% PASS 확인.
- Dead Click 전수 검사 통과.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 소통창의 불필요한 시각적 잡음과 거대 배너를 걷어내고 실제 동료들의 실천 글과 응원 인터랙션이 최상단에 집중됨으로써 체류 시간과 소통 반응률이 대폭 향상됨.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: E3(동류 소통 — 함께 달리는 사람들과의 쾌적하고 즐거운 소통).
