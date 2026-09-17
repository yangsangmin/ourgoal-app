# 작업계획서 (PLAN) — 활용법 내 아바타 전용 탭 최우선(맨 앞) 신설 및 5대 랭크·오라·인사팝업 200% 활용 가이드 & 우수사례 쇼케이스 구축

> **문서 ID**: PLAN-TASK-ES-166-avatar-guide-hub-first  
> **티켓 연계**: #TASK-ES-166  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 기존 5대 탭(`홈`·`목표`·`일정`·`기록`·`소통`) 체제로 운영되던 가이드 허브(`openTabGuideHubModal`)의 최우선(맨 앞)에 `avatar` 탭을 배치하여 `[아바타] ➔ [홈] ➔ [목표] ➔ [일정] ➔ [기록] ➔ [소통]` 6개 탭 체제로 확장.
  - 가이드 오픈 시 기본 선택 탭을 `avatar`로 설정.
  - 아바타 3대 혁신 기능(베일에 싸인 시크릿 랭크 및 히든 오라, 앱 진입 대형 인사 팝업 커스텀, 무제한 보관함) 및 어디까지 진화하는지 호기심을 자극하는 비주얼 쇼케이스 카드 완비.
  - 하단 액션 버튼으로 `openAvatarModal()` 즉각 연동.
- **영향받는 파일 전수 목록**:
  1. `index.html`: `TAB_GUIDE_DATA`에 `avatar` 객체 추가, `openTabGuideHubModal` 내 탭 배열 순서 및 기본값 변경, `wireTryButton` 내 `avatar` 분기 배선, 설정 탭 버튼 연동.
  2. `ui.css`: 6개 탭 네비게이션 가로 스와이프 지원 및 아바타 쇼케이스 카드 시각 스타일.
  3. `sw.js`: `CACHE_NAME` 버전 갱신 (`ourgoal-cache-20260917-es166`).
  4. `docs/rules/TICKETS.md`: `#TASK-ES-166` 티켓 등록.
  5. `scripts/smoke-test.js`: 아바타 탭 최우선 배치 및 렌더링 검증 테스트 케이스 추가.
  6. `dev_log.md`: 엔지니어링 실행 로그 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 활용법 허브의 첫인상을 장식하는 아바타는 유저가 실천한 노력의 결실이자 성장의 상징이다.
- **[원인] (Root Causes)**:
  - 1) 기존 가이드 탭이 5대 탭에만 묶여 아바타가 홈 탭의 종속 항목으로 묻혀 있었음.
  - 2) 최근 출시된 5대 랭크 오라(#TASK-ES-159) 및 대형 인사 팝업 커스텀(#TASK-ES-165)이 가이드에 미반영됨.
  - 3) 아바타의 강력한 시각적 동기부여가 활용법 최우선 순위로 드러나지 못함.
- **[중심] (Core Bottleneck & Wire)**:
  - `openTabGuideHubModal` 내 탭 배열의 맨 첫 번째에 `avatar` 탭을 배치하고 기본 활성화 탭을 `avatar`로 지정하여 진입 즉시 표출하는 중심 배선 구축.
- **[핵심] (Critical Anchor)**:
  - `openAvatarModal()`과의 부드러운 전환 연동 및 기존 5대 탭과의 비간섭 무결성 보존.
- **전역 상태(`state`) 영향 분석**:
  - 가이드 뷰는 읽기 및 네비게이션 중심이므로 전역 `state`의 유저 데이터(목표, 기록, 아바타 세팅값)를 변형하지 않음.
  - 모달 상호작용 후 `openAvatarModal()` 호출 시 기존 아바타 전역 상태 및 DOM이 안전하게 보존·표출됨.
