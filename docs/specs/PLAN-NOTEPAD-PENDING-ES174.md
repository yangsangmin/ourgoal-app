# 엔지니어링 작업계획서 (PLAN) — 아워골 생각 메모장 잔여 대기 과제 9건([45]~[53]) 전수 구현 및 3자 동기화

> **문서 ID**: PLAN-NOTEPAD-PENDING-ES174  
> **요구사항 연계**: [REQ-NOTEPAD-PENDING-ES174](file:///C:/dev/ourgoal-app/docs/specs/REQ-NOTEPAD-PENDING-ES174.md)  
> **티켓 연계**: #TASK-ES-174  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity Assistant (양비스 관제센터 AI 페어프로그래머)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 메모장 DB 잔여 9건([45]~[53]) 결함 수정 및 기능 신설을 통해 아워골의 사용성·시인성·상호작용성 완성.
- **영향 받는 파일 목록 전수**:
  - `index.html`:
    - [48]: 홈 EXP 바, 상단바 우측 프로필, 설정창 아바타 아이콘 크기 확대
    - [49]: 팀 댓글 로컬 영속화 및 인풋 초기화, 오픈 상태 유지
    - [50]: 설정창 4대 아코디언 기본 접힘(`open` 속성 제거)
    - [51]: 피드 공유 모달 내 '미리보기' 버튼 신설 및 프리뷰 카드 렌더링
    - [53]: 목표탭 '나만 보기' 우측 '템플릿백과사전' 버튼 신설 및 2개 탭 전체화면 모달 배선
  - `js/universal-stats.js`:
    - [45]: 성취통계 헤더 접기토글(`#uAccordionToggleIcon`) 이벤트 버블링 차단 제거 및 클릭 리스너 연결
  - `js/team-linked-goals.js`:
    - [46]: 참여 중인 목표 없을 때 실사용 우수사례 시각 예시 카드 렌더링 및 생성 시 자동 숨김
  - `js/time-tracker.js`:
    - [47]: 구간 기록 모달 안내문구 변경('시간별로 세부 내용을 작성할 수 있어요') 및 모달 컴팩트 축소
  - `js/team-visibility-levels.js`:
    - [52]: 팀 목표 마일스톤 및 수준별 조 섹션 최초 진입 시 기본 접힘 처리

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 5개 파일에 걸친 국소적 결함을 외과수술적으로 완치하고, 상호작용 생태계(템플릿 복사/추천, 댓글 안전성)를 견고하게 다지는 4위 1체 배선.
- **[원인] (Technical Causes)**:
  - 부모 div의 이벤트 버블링 차단, 기본 open 속성 하드코딩, 로컬 세션 백업 누락이 원인.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile`: 아바타 크기, 목표 복제, 댓글 로컬 캐시, 템플릿 추천 상태 보존.
  - `renderGoalsScreen()`, `renderTeamGoalsScreen()`, `renderSettingsScreen()` 렌더러 동기화.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - Supabase 테이블 호출 실패 시에도 로컬 프로필 스토리지를 통해 영구 보존되는 무중단 안전 대피소 구축.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[UI 상호작용] -> [DOM 이벤트] -> [로컬 프로필 State 갱신] -> [Supabase 비동기 통신 (실패 무해 가드)] -> [화면 갱신 및 햅틱/토스트 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/universal-stats.js` | [45] 아코디언 토글 버블링 해소 | +6줄 | -2줄 | +4줄 | 외과수술적 diff |
| `js/team-linked-goals.js` | [46] 우수 사용사례 예시 카드 | +45줄 | -2줄 | +43줄 | 컴포넌트 추가 |
| `js/time-tracker.js` | [47] 시간기록 모달 축소 및 문구 | +10줄 | -8줄 | +2줄 | 스타일/텍스트 튜닝 |
| `js/team-visibility-levels.js` | [52] 기본 접힘 상태 적용 | +10줄 | -4줄 | +6줄 | 기본값 변경 |
| `index.html` | [48] 아바타 확대, [49] 댓글 보강, [50] 설정 접힘, [51] 피드 미리보기, [53] 템플릿백과사전 | +220줄 | -30줄 | +190줄 | 4위 1체 배선 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - [45] `#uAccordionToggleIcon`
   - [46] `#tlSampleShowcaseCard`
   - [47] `#ttLapMemoModal`
   - [48] `#topAvatar`, `.level-badge-avatar-wrap`, `.profile-avatar`
   - [49] `[data-cmtsend]`, `[data-cmtinput]`
   - [50] `.settings-group-accordion`
   - [51] `#sharePreviewBtn`, `#sharePreviewSlot`
   - [53] `#btnGoalTemplateEncyclopedia`, `#templateEncyclopediaModal`
2. **이벤트 리스너 (Listener)**:
   - 각 버튼의 클릭 이벤트 및 모달 닫기(X), 탭 전환 완비.
3. **비즈니스 로직 (Logic)**:
   - 템플릿 복제 시 `uid('g')`, `uid('m')`, `uid('t')` 신규 발급하여 `state.profile.goals`에 적재 및 `saveProfile()`.
   - 피드 미리보기 시 현재 작성 중인 텍스트와 카테고리, 마일스톤을 실시간 피드 카드로 렌더링.
4. **피드백 & 예외처리 (Feedback)**:
   - 햅틱, 성공 토스트, 닫기 버튼.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`js/universal-stats.js`)**: [45] 헤더 아코디언 토글 클릭 이벤트 정상화.
