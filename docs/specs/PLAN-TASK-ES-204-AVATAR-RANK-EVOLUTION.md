# 작업 계획서 (PLAN) — 홈 탭 아바타 5대 상징 랭크 고품격 입체 프레임 및 1레벨 단위 25단계(I~V) 점진적 성장 진화 시스템

> **문서 ID**: PLAN-TASK-ES-204-AVATAR-RANK-EVOLUTION  
> **티켓 연계**: #TASK-ES-204  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 제2조 제2항 8원칙 엄수

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표**:
  - 기존의 단조롭고 미약한 랭크 표현을 탈피하여, 오버워치/LoL 수준의 고품격 랭크 프레임(Crest Border)과 1레벨마다 성장하는 25단계(5대 랭크 × 5개 세부단계) 입체 벡터 SVG 엔진을 구축한다.
  - 홈 탭 상단바 우측(`sanctuaryAvatarBadge`, `topAvatar`)과 메인 레벨 영역(`levelBadgeRow`)에 빈틈없이 실시간 렌더링한다.
- **영향받는 파일 전수 목록**:
  1. `js/avatar-system.js`: 25단계 성장 벡터 SVG 렌더러, 랭크 메타데이터, `renderAvatarHtml` 확장.
  2. `ui.css`: 랭크 테두리, 서브티어 뱃지, 테마별 네온 글로우 스타일.
  3. `index.html`: `updateTopBar` 및 `levelBadgeHtml` 연동 배선.
  4. `reports/TASK-ES-204/claims.json`: 법정 심사용 주장 파일.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 배선(Wire) 식별 (Essence, Causes, Core & Wiring)

- **[본질] (Essence)**:
  - 매일 실천하여 경험치(XP)를 획득하고 레벨업하는 순간마다 캐릭터 외형이 1레벨 단위로 뚜렷하게 진화하는 시각적 성장 보상(E1 체크인 루프 강화).
- **[원인] (Causes)**:
  - 기존 5대 테마가 5레벨 단위로만 변화하여 1~4레벨 구간에서 시각적 성장 체감이 정체되었고, 단순 외곽 선 위주로 디자인되어 테마의 상징성이 미약했던 문제.
- **[중심] (Core Bottleneck)**:
  - 5대 테마(새싹·숲·포세이돈·제우스·우주) × 5개 세부단계(I~V) = 25단계 정밀 벡터 SVG 엔진 구축 및 상단바·메인 카드의 통일된 반응형 렌더링 파이프라인.
- **[핵심] (Critical Anchor)**:
  - 유저의 기존 아바타를 침범하지 않으면서 외곽에 완벽히 결합되는 `[외곽 오라 + 1레벨 진화 날개/식물 + 랭크 테두리 크레스트 + 중앙 상징 엠블럼 + 서브티어 뱃지]` 5중 결합 아키텍처.
- **전역 상태(`state`) 영향 분석**:
  - `state.profile.settings.xp.total`: 기존 XP 총량을 그대로 사용. 스키마 변경 0건.
  - `levelProgress(xp)`: 기존 레벨 산출 로직 100% 호환.
