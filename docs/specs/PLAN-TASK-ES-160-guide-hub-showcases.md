# 작업 계획서 (PLAN) — 각 탭 활용법 내용 최신화 및 실제 우수 사용사례 이미지 쇼케이스 결합

> **문서 ID**: PLAN-TASK-ES-160-guide-hub-showcases  
> **티켓 연계**: #TASK-ES-160  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 목표 수립 (Problem & Goal)
- **목표**:
  - 상민님 지정 원문("각 탭 활용법 내용 최신화", "실제 우수 사용사례 이미지를 첨부", "와 나도 저렇게... 느끼게 해야함")에 따라, 5대 탭(홈, 목표, 캘린더, 기록, 소통)의 최신 기능 가이드 및 우수사례 쇼케이스를 집대성한 통합 허브 모달을 구축하고 배선.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 정립 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 성장에 대한 영감과 열망의 점화. 단순 설명서를 넘어 "나도 저렇게 멋진 인생 목표를 달성하고 싶다"는 감성을 자극하는 비주얼 쇼케이스.
- **[원인] (Causes)**:
  - 기능은 고도화되었으나 가이드는 v1.0 초기 상태로 방치되었고, 시각적 우수사례 예시와 탭별 원터치 진입로가 결여되어 있었음.
- **[중심] (Core)**:
  - 5개 탭을 자유롭게 넘나들며 최신 기능과 우수사례 쇼케이스를 감상하고 '바로 실천해보기'로 직결되는 통합 가이드 허브(#tabGuideHubModal) 구축.
- **[핵심] (Anchor)**:
  - 5대 탭별 최신화 및 감성 쇼케이스:
    - 홈: 오늘 미션 + 5대 상징 랭크 아바타(새싹~우주) + 일일 루틴 ➔ [우수사례] Lv.18 제우스 랭크의 갓생 대시보드
    - 목표: 3계층(목표-마일스톤-할일) + AI 현상태 분석 + 캘린더 일정 배지 ➔ [우수사례] 바디프로필 100일 3계층 목표 설계
    - 캘린더: 24시간 시간표 + 일자별 50% 사진일기장 배경 + 구글캘린더 무음 연동 ➔ [우수사례] 런던 여행 & 헬스 비주얼 다이어리
    - 기록: 전문 템플릿(운동 볼륨·스톱워치) + 노션 다이렉트 전송 + 차트 ➔ [우수사례] 3대 500 운동 볼륨 누적 차트 & 노션 전송
    - 소통: 1:1 실시간 DM + 동류 찾기 + 마니또 찌르기 ➔ [우수사례] 아침 6시 기상 크루의 실시간 응원 & 마니또 소통

---

## 3. [원칙 ③] 설계 및 아키텍처 (Architecture & Effective Solutions)
- **자바스크립트 구조 (index.html)**:
  - TAB_GUIDES_DATA: 5대 탭별 최신 기능 요약 3종 + 우수사례 쇼케이스 카드 데이터.
  - openTabGuideHubModal(tabKey): 통합 모달 오픈, 탭바 전환, '바로 실천해보기' switchTab 연결.
  - startFirstLoginGuide() 최신화: 6단계 온보딩 텍스트를 최신 기능으로 전면 개정.
- **CSS 스타일링 (ui.css)**:
  - .guide-hub-container, .guide-nav-bar, .guide-showcase-card, .showcase-preview-frame.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases)
- 작은 뷰포트에서 스크롤 끊김 없는 터치 UX 보장.
- 가이드에서 '실천하기' 클릭 시 모달이 닫히며 해당 화면으로 부드럽게 이동.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
1. Step 1: index.html에 TAB_GUIDES_DATA 및 openTabGuideHubModal 구현.
2. Step 2: ui.css에 가이드 허브 및 쇼케이스 카드 스타일 추가.
3. Step 3: 설정 탭 및 온보딩 가이드 최신화 배선.
4. Step 4: scripts/smoke-test.js에 compliance 테스트 추가.
5. Step 5: npm test 및 verify-integrity-gate.js 검증.
6. Step 6: 커밋 및 로컬 main 병합.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- 탭 전환 시 이벤트 리스너 중복 바인딩 방지.
- 게스트/로그인 유저 모두 안전하게 열람 가능.

---

## 7. [원칙 ⑦] 검증 기준 (Success Metrics)
- npm test 전수 통과 (300개 이상).
- AST 헌법 게이트 17종 100% 통과.
- Dead Click 0건.

---

## 8. [원칙 ⑧] 문제 발생 시 롤백 및 대응 (Blockers & Fallback)
- 모달 열림 실패 시 토스트 안내 및 이전 상태 보존.
