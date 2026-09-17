# 요구사항 정의서 (REQ) — 아바타 바꾸기 버튼 조건부 숨김 및 전 탭 볼드 모듈러 UI 전면 개편

> **문서 ID**: REQ-TASK-ES-170-avatar-change-banner-and-all-tabs-ui  
> **티켓 연계**: #TASK-ES-170  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UI 혁신 (아바타 UX 최적화 및 전 탭 시인성 대폭 강화)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 1회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 원문 지시사항**:
  - "내 아바타 바꾸기 창은 사진 적용 한번이라도 한 사람은 다시 안보이게 설정해. 그냥 내 아바타 누르면( 경험치창 아바타 또는 화면 제일 우측 상단의 프로필 누르거나) 바꿀 수 있게 바꿔. 처음 로그인하면 아바타 바꿀 수 있는지 모르니까 살려놓고, 한번 바꿔본 사람한테는 다시 절대 뜨지 말게 하라는 이야기야."
  - "지금 적용한 홈탭처럼 모든 탭의 ui 개선하고 프리뷰 실기기 체험 url 다시 줘."
- **표면적 현상**:
  - 1) 이미 아바타를 커스텀하여 설정한 사용자에게도 상단 경험치 배지 영역에 '내 아바타 바꾸기' 버튼이 계속 노출되어 화면 공간을 낭비하고 시각적 소음이 됨.
  - 2) 직관적으로 아바타나 상단 프로필 칩을 눌렀을 때 아바타 변경 모달이 열리는 직통 동선이 부재함.
  - 3) 홈탭에만 적용된 2px 볼드 모듈러 보더와 쾌적한 퀘스트 감각이 목표, 캘린더, 기록, 소통, 설정 등 타 탭에는 아직 적용되지 않아 앱 전반의 시각적 일관성과 칸 구획 시인성이 불균형함.
- **기저 층위별 심층 분석**:
  - **1층 (온보딩 vs 숙련자 멘탈 모델 층위)**: 신규 유저는 아바타 제작 기능을 안내받아야 하지만, 1회 이상 제작/적용한 숙련 유저는 버튼 대신 '아바타 아이콘 터치'라는 자연스러운 멘탈 모델로 전환되어야 함.
  - **2층 (동선 단절 층위)**: 상단 프로필(`topUserChip`)과 경험치 아바타에 클릭 핸들러가 연결되지 않아 사용자가 직관적으로 누르는 인터랙션이 무시됨.
  - **3층 (앱 전반 시인성 층위)**: 다른 탭들도 1px의 연한 8% 테두리로 인해 흰 배경 위에서 카드 간 구획이 흐릿하여 초보자가 정보를 구분하기 어려움.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 아바타는 사용자의 자아(Persona)이며, 아바타 관리 동선은 신규 유저에게는 친절한 안내, 기존 유저에게는 미니멀한 직통 터치 경험을 제공해야 한다. 또한 아워골의 모든 화면은 초보자도 칸 구분을 0.1초 만에 인지할 수 있는 일관된 볼드 모듈러 디자인을 갖추어야 한다.
- **[원인] (Root Causes)**:
  - **원인 1**: 아바타 변경 이력 플래그(`avatarChangedOnce`) 부재로 신규/기존 유저 간 UI 분기 처리가 되지 않았음.
  - **원인 2**: `topUserChip`과 `levelBadge` 내 아바타 엘리먼트에 `openAvatarModal` 이벤트가 배선되지 않았음.
  - **원인 3**: 전역 `--card-border`가 연한 1px로 유지되어 홈탭 외 타 탭 카드들의 테두리 시인성이 낮았음.
- **[중심] (Core Bottleneck)**:
  - **"사진 1회 이상 적용자 감지 분기"**와 **"아바타/프로필 원터치 직통 배선"**, 그리고 **"전 탭 2px 볼드 모듈러 보더 전역 확장"**.
