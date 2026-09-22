# [PLAN] #TASK-ES-207 20대 후반 여성 타깃 감성·모던 미니멀 아바타 랭크 오브제 25단계 전면 개편

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표**:
  - 기존의 거대하고 번잡한 MMORPG식 날개/무기 SVG 엔진을 전면 폐기하고, 20대 후반 여성 사용자가 한눈에 "합리적이고 깔끔하면서도 귀여운 미니 오브제"라고 느낄 수 있는 **감성·모던 미니멀 헤드 오브제(Head Object) 벡터 SVG 엔진**으로 전면 재구축한다.
- **영향받는 파일 전수 목록**:
  1. `[MODIFY]` [`js/avatar-system.js`](file:///C:/dev/ourgoal-app/js/avatar-system.js) (5대 테마 25단계 미니멀 감성 오브제 렌더러 구축)
  2. `[MODIFY]` [`ui.css`](file:///C:/dev/ourgoal-app/ui.css) (과격한 플래시/펄스 제거 및 산뜻한 softFloat 모션 배선)
  3. `[MODIFY]` [`sw.js`](file:///C:/dev/ourgoal-app/sw.js) (PWA 캐시 버전 최신화)
  4. `[MODIFY]` [`docs/rules/TICKETS.md`](file:///C:/dev/ourgoal-app/docs/rules/TICKETS.md) (티켓 등록 완료)
  5. `[NEW]` [`reports/TASK-ES-207/claims.json`](file:///C:/dev/ourgoal-app/reports/TASK-ES-207/claims.json) (법정 정식 청구서)
  6. `[NEW]` [`docs/specs/REQ-TASK-ES-207-MINIMAL-CUTE-RANK-OBJECTS.md`](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-207-MINIMAL-CUTE-RANK-OBJECTS.md) (8원칙 REQ 정본)
  7. `[NEW]` [`docs/specs/PLAN-TASK-ES-207-MINIMAL-CUTE-RANK-OBJECTS.md`](file:///C:/dev/ourgoal-app/docs/specs/PLAN-TASK-ES-207-MINIMAL-CUTE-RANK-OBJECTS.md) (8원칙 PLAN 정본)

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence, Causes, Core & Anchor)

- **귀속 축**: `[E1]` (체크인 루프 및 캐릭터 성장 즉각 효능감)
- **체감 가설**:
  - 거추장스러운 날개와 무기를 걷어내고 머리 위 정중앙에 얹힌 앙증맞은 오브제가 1레벨마다 아기자기하게 성장할 때, 20대 후반 여성 사용자가 시각적 피로 없이 따뜻한 애착과 성취감을 느낀다.
- **4대 요소 엔지니어링 분석**:
  - **[가목] 본질 (Essence)**:
    - 20대 후반 여성의 눈높이에 맞춘 '무공해 미니멀리즘'. 번쩍거리는 과시가 아닌, 단정하고 감성적인 일상의 갓생 기록 캐릭터로서의 완성도를 구현한다.
    - **무공해성 (Anti-Pollution)**: 거친 번개와 날카로운 무기를 전면 배제하고 소프트 파스텔 톤과 둥근 곡선으로 힐링을 제공한다.
    - **RPG식 체감 (Immediate Self-Efficacy)**: 1레벨(떡잎 하나) ➔ 2레벨(쌍떡잎과 이슬) ➔ 3레벨(클로버) ➔ 4레벨(미니 화관) ➔ 5레벨(데이지 꽃송이)로 이어지는 앙증맞은 디테일의 변화를 즉각 체감한다.
    - **동류 연대 (Peer Accompaniment)**: 프로필과 랭킹에서 서로의 아바타를 보며 부담 없는 귀여움을 나누는 친근한 연대감 형성.
  - **[나목] 원인 (Root Causes)**:
    - `getRankWingsSvg`가 가로 폭(`x: 0 ~ 80`) 전체를 덮는 거대 날개 패스를 생성하여 아바타를 침범함.
  - **[다목] 중심 (Core Bottleneck)**:
    - SVG 뷰포트 상단 영역(`y: 2 ~ 20`)에 집중된 컴팩트 오브제 앵커링 좌표계의 부재.
  - **[라목] 핵심 (Critical Anchor)**:
    - 아바타 머리 위 중심(`cx: 40`, `cy: 12`)에 안착하는 모던 미니멀 오브제 렌더러로 좌표계 통일.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **파일별 변경 예산 (Diff Budget)**:
  - `js/avatar-system.js`: 약 +280줄, -320줄 (복잡한 날개 패스 소탕 및 심플 감성 오브제 교체)
  - `ui.css`: 약 +30줄, -40줄 (헤비 애니메이션 경량화)
  - `sw.js`: 약 +1줄, -1줄 (캐시 갱신)
  - `reports/TASK-ES-207/claims.json`: 약 +60줄
  - 총 변경 예산: 약 +370줄, -360줄의 정돈된 리팩토링.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Anti-Regression)

- **320종 페르소나 100% 보존**:
  - 아바타 SVG/PNG 바디 및 얼굴 레이어는 일절 건드리지 않고, 머리 위 장식 레이어만 정돈.
- **[48] 회귀 방지**:
  - `scripts/smoke-test.js` 6710행 검사 규격인 `size: 54` 및 `width:54px;height:54px;` 엄격 유지.
- **상단바 호환성**:
  - `options.compact` 모드 시 상단바 36px에서도 자연스럽게 축소 렌더링되도록 뷰포트 비율 보정.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **`js/avatar-system.js` SVG 엔진 리뉴얼**:
   - `RANK_THEMES_5` 25단계 서브티어 명칭을 감성적인 톤으로 정돈 (예: '씨앗 발아' ➔ '아기 떡잎', '올림포스 벼락' ➔ '미니 썬더 핀').
   - `getRankWingsSvg(level, size, options)` 함수 내부를 25종의 산뜻하고 심플한 미니멀 벡터 오브제로 전격 교체.
2. **`ui.css` 모션 정돈**:
   - 과도한 회전/펄스 제거, `softFloat`(부드럽게 1~2px 둥실 떠오르는) 모션 적용.
3. **`sw.js` 캐시 갱신**:
   - `CACHE_NAME`을 `ourgoal-shell-v20260922-task-es207-minimal-cute-rank-objects`로 갱신.
4. **`reports/TASK-ES-207/claims.json` 작성**:
   - R1~R5 정식 요구사항 및 주장 등록.
5. **로컬 실측 및 스크린샷 캡처**:
   - 25개 전 레벨 갤러리 및 모바일 375px live 캡처 생성하여 시각 무결성 입증.
6. **테스트 및 게이트 검증**:
   - `npm test` 335개 테스트 전수 통과 확인.
7. **심사 청구 (4단계 마감 상한선 준수)**:
   - PR 오픈 시 상민님 Reviewer/Assignee 즉시 배정 및 법정 판정 대기.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Claims & SPOF Verification)

- **법정 주장 설계 (`reports/TASK-ES-207/claims.json`)**:
  - **R1**: 5대 테마 25단계 모던 미니멀 감성 오브제 렌더러가 `js/avatar-system.js`에 구현되어야 한다.
  - **R2**: 25단계 감성 서브티어 데이터가 `js/avatar-system.js`에 배선되어야 한다.
  - **R3**: 아바타 머리 위 미니멀 오브제와 프레임이 홈 탭 상단바 및 메인 레벨 뱃지에 배선되어야 한다.
  - **R4**: 감성적 softFloat 애니메이션이 `ui.css`에 배선되어야 한다.
  - **R5**: PWA 캐시명이 최신 버전으로 갱신되어야 한다.
- **재검증 과정에서 도출된 절차 수정사항**:
  - 오브제 크기가 너무 작아 보이지 않도록 `viewBox="0 0 80 80"` 기준 머리 위 영역(`x: 20~60, y: 2~22`)을 꽉 채우는 앙증맞은 비율로 조정함.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)

- [ ] 1단계: `js/avatar-system.js` 25단계 미니멀 감성 SVG 엔진 교체
- [ ] 2단계: `ui.css` 감성 애니메이션 교체
- [ ] 3단계: `sw.js` 캐시 네임 갱신
- [ ] 4단계: `reports/TASK-ES-207/claims.json` 작성
- [ ] 5단계: 로컬 25단계 갤러리 실측 캡처
- [ ] 6단계: `npm test` 335개 테스트 & 38개 게이트 & 767개 버튼 통과
- [ ] 7단계: Tri-Sync 100% 무결성 검증
- [ ] 8단계: 초안 PR 생성 및 상민님 Reviewer/Assignee 지정, 법정 심사 청구

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재 장애**:
  - 기존 날개 클래스를 참조하던 스타일이 깨질 수 있음.
- **롤백 계획**:
  - `git revert`로 즉시 복원 가능하도록 모듈 단위 독립성 유지.