- **데이터 및 렌더링 파이프라인 흐름도**:
  ```mermaid
  flowchart TD
      XP["XP 총량 (state.profile.settings.xp.total)"] --> LP["levelProgress(xp) ➔ level 산출"]
      LP --> RTI["getRankThemeInfo(level) ➔ themeId, subStep(1~5), subTier('I'~'V')"]
      RTI --> SVG["getRankWingsSvg(level, size, options) ➔ 25단계 정밀 벡터 그래픽"]
      SVG --> RAH["renderAvatarHtml(level, profile, options)"]
      RAH --> TOP["홈 상단바 (sanctuaryAvatarBadge) [40px 콤팩트 프레임]"]
      RAH --> MAIN["홈 메인 카드 (levelBadgeRow) [54px 웅장한 프레임 + 서브티어 텍스트]"]
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **파일별 변경 예산**:
  - `js/avatar-system.js`: 약 +250줄 / -60줄 (25단계 세부 SVG 패스 엔진 탑재)
  - `ui.css`: 약 +40줄 / -5줄 (프레임 및 글로우 클래스 추가)
  - `index.html`: 약 +35줄 / -15줄 (상단바 및 메인 레벨 카드 배선 개선)
- **4위 1체 배선 명세**:
  - **HTML (마크업)**: `.avatar-rank-aura-wrap`, `.rank-theme-crest`, `.avatar-subtier-pill`.
  - **리스너 (Listener)**: 기존 아바타 변경 모달 직통 연결(`onclick`, `openAvatarTrigger`) 100% 보존.
  - **비즈니스 로직**: 1레벨 단위 `subStep` 산출 및 5대 테마 × 5단계 디테일 분기.
  - **피드백**: 레벨업 시 새로운 외형으로 즉시 실시간 전환.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Non-Destructive Guarantee)

- **유저 자산 보존**:
  - 사용자가 업로드한 커스텀 아바타 이미지나 생성한 3등신 캐릭터 설정이 단 1바이트도 손상되지 않음.
- **크로스 브라우징 및 반응형 보증**:
  - 순수 SVG 벡터로 제작되어 안드로이드/아이폰 320px 모바일 화면에서도 깨짐이나 뭉개짐 없이 선명함 유지.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. `js/avatar-system.js` 25단계 엔진 구현:
   - 새싹(Sprout I~V): 씨앗 떡잎 ➔ 뻗어나는 줄기 ➔ 세잎 본잎 ➔ 덩굴 아치 ➔ 만개한 꽃망울과 황금 이슬.
   - 숲(Forest I~V): 참나무 묘목 ➔ 푸른 잔가지 ➔ 수호목 룬 ➔ 세계수 가지 ➔ 에인션트 트리 문장.
   - 포세이돈(Poseidon I~V): 파도 테두리 ➔ 급류 아치 ➔ 삼지창 심볼 ➔ 거대 해일 ➔ 황금 삼지창 엠블럼.
   - 제우스(Zeus I~V): 번갯불 테두리 ➔ 쌍번개 아치 ➔ 천둥 방패 ➔ 벼락 날개 ➔ 신검 벼락 엠블럼.
   - 코스믹(Cosmic I~V): 궤도 링 ➔ 나선 은하 팔 ➔ 초신성 성간 가스 ➔ 3중 궤도 ➔ 무한 펄서 엠블럼.
2. `index.html` 연동:
   - `updateTopBar()` 및 `levelBadgeHtml()`에 25단계 렌더러 연결.
3. `ui.css` 스타일 다듬기:
   - 그림자, 발광 효과, 반응형 패딩 최적화.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Claims Specification)

- **주장 항목**:
  1. `avatar-rank-evolution-25levels`:
     - 1레벨부터 25레벨까지 각 레벨마다 SVG 그래픽에 해당 서브티어의 고유 클래스 및 형상이 정상 렌더링됨을 입증.
  2. `home-topbar-avatar-rank-frame`:
     - 홈 탭 상단바 우측 아바타에 랭크 프레임과 레벨 표시가 정상 탑재됨을 입증.
  3. `home-main-avatar-rank-display`:
     - 홈 탭 메인 레벨 카드의 아바타 랭크 콕핏에 랭크명과 서브티어(`🌱 새싹 I` 등)가 정상 노출됨을 입증.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)

- [ ] 1. `js/avatar-system.js` 25단계 벡터 그래픽 엔진 구현
- [ ] 2. `ui.css` 랭크 스타일 정의
- [ ] 3. `index.html` 상단바 및 레벨 카드 연동
- [ ] 4. 로컬 CDP 스크립트 실행 및 25단계 시각 검증 스크린샷 확인
- [ ] 5. `npm test` 및 `court/selftest/run.js --unit-only` 실행
- [ ] 6. 법정 주장 파일(`reports/TASK-ES-204/claims.json`) 작성
- [ ] 7. GitHub 초안 PR 제출 및 법정 심사 대기

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Rollback Plan)

- **잠재 이슈**: SVG 문자열 결합 시 작은 따옴표나 구문 누락으로 인한 렌더링 오류.
- **방어책**: 모듈 단위 문법 검사(`node -c js/avatar-system.js`) 및 1~25레벨 전수 루프 사전 테스트 실행.
