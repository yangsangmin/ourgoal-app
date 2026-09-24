# 작업계획서 (PLAN) — 소통탭 8중 레이어 다이어트 및 모바일 375px 타이포그래피·조형 전면 정상화

> **문서 ID**: PLAN-TASK-ES-250-UX-NORMALIZATION  
> **티켓 연계**: #TASK-ES-250  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 사항**:
  - *"다시 노션 db들 전체 일괄 확인해. 앱 다시 확인해보니 개선이 되기는 커녕 오히려 퇴화했는데 원인 정밀분석해"*
  - *"정상화 및 개선작업 목록을 아워골 명령입력/메모장 db에 구축해"*
  - *"진행"*
- **해결할 핵심 결함 요약**:
  1. 소통탭 8중 장벽(안내, 레이더, 통계, 헤더, 서브탭, 초대바, 필터, 피드)으로 피드 접근성 저해.
  2. 통계 카드 내 `[✍️ 새 글 나누기]` 및 목표탭 상하 `+ 새 목표 만들기` 중복 버튼 잔존.
  3. 375px 모바일 화면에서 러닝메이트 타이틀 및 캘린더 잠금화면 저장 버튼 글자 쪼개짐, 히트맵 기간 알약 우측 잘림.
  4. 검사 통과용 `min-height: 44px` 강제로 인한 서브탭 버튼 둔탁화.
  5. 기록탭 6대 서브탭과 히트맵 아래로 다시 돌출되는 '기록/통계' 헤더의 족보 꼬임.
  6. 게스트 모드 토스트 배너의 하단 탭바 차폐.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1(체크인 루프), E3(동류 소통) & FIX
- **[본질] (Essence)**:
  - 이 작업의 본질은 **"과도한 적층과 무리한 CSS 수치 강제로 왜곡된 모바일 사용 환경을 걷어내고, 사용자가 앱을 켰을 때 1초 만에 동류들의 실천과 나만의 목표에 편안하게 몰입할 수 있는 시각적 순수성과 조형적 균형을 회복하는 것"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 소통탭 하위 피드 위에 동반자 초대/검색 전용 바가 상시 노출되어 수직 공간을 잠식함.
  2. **원인 2**: 좁은 폭(375px)에 대한 정밀한 유동 폰트 및 `white-space: nowrap` 처리가 누락되어 단어가 쪼개짐.
  3. **원인 3**: 상위 성소 뷰와 하위 레거시 뷰 간의 헤더/세그먼트바 정리 누락으로 족보 꼬임 발생.
- **[중심] (Core Bottleneck & Anchor)**:
  - 동반자 초대바는 `companion` 서브탭에서만 표시하고, 중복 버튼 소거 및 카드 패딩 콤팩트화(10px 14px)로 피드 1화면 직통 노출.
  - 러닝메이트 타이틀, 캘린더 액션 버튼, 히트맵 기간 알약(flex:1) 전수 줄바꿈 박멸.
  - 서브탭 38px 황금비 터치 복원 및 기록탭 중복 헤더 정리.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 사용자 데이터 100% 보존.
  - 헌법 게이트 38/38, 스모크 367/367, 데드클릭 838/838 무결성 유지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **전략**:
  - 기존 로직의 불필요한 삭제가 아닌, 뷰 위계의 정상화 및 조건부 가시성 제어 적용.
  - 기계적 고정 픽셀(44px) 대신 황금비 터치 타깃(38px)과 반응형 유동 배분(flex: 1) 채택.

---

## 4. [원칙 ④] 세밀한 계획 수립 (Detailed Breakdown)

- **파일별 상세 구현 계획**:
  1. `index.html`:
     - `#commHeroCard` 내 중복 버튼 제거.
     - `renderCommScreen()`에서 `#commTopCompanionBar` 조건부 노출(`state.commSubTab === 'companion'`).
     - `toast()` 함수에 클릭 즉시 닫기(`el.onclick = function(){ el.classList.remove('show'); };`) 배선.
  2. `ui.css`:
     - `.s-radar-title`, `.s-radar-title b`에 `white-space: nowrap !important; word-break: keep-all !important;` 부여.
     - `.s-segment-pills` 및 `.s-seg-pill`에 `flex: 1; text-align: center; padding: 6px 2px !important;` 반응형 균등 분배 배선.
     - `.goals-subtabs-grid .comm-subtab` 및 `.comm-subtabs-grid .comm-subtab` min-height를 38px로 정돈.
     - `.toss-record-hero-card` 및 `.toss-community-hero-card` 패딩을 10px 14px, 마진 8px로 컴팩트화.
     - 성소 테마에서 `#screen-records > .screen-head` 및 `#recSegmentBar` 중복 숨김.
     - `.toast.show`에 `pointer-events: auto !important; cursor: pointer;` 배선.
  3. `js/sanctuary-v3-engine.js`:
     - 목표 0건 시 빈 알약 래퍼 유지 및 중복 버튼 억제.
     - 캘린더 잠금화면 버튼에 `white-space: nowrap; word-break: keep-all; font-size: 0.75rem;` 배선.
  4. `scripts/smoke-test.js`:
     - `[#TASK-ES-250]` 전용 8대 정상화 검증 테스트 슈트 탑재.

---

## 5. [원칙 ⑤] 가역적 · 점진적 실행 (Incremental Execution)

- **단계별 실행 및 롤백 대책**:
  - Git 브랜치 `feat/2026-09-24-task-es-250-ux-normalization`에서 단계별 수정.
  - 단위 작업마다 `npm test`를 즉시 구동하여 단 1건의 회귀도 즉시 탐지.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Regression Check)

- **검증 기준**:
  1. `npm test` 전수 실행 (367개 단위 테스트, 38개 헌법 게이트, 838개 데드클릭 100% 통과).
  2. `scripts/essence-gate.js` 규칙 자체 테스트 통과.
  3. 커밋 메시지 규격 검사 (`[E1] #TASK-ES-250 feat: ...`).
  4. Headless Chrome 실측 캡처를 통한 375px 모바일 화면 시각 무결성 확인.

---

## 7. [원칙 ⑦] 다각도 회고 및 지속 개선 (Retrospective)

- **교훈**:
  - UI 품질은 단순한 테스트 통과 수치가 아니라, 실제 유저가 손에 쥐었을 때 느껴지는 조화와 직관성에서 비롯됨.
  - 향후 모든 태스크에서 375px 모바일 뷰포트 시각 검사를 선제적으로 포함할 것.

---

## 8. [원칙 ⑧] 완벽한 문서화 및 공유 (Documentation & Sync)

- **동기화 내역**:
  - 노션 DB #1 (`💡 아워골 명령입력/메모장`) [119]~[126] 완료 상태 갱신.
  - 옵시디언 마크다운 정본 노트 동기화.
  - 관제센터 저널(`journal.jsonl`) 및 Tri-Sync 무결성 100% 확인.
  - GitHub 초안 PR 제출 및 법정(Court) 심사 청구.
