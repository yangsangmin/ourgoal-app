# [PLAN] #TASK-ES-308: 소통탭 게시 시 공유 대상(목표·기록·AI피드백) 선택형 UI 구현 및 다짐 작성 유지

## 1. 개요 및 설계 원칙
- **티켓 ID**: `#TASK-ES-308`
- **본질축**: `E3/UX`
- **목표**: 소통탭 피드 게시하기 모달(`openShareToFeedModal`)에서 공유할 목표·실천기록·AI피드백을 내 실제 데이터에서 원클릭 선택할 수 있는 직관적인 선택형 칩/카드 UI를 배치하고, '나누고 싶은 한마디/다짐' 입력창을 온전히 유지하여 최상의 공유 경험을 완성한다.

---

## 2. 세부 실행 계획

### Step 1: `index.html` 소통 피드 게시 모달(`openShareToFeedModal`) 개편
1. **공유 대상 선택형 UI 배치**:
   - **🎯 목표 선택 칩 바 (`.feed-target-goal-chips`, `#shareGoalChipsRow`)**:
     - '미설정 (목표 공개 안 함)' 칩 + 유저의 실제 목표별 칩 (`.feed-target-chip[data-targetgoal="id"]`).
     - 칩 클릭 시 해당 목표 선택, 12ms 햅틱 진동, `#shareGoalSelect`와 동기화, 마일스톤 체크리스트 동적 렌더링.
   - **⏱️ 실천 기록 선택 칩 바 (`.feed-target-record-chips`, `#shareRecordChipsRow`)**:
     - '기록 미연동' 칩 + 최근 실천 기록별 날짜/내용 요약 칩 (`.feed-target-chip[data-targetrec="idx"]`).
     - 칩 클릭 시 해당 기록 선택, 사진/본문 설정 박스 노출, `#shareRecordSelect`와 동기화.
   - **✨ AI 피드백 선택 칩 바 (`.feed-target-feedback-chips`, `#shareFeedbackChipsRow`)**:
     - '피드백 미포함' 칩 + 받은 조언별 칩 (`.feed-target-chip[data-targetfb="idx"]`).
     - 칩 클릭 시 AI 코칭 조언 프리뷰 박스 노출, `#shareFeedbackSelect`와 동기화.
2. **💬 다짐/한마디 입력창 유지**:
   - `#shareCaptionInput` textarea 및 placeholder 안내 문구를 온전히 보존.
3. **미리보기 및 게시 제출 결합**:
   - 선택된 목표, 기록, AI피드백 정보가 피드 카드 및 미리보기에 일원화되어 결합되도록 보장.

### Step 2: `js/components.js` 핸들러 배선
- `handle소통_Item57Action(event, customPayload)` 함수 구현:
  - 12ms 햅틱 진동 피드백.
  - 선택형 UI 데이터셋 동기화 및 원자적 트랜잭션.
  - 헌법 제15조 제6항 4대 뷰(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 원자적 동시 전파.
  - `OurgoalComponents.handle소통_Item57Action`, `window.handle소통_Item57Action`, `module.exports` 노출.

### Step 3: `ui.css` 스타일 및 반응형 구축
- `.feed-target-goal-chips`, `.feed-target-record-chips`, `.feed-target-feedback-chips` 가로 스크롤 컨테이너.
- `.feed-target-chip` 기본/호버/활성(`.active`) 스타일.
- 모바일 375px 반응형 미디어 쿼리(오버플로우 0px, 터치 규격 40px 이상 보장).

### Step 4: 테스트 및 검증
- `tests/feed-post-selectable-targets.test.js` 작성 및 통과 (단, `[PASS]` 등 금지 단어 출력 배제).
- `scripts/smoke-test.js` 검증 블록 추가 및 **426개 전수 통과 (0개 실패)** 확인.
- `reports/TASK-ES-308/claims.json` 작성 및 `node court/claims.js` 검증.
- `npm run court:quick -- --head HEAD` 로컬 court 예비 점검.

### Step 5: 원격 푸시, PR 생성 및 Court 심사
- 커밋: `[E3] #TASK-ES-308 feat: [57] 소통탭 게시 시 공유 대상(목표·기록·AI피드백) 선택형 UI 구현 및 다짐 작성 유지 완결`
- 원격 푸시 및 PR 생성.
- GitHub Actions Court 심사(`node court/chat.js <PR번호>`) 합격 판정 후 squash 머지.

### Step 6: TICKETS.md 완료 갱신, 원장 3자 동기화 및 종결
- `docs/rules/TICKETS.md` 완료 갱신 PR 머지.
- 노션 생각 메모장 DB [57]번 상태 `완료` 갱신 (`PAGE_ID: 3de598db-9096-819c-8fc8-e558d30d3097`).
- 관제센터 저널(`journal.jsonl`) 기록 및 `tri-sync.js check` 100% 무결성 검증.
- 최종 보고.