- **[핵심] (Critical Anchor)**:
  - 신규 가입자에게는 '내 아바타 바꾸기' 버튼을 확실히 노출하되, 1회라도 변경한 사람에게는 영구 비노출.
  - 경험치창 아바타 및 상단바 프로필 칩 클릭 시 즉각 아바타 모달 직통 호출.
  - 목표, 캘린더, 기록, 소통, 설정 5개 탭의 모든 카드 및 컨테이너에 2px 볼드 테두리 일괄 적용.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말 것 (Don'ts)**:
  - 기존 `btnOpenAvatarModal` 버튼 ID를 DOM에서 물리적으로 삭제하여 단위 테스트(`assert.ok(html.includes('id="btnOpenAvatarModal"'))`)를 깨뜨리는 행위 금지 (`display:none`으로 조건부 숨김).
  - 기존 7대 테마 컬러 시스템과의 호환성을 깨뜨리는 하드코딩 색상 남발 금지.
- **할 것 (Dos)**:
  - **대책 1: 아바타 변경 이력 판별 함수 `hasUserCustomizedAvatar(profile)` 구현**
    - `settings.avatarChangedOnce`, `settings.savedAvatars.length > 0`, `settings.customAvatarUrl`, `profile.avatarUrl` 종합 검증.
    - 1회 이상 적용자: `btnOpenAvatarModal.style.display = 'none'`, 아바타 아이콘에 `cursor:pointer; title="내 아바타 바꾸기"` 부여.
    - 미적용자(신규 유저): 버튼 정상 노출.
  - **대책 2: 직통 클릭 이벤트 4위 1체 배선**
    - 1) 경험치 배지 내 아바타 아이콘 클릭 시 `openAvatarModal()` 호출.
    - 2) 상단 우측 `topUserChip` 클릭 시 `openAvatarModal()` 호출.
    - 3) 아바타 저장 완료 시 `state.profile.settings.avatarChangedOnce = true` 영구 기록 및 즉시 DOM 반영.
  - **대책 3: 전 탭 2px 볼드 모듈러 보더 전역 승격**
    - `ui.css`의 전역 `--card-border`를 `2px solid var(--home-card-border)`로 승격.
    - 목표, 캘린더, 기록, 소통, 설정 탭의 카드(`.goal-card`, `.rec-card`, `.comm-clean-card`, `.set-box` 등) 전체에 20px 라운딩 및 16px 마진 균일 적용.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **허점 및 약점 검토**:
  - `topUserChip` 클릭 시 기존 프로필 편집 모달(`openProfileEditor`)과의 역할 중복 가능성 검토: 상민님께서 명시적으로 "화면 제일 우측 상단의 프로필 누르거나 바꿀 수 있게 바꿔"라고 지시하셨으므로, `topUserChip` 클릭 시 아바타 모달을 열고 모달 내부에서 닉네임 및 테마 변경까지 원스톱으로 지원.
  - 게스트 모드에서 아바타 변경 시: 로컬 스토리지에 무손실 저장되어 새로고침 후에도 영구 유지.
- **테스트 호환성**:
  - `smoke-test.js` 내의 기존 ID 어설션 100% 보존.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

- [Step 1]: `index.html` 내 `hasUserCustomizedAvatar()` 판별 로직 추가 및 `levelBadgeHtml` 조건부 렌더링.
- [Step 2]: `renderLevelBadge()`에서 아바타 엘리먼트 클릭 핸들러 바인딩.
- [Step 3]: `index.html` 내 `topUserChip` 클릭 리스너를 `openAvatarModal`로 배선.
- [Step 4]: `js/avatar-system.js` 내 아바타 적용 완료 시 `avatarChangedOnce = true` 영구 기록 배선.
- [Step 5]: `ui.css` 전역 카드의 `--card-border`를 2px 볼드 보더로 승격하여 전 탭 동시 확장.
- [Step 6]: `sw.js` 캐시 버전 갱신 (`ourgoal-shell-v20260917-es170`).
- [Step 7]: `verify-integrity-gate.js` 및 `npm test` 전수 검증.
- [Step 8]: 로컬 main 병합 및 Vercel 프리뷰(5A) 자동 실행 및 URL 확보.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **SPOF 점검**:
  - 아바타를 바꾼 후 새로고침 시에도 버튼이 다시 나타나지 않는가? -> `saveProfile()` 시 `settings.avatarChangedOnce = true`가 원격 DB 및 로컬 스토리지에 영구 영속화되므로 새로고침해도 절대 다시 뜨지 않음.
  - 전 탭 2px 보더 적용 시 레이아웃 깨짐이 없는가? -> 박스 사이징(`box-sizing: border-box`) 전역 보장으로 너비 왜곡 없음.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

- 1) 신규 계정: '내 아바타 바꾸기' 버튼 노출.
- 2) 사진 1회 적용 계정: '내 아바타 바꾸기' 버튼 영구 비노출.
- 3) 경험치창 아바타 및 우측 상단 프로필 클릭 시 아바타 모달 100% 정상 오픈.
- 4) 홈, 목표, 캘린더, 기록, 소통, 설정 전 탭의 카드 테두리가 2px 볼드로 선명하게 분리.
- 5) `npm test` 309개 테스트 전수 통과.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **잠재 블로커**:
  - 일부 레거시 캐시로 인해 구버전 스크립트가 실행될 가능성.
- **대응책**:
  - `sw.js`의 `CACHE_NAME`을 `ourgoal-shell-v20260917-es170`으로 즉시 갱신하고 클라이언트 캐시 무효화 게이트 가동.
