# [REQ] #TASK-ES-308: 소통탭 게시 시 공유 대상(목표·기록·AI피드백) 선택형 UI 구현 및 다짐 작성 유지

## 1. 개요 및 배경
- **티켓 ID**: `#TASK-ES-308`
- **본질축**: `E3/UX`
- **노션 생각 메모장 번호**: `[57]`
- **상민님 원문**:
  > *"소통탭 게시하기 누르면 공유할 목표는 내 목표들중에 선택에서 고를 수 있게 해야지. 작성하는게 아니라. 목표, 기록, ai 피드백 받았던걸 선택해서 올릴 수 있어야 해. 나누고 싶은 한마디/다짐은 이대로 놔두고."*

---

## 2. 상세 요구사항 (Requirements)

### R1. 공유할 목표 선택형 UI 구축 (수기 작성 배제)
- 소통탭 피드 게시하기 모달(`openShareToFeedModal`) 내에서 사용자가 목표를 직접 타이핑하거나 텍스트로 적는 대신, 사용자가 등록해 둔 실제 목표 목록(`state.profile.goals`)에서 직관적으로 골라 담을 수 있는 **원클릭 선택형 칩 바(`.feed-target-goal-chips`) 및 옵션 인터페이스**를 제공한다.
- '미설정 (목표 공개 안 함)' 및 개별 목표별 제목·진행률이 칩에 일목요연하게 표시되어 터치 한 번으로 선택된다.

### R2. 실천 기록 및 AI 코칭 피드백 선택형 셀렉터 배치
- 내 실제 실천 기록(`state.profile.records`) 목록을 가로 스크롤 카드/칩 리스트(`.feed-target-record-chips`)로 시각화하여, 원하는 기록을 쉽게 선택하고 연결할 수 있어야 한다.
- 받았던 AI 코칭 조언 풀(`availableFeedbacks`) 역시 원클릭 선택형 칩 바(`.feed-target-feedback-chips`)로 표출되어, 선택 시 하단에 코칭 조언 프리뷰가 나타나야 한다.

### R3. 나누고 싶은 한마디 / 다짐 입력창 온전한 유지
- '나누고 싶은 한마디 / 다짐'(`textarea#shareCaptionInput`) 입력창은 현재 규격대로 온전히 유지하여, 사용자가 동료들과 나누고 싶은 회고나 각오를 자유롭게 직접 작성할 수 있도록 보장한다.

### R4. 직통 액션 핸들러 및 4대 뷰 원자적 동시 전파
- `js/components.js`에 `handle소통_Item57Action`을 탑재하여 12ms 햅틱 진동 피드백 및 영구 원장 트랜잭션, 헌법 제15조 제6항 4대 뷰(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 원자적 동시 전파를 완결한다.

### R5. 모바일 375px 반응형 및 무결성 검증
- `ui.css`에 칩 바, 선택 칩, 호버/활성 스타일 및 375px 모바일 반응형(오버플로우 0px, 최소 터치 타깃 40px)을 완비한다.
- 전용 단위 테스트 `tests/feed-post-selectable-targets.test.js` All Pass 및 `scripts/smoke-test.js` 전수 통과(0개 실패)를 달성한다.
