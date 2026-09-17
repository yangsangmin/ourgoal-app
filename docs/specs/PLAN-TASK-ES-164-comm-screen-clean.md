# 작업 계획서 (PLAN) — 소통창 화면정리 및 피드·소통 UI 시인성·피로도 개선

> **문서 ID**: PLAN-TASK-ES-164-comm-screen-clean  
> **티켓 연계**: #TASK-ES-164  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 목표 수립 (Problem & Goal)
- **목표**:
  - 상민님 직접 지시("소통창 화면정리", 생각 메모장 [25]번)에 따라,
  - 6대 서브탭 네비게이션 시인성 개선, 상단 거대 배너 슬림화, 피드 카드의 시각적 피로도(장문 AI 고지문 등) 해소 및 빠른 필터 뷰(전체/내소통/사진)를 구축하여 소통창을 쾌적하고 정돈된 화면으로 일신함.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 정립 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 동류 소통의 가치(E3)를 극대화하기 위한 군더더기 없는 시각적 시인성과 상호작용 편의성.
- **[원인] (Causes)**:
  - 서브탭 증가로 인한 복잡도, 피드 상단의 중복 거대 배너, 장문 텍스트 박스로 인한 시각 피로.
- **[중심] (Core)**:
  - 깔끔한 서브탭 세그먼트, 슬림한 상단 툴바, 쾌적한 피드 카드 레이아웃.
- **[핵심] (Anchor)**:
  - 1) 서브탭 바 정돈 (`.comm-subtabs-clean`).
  - 2) 피드 상단 템플릿/게시 배너의 컴팩트 툴바화.
  - 3) AI 게시물 고지문의 슬림 미니 뱃지(`🤖 AI 가이드`)화.
  - 4) 피드 퀵 필터 칩(전체 / 내 글 / 인증샷만).
  - 5) DM 미확인 레드닷 뱃지 및 기존 상호작용 100% 무손실 보존.

---

## 3. [원칙 ③] 설계 및 아키텍처 (Architecture & Effective Solutions)
- **UI 및 렌더링 로직 (`index.html`)**:
  - `renderCommScreen()`:
    - 6대 탭(📰 피드, 👥 팀, 🤝 동반자, 💬 DM, 🎁 마니또, 📤 공유)을 체계적이고 직관적인 아이콘-라벨 구조로 개편.
    - DM 레드 닷 뱃지 `#dmSubtabBadge` 보존.
  - `renderCommFeed(body)`:
    - 상단 거대 배너 2개를 슬림한 1줄 퀵 바(`.comm-quick-strip`)로 일원화.
    - 장문 AI 고지문을 슬림 뱃지(`.ai-mini-badge`)로 대체.
    - 퀵 필터(전체, 내 글, 인증샷) 바인딩 지원.
- **디자인 시스템 (`ui.css`)**:
  - `.comm-subtabs-clean`, `.ai-mini-badge`, `.comm-quick-strip` 등 스타일 추가.
- **캐시 갱신 (`sw.js`)**:
  - `ourgoal-shell-v20260917-es164`.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases)
- DM 수신 알림 및 레드 닷 뱃지 배선 100% 보존.
- 피드 댓글, 리액션, 신고, 공유 등 기존 100% 기능 보존.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
1. Step 1: `ui.css`에 소통창 전용 정돈 스타일 추가.
2. Step 2: `index.html` 내 `renderCommScreen` 및 `renderCommFeed` UI 정돈 구현.
3. Step 3: `sw.js` 캐시 버전 갱신 (`ourgoal-shell-v20260917-es164`).
4. Step 4: `scripts/smoke-test.js`에 #TASK-ES-164 테스트 추가.
5. Step 5: `npm test` 및 `verify-integrity-gate.js` 전수 통과 확인.
6. Step 6: 커밋 및 로컬 main 병합, Tri-Sync 완료.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 304개 전수 통과 확인.
- `node scripts/verify-integrity-gate.js` 17대 게이트 100% PASS 확인.
- Dead Click 전수 검사 통과.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 상단 시각적 점유 면적이 대폭 감소하고 실제 소통 피드가 첫 화면에서 바로 노출되어 소통 시인성과 유저 만족도가 비약적으로 개선됨.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: E3(동류소통 — 고립되지 않는 즐거운 동반 실천).
