# [엔지니어링 작업계획서] #TASK-ES-333: 'theme'(같은 테마 공개) 단계 신설 및 기본 공개범위 전환 & 1초 되돌리기 및 공개 정보 4종 한정

## 1. 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **REQ 핵심 요약**:
  - 목표 공개범위 옵션에 `'theme'`(같은 테마 공개) 신설 및 신규 목표 기본값 전환.
  - 목표 생성 직후 "같은 테마 러너에게만 공유돼요" 고지 및 `#btnUndoThemePrivacy`를 통한 1초 되돌리기(나만 보기로 변경) 제공.
  - 소통 피드에서 타인 글에 대한 공개 정보 범위를 `[목표 제목, 진행률, 체크인 한 줄, 연속 실천일수]` 4종으로 엄격 제한.
- **영향받는 파일 전수 목록**:
  1. `docs/rules/TICKETS.md`: 티켓 등록 (수정 완료)
  2. `docs/specs/REQ-TASK-ES-333-THEME-VISIBILITY-DEFAULT.md`: 요구사항 정의서 (작성 완료)
  3. `docs/specs/PLAN-TASK-ES-333-THEME-VISIBILITY-DEFAULT.md`: 엔지니어링 작업계획서 (본 문서)
  4. `reports/TASK-ES-333/claims.json`: 법정 심사용 주장 파일
  5. `reports/TASK-ES-333/pr-body.md`: 초안 PR 설명문
  6. `index.html`:
     - `VISIBILITY_LABELS` 객체 정의 (33006행 부근)
     - `showNewGoalManualForm` / `openAddGoalModal` 내 `#mGoalVis` 옵션 마크업 (19131행 부근)
     - 목표 생성 저장 핸들러 내 `showUndoPrivacyToast` 호출 배선 (19194행 부근)
     - `showUndoPrivacyToast` 함수 정의 및 배선
     - 목표 상세 `#goalsPrivacyBadge` 순환 핸들러 및 `visRow` 렌더러 (23042행, 23403행 부근)
     - `renderCommFeed` 내 타인 글 4종 정보 필터링 (34298행 부근)

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **E3 (동류 소통 루프)** — 같은 테마 실천 동류 러너 간 안전하고 따뜻한 기본 연결망 구축.
- **[원인] (Technical Causes)**:
  - `VISIBILITY_LABELS`에 `theme` 단계 부재로 인해 테마별 완충 공개 계층이 누락됨.
  - `#mGoalVis`의 기본값이 `private`로 설정되어 신규 유저가 커뮤니티 연결감을 체감하지 못함.
- **[중심] (Core Wire & State)**:
  - `state.profile.goals[i].visibility`: `'theme'` 지원.
  - `#mGoalVis` (기본값 `'theme'`) -> `newGoal.visibility = 'theme'`.
  - `goalsPrivacyBadge` 순환 배선 (`private` -> `theme` -> `team` -> `public`).
