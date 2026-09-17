# 작업 계획서 (PLAN) — 아바타 레벨별 상징 백그라운드 이미지 결합 시스템

> **문서 ID**: PLAN-TASK-ES-159-avatar-rank-backgrounds  
> **티켓 연계**: #TASK-ES-159  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 목표 수립 (Problem & Goal)
- **목표**:
  - 상민님 지정 원문("오버워치, 롤 등 게임의 랭크 오를 때 프로필창 옆으로 이미지 변화하는 시스템", "새싹->숲->포세이돈->제우스->우주", "각 테마별 5레벨 기준", "아바타 이미지 가리지 않게 결합")을 100% 만족하는 랭크 백그라운드 시스템 구축.
  - 홈 탭, 아바타 모달, 레벨업 모달에서 일관되게 렌더링되도록 4위 1체 배선.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 정립 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 성장의 가시화와 자기개발 성취감의 극대화. 유저의 꾸준한 노력이 새싹에서 우주로 피어나는 영광의 훈장.
- **[원인] (Causes)**:
  - 기존에는 아바타 영역이 사각형 테두리에 갇혀 외곽 백그라운드 결합 레이어가 없었고, 5대 테마 자산 및 렌더러가 부재했음.
- **[중심] (Core)**:
  - 아바타 이미지를 완벽히 보존하면서 양옆과 외곽을 감싸는 rank-background-aura 샌드위치 렌더러 구축 및 5레벨 기준 테마 매핑.
- **[핵심] (Anchor)**:
  - 5대 테마 규격화:
    - 1단계 (Lv.1~5): 🌱 새싹 테마 (귀여운 새싹과 잎사귀 오라)
    - 2단계 (Lv.6~10): 🌲 울창한 숲 테마 (풍성한 나뭇잎과 자연의 숨결 오라)
    - 3단계 (Lv.11~15): 🌊 포세이돈 테마 (푸른 파도와 물보라 날개 오라)
    - 4단계 (Lv.16~20): ⚡ 제우스 테마 (찬란한 황금빛 번개와 신화적 오라)
    - 5단계 (Lv.21+): 🌌 코스믹 우주 테마 (신비로운 은하수와 별빛 궤도 오라)

---

## 3. [원칙 ③] 설계 및 아키텍처 (Architecture & Effective Solutions)
- **모듈 구조 (js/avatar-system.js)**:
  - getRankThemeInfo(level): 테마 메타데이터 반환 (id, name, icon, title, desc, gradient, wingsSvg).
  - getRankBackgroundSvg(level, size): 아바타 크기(size)에 비례하는 양옆 날개/오라 벡터 그래픽 생성.
  - renderAvatarHtml: withRankBg 옵션을 수용하여 래퍼(.avatar-rank-aura-wrap)와 함께 렌더링.
- **CSS 스타일링 (ui.css)**:
  - .avatar-rank-aura-wrap: relative, flex, overflow: visible.
  - .rank-bg-layer: absolute, inset, z-index: 1, pointer-events: none.
  - .avatar-main-frame: relative, z-index: 2 (아바타 절대 가림 방지).
  - 테마별 글로우 애니메이션(@keyframes sproutPulse, oceanWave, zeusThunder, cosmicGlow).

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases)
- **작은 UI(36px) 시인성**: 날개/오라가 텍스트나 인접 버튼을 가리지 않도록 적정 마진 확보.
- **커스텀 아바타 및 기본 로봇 아바타 동시 지원**: 어떤 아바타 모드든 랭크 백그라운드가 완벽히 결합됨.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
1. Step 1: js/avatar-system.js에 5대 테마 정의 및 SVG 렌더러 함수 추가.
2. Step 2: ui.css에 랭크 백그라운드 오라 및 애니메이션 스타일 탑재.
3. Step 3: index.html의 levelBadgeHtml 및 아바타 모달, 레벨업 모달 연동.
4. Step 4: scripts/smoke-test.js에 compliance 테스트 추가.
5. Step 5: npm test 및 verify-integrity-gate.js 검증.
6. Step 6: 커밋 및 로컬 main 병합.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- Level 0, 음수, 또는 미정의 시 Lv.1(새싹) 기본값 보장.
- Level 25 초과 시 우주 테마 최상위 유지.

---

## 7. [원칙 ⑦] 검증 기준 (Success Metrics)
- npm test 전수 통과 (299개 이상).
- verify-integrity-gate.js 17개 헌법 게이트 100% 통과.
- Dead Click 0건.

---

## 8. [원칙 ⑧] 문제 발생 시 롤백 및 대응 (Blockers & Fallback)
- 만약 SVG 렌더링 에러 시 기본 CSS box-shadow 글로우로 무장애 폴백.