- **종단간 데이터 흐름 다이어그램**:
```
[설정 탭 클릭: #btnTabGuideHub] 
  └──> openTabGuideHubModal('avatar')
         ├──> tabs 배열 [avatar, home, goals, calendar, records, social] 렌더링
         ├──> curTab = 'avatar' active 활성화
         ├──> renderTabGuideContent('avatar')
         │      ├──> 3대 혁신 기능 안내 (시크릿 랭크 오라, 인사 팝업 멘트, 보관함)
         │      └──> “어디까지 진화하는 거야?!” 히든 랭크 비주얼 쇼케이스 카드 표출
         └──> [🎨 나만의 아바타 꾸미러 가기] 클릭
                └──> closeModal() ➔ setTimeout ➔ openAvatarModal() 호출
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `index.html`: +50줄 / -10줄 (아바타 가이드 데이터 및 탭 순서 교체, 이벤트 배선)
  - `ui.css`: +20줄 / -0줄 (탭바 스크롤 최적화 및 뱃지 스타일)
  - `sw.js`: +1줄 / -1줄 (캐시 네임 갱신)
  - `docs/rules/TICKETS.md`: +2줄 / -0줄 (티켓 등록)
  - `scripts/smoke-test.js`: +25줄 / -0줄 (테스트 케이스 추가)
- **4위 1체 배선 명세**:
  - 마크업: `.tab-guide-nav-bar` 내 `data-tabkey="avatar"` 탭 버튼 및 하단 `.guide-action-try-btn`.
  - 리스너: 탭 클릭 시 `curTab = 'avatar'` 렌더링, 액션 버튼 클릭 시 `openAvatarModal()` 호출.
  - 비즈니스 로직: `TAB_GUIDE_DATA.avatar` 데이터 바인딩 및 부드러운 모달 전환.
  - 피드백: 활성화 탭 하이라이트(active 클래스), 모달 페이드인 애니메이션.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- **기존 5대 탭 불파괴 보증**:
  - `home`, `goals`, `calendar`, `records`, `social`의 기존 데이터와 로직은 100% 온전히 유지되며, 네비게이션 키값 충돌 없음.
  - 홈 탭의 가이드에서 아바타가 별도 탭으로 독립되었으므로 홈 탭은 '오늘의 미션 & 연속 스트릭', '90초 갓생 온보딩', '나만의 일일 루틴 관리'로 정밀 정돈하여 중복 제거.
- **유저 자산 100% 무손실 보존**:
  - 가이드 기능 추가는 유저 스토리지나 Supabase 원장에 파괴적 영향을 일절 주지 않음.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `TICKETS.md`: `#TASK-ES-166` 티켓 등록.
2. `index.html`: `TAB_GUIDE_DATA`에 `avatar` 객체 추가.
3. `index.html`: `openTabGuideHubModal` 내 `tabs` 배열 최선두에 아바타 추가 및 기본 `curTab`을 `'avatar'`로 설정.
4. `index.html`: `wireTryButton` 내 `targetTab === 'avatar'` 분기 배선 (`openAvatarModal()` 호출).
5. `ui.css`: 탭바 가로 스와이프 및 쇼케이스 스타일 보강.
6. `sw.js`: `CACHE_NAME`을 `ourgoal-cache-20260917-es166`으로 갱신.
7. `scripts/smoke-test.js`: 아바타 탭 최우선 렌더링 및 클릭 상호작용 자동화 테스트 추가.
8. `npm test` 및 `node scripts/verify-integrity-gate.js` 전수 실행.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **검증 A (Zero Dead-Click)**:
  - 가이드 허브 오픈 ➔ [👤 아바타] 탭 클릭 ➔ [🚀 나만의 아바타 꾸미러 가기] 클릭 ➔ 에러 없이 아바타 설정창 열림 검증.
- **검증 B (Zero Data Loss)**:
  - 가이드 조작 전후 가상 페르소나 10종 데이터 무손실 딥 이퀄 통과.
- **검증 C (Zero UX Regression)**:
  - 기존 홈/목표/일정/기록/소통 탭의 가이드 열람 및 탭 이동 정상 작동 확인.
- **검증 D (Full State Propagation)**:
  - 아바타 모달에서 복귀 후 앱 상태 정상 유지 확인.
- **검증 E (자동화 게이트 통과)**:
  - 스모크 테스트 300개 이상 통과 및 게이트키퍼 17개 헌법 게이트 100% PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] **[1단계: 기획·설계 상태]**: REQ 및 PLAN 수립 완료.
- [x] **[2단계: 내부 시뮬레이션 상태]**: 코드 구현 및 단위/스모크/게이트키퍼 테스트 통과 (306 PASS).
- [x] **[3단계: 로컬 수동 확인 상태]**: 로컬 환경에서 가이드 허브 아바타 탭 렌더링 및 클릭 동작 실측 확인 (스크린샷 확보).
- [x] **[4단계: 로컬 메인 병합 상태]**: feature 브랜치를 로컬 main에 병합 (정상 마감점).
- [x] **[5A단계: Vercel 프리뷰 배포]**: Vercel 임시 프리뷰 배포 자동 실행 및 상민님께 URL 제공 (https://ourgoal-6tv884oyg-yangsangmin.vercel.app).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 오류**: 화면 너비가 좁은 환경에서 6개 탭이 한 줄을 넘어 깨지는 현상.
  - **대응**: CSS flex와 nowrap, 부드러운 터치 스크롤(`-webkit-overflow-scrolling: touch`)을 적용하여 깔끔하게 스와이프되도록 조치.
- **롤백 계획**: 문제 발생 시 `git reset --hard HEAD~1`을 통해 안전하게 즉각 복구.