- **[핵심] (Critical Safety & Persistence)**:
  - 기존 유저의 `public`, `team`, `private` 설정값 100% 무손실 보존.
  - 목표 생성 직후 `#btnUndoThemePrivacy` 1초 되돌리기(Undo) 액션으로 프라이버시 통제권 보장.
  - 소통 피드에서 타인 글에 대한 4종 정보(제목, 진행률, 한줄, 연속일) 제한 필터링.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [목표 생성 모달] -> #mGoalVis (기본값: 'theme')
       │
       ▼ (만들기 클릭)
  [state.profile.goals.push(newGoal)] -> saveProfile()
       │
       ├─► dispatchFullViewPropagation('goal_create') -> renderAll()
       │
       └─► showUndoPrivacyToast(newGoal.id) -> #toast 슬롯에 노출
             │
             └─► [나만 보기로 변경 클릭 시]
                   │
                   ▼
                 targetGoal.visibility = 'private'
                 saveProfile() -> dispatchFullViewPropagation('goal_update')
  ```

## 3. 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `index.html`: 추가 약 45줄, 삭제 약 5줄 (총 diff 50줄 이내)
  - `docs/specs/*`: 신규 생성 2개 파일
  - `reports/TASK-ES-333/*`: 신규 생성 2개 파일
- **4위 1체 배선 명세**:
  - **HTML**: `#mGoalVis` 내 `<option value="theme" selected>🏷️ 같은 테마 공개 (기본)</option>`, `#toast` 내 `#btnUndoThemePrivacy`.
  - **리스너**: `#btnUndoThemePrivacy.onclick` 1초 되돌리기 핸들러, `#goalsPrivacyBadge.onclick` 4단계 순환 핸들러.
  - **비즈니스 로직**: `newGoal.visibility = 'theme'`, 되돌리기 시 `visibility = 'private'` 전환 및 `saveProfile()`.
  - **피드백**: "🏷️ 같은 테마 러너에게만 공유돼요" 안내 토스트 및 전환 시 "🔒 나만 보기로 변경되었어요" 토스트.

## 4. 1~3 재검토 및 기존 기능 불파괴 보증 (Safety & Compatibility)
- **기존 데이터 보존**: 기존 유저의 `public`, `team`, `private` 설정값은 절대 건드리지 않고 그대로 유지.
- **하위 호환성**: `VISIBILITY_LABELS[vis]`에서 알 수 없는 값이 오더라도 기본 폴백을 제공하여 렌더링 붕괴 방어.
- **Zero Dead-Click**: 새로 추가되는 `#btnUndoThemePrivacy` 버튼에 엄밀한 이벤트 리스너를 결속하여 데드 클릭 원천 방지.

## 5. 구현 상세 순서 (Step-by-Step Sequence)
1. **1단계**: `index.html` 내 `VISIBILITY_LABELS = { public:'전체 공개', theme:'같은 테마 공개', team:'팀원 공개', private:'나만 보기' };` 수정.
2. **2단계**: `showNewGoalManualForm` 내 `#mGoalVis` 마크업에 `theme` 기본 옵션 배치.
3. **3단계**: `showUndoPrivacyToast` 함수 작성 및 목표 생성 완료 시점 호출 배선.
4. **4단계**: `goalsPrivacyBadge` 순환 핸들러 및 상세 화면 `visRow` 렌더링에 `theme` 라벨/아이콘(`🏷️`) 배선.
5. **5단계**: `renderCommFeed` 내 타인 글 렌더링 시 세부 회고 마스킹 및 4종 팩트 지표(제목, 진행률, 한줄, 연속일) 중심 정돈.
6. **6단계**: `reports/TASK-ES-333/claims.json` 및 `pr-body.md` 작성.

## 6. 절차 재검증: 법정 주장(claims) 설계 (Claims Design & Anti-SPOF)
- **법정 심사용 정적 단언문 설계 (claims.json)**:
  - **C1**: `index.html` 내 `VISIBILITY_LABELS` 객체에 `theme:'같은 테마 공개'` 포함.
  - **C2**: `index.html` 내 `#mGoalVis` 셀렉트 옵션에 `<option value="theme" selected>` 포함.
  - **C3**: `index.html` 내에 `showUndoPrivacyToast` 함수 정의 및 `#btnUndoThemePrivacy` 핸들러 포함.
  - **C4**: `index.html` 내 `goalsPrivacyBadge` 순환 분기에 `cur === 'theme'` 포함.
  - **C5**: `index.html` 내 `renderCommFeed`에서 타인 글(`!isMe`)의 4종 정보 제한 로직 포함.
- **Anti-SPOF 재검증**:
  - `showUndoPrivacyToast` 내에서 `state.profile.goals`를 탐색할 때 타깃 목표가 없으면 예외 없이 리턴.

## 7. 단계별 실행 체크리스트 (Execution Checklist)
- [ ] 1. `docs/rules/TICKETS.md` 티켓 갱신 (완료)
- [ ] 2. `docs/specs/REQ-TASK-ES-333-THEME-VISIBILITY-DEFAULT.md` 작성 (완료)
- [ ] 3. `docs/specs/PLAN-TASK-ES-333-THEME-VISIBILITY-DEFAULT.md` 작성 (완료)
- [ ] 4. `reports/TASK-ES-333/claims.json` 작성
- [ ] 5. `reports/TASK-ES-333/pr-body.md` 작성
- [ ] 6. `index.html` 외과수술적 수정 (VISIBILITY_LABELS, mGoalVis, showUndoPrivacyToast, goalsPrivacyBadge, renderCommFeed)
- [ ] 7. `node scripts/verify-integrity-gate.js` 헌법 5대 검증 게이트 통과 (38개)
- [ ] 8. `npm test` 회귀 검사 통과 (440개 0실패)
- [ ] 9. Git 커밋 (`[E3] #TASK-ES-333 feat: ...`) 및 원격 푸시
- [ ] 10. Draft PR 생성 및 GitHub court 심사 청구 ([4단계: 심사 청구 상태])

## 8. 막히는 지점 예상 및 롤백 계획 (Rollback Plan)
- **잠재 오류**: 토스트 z-index가 모달 시트 뒤에 가려져 보이지 않는 문제.
  - **대응책**: `showUndoPrivacyToast`는 모달이 `closeModal()`로 닫힌 직후 호출되므로 화면 최상단 토스트 레이어에 즉시 명확히 노출됨.
- **롤백 계획**: 문제 발생 시 `git revert`로 직전 커밋으로 100% 무손실 롤백 가능.