2. **Step 2 (`js/team-linked-goals.js`)**: [46] 팀 연계 개인목표 빈 화면 실사용 우수사례 시각 카드 탑재.
3. **Step 3 (`js/time-tracker.js`)**: [47] 구간 기록 모달 크기 축소 및 설명 문구 한 줄 최적화.
4. **Step 4 (`js/team-visibility-levels.js`)**: [52] 팀 목표 마일스톤 및 수준별 조 기본 접힘 상태 적용.
5. **Step 5 (`index.html`)**:
   - [48] 아바타 크기 확대 (홈 EXP 바 56px, 상단바 46px, 설정창 72px)
   - [49] 팀 목표 댓글 로컬 영속화, 인풋 클리어, 창 유지
   - [50] 설정창 4개 아코디언 기본 접힘
   - [51] 피드 게시 모달 내 '미리보기' 버튼 및 실시간 프리뷰 렌더링
   - [53] 목표탭 '템플릿백과사전' 버튼, 전체화면 모달, 실사용 유저 템플릿 복사 및 추천 상호작용
6. **Step 6 (검증 및 게이트 통과)**: `npm test` 및 무결성 게이트 검증.
7. **Step 7 (Tri-Sync 3자 동기화)**: 노션 DB, 옵시디언, 관제센터 저널 상태 완료 갱신.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 템플릿백과사전 열기/닫기, 탭 전환, 템플릿 복사, 피드 미리보기, 댓글 등록 전수 클릭 시 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조.
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인.
- **시나리오 D (Full State Propagation)**: 템플릿 복사 시 목표 화면 및 홈 화면에 즉시 동시 반영 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] 3자 동기화 무결성 검증: `node C:/dev/command-center/lib/tri-sync.js check` PASS
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모달 z-index 충돌 또는 CSS 클래스 중첩 -> 전역 네임스페이스 및 z-index 100005 적용.
- **사전 방어 및 우회 로직**: 템플릿 복제 시 목표/마일스톤/할일의 모든 ID를 신규 생성하여 기존 데이터와의 격리 보장.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 작업 브랜치 `feat/2026-09-18-notepad-pending-tasks-es174` 격리 및 main 원복.
- **재검증 트리거**: 린터 검증 실패 시 원칙 ⑤ 및 REQ 문서 8원칙 정합성으로 복귀.
