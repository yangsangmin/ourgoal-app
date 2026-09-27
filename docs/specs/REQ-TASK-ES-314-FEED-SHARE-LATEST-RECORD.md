# REQ-TASK-ES-314: 피드 게시 시 실천기록 최신순 자동적용 및 기록 맞춤형 AI피드백/다짐 연동

## 1. 개요
- **티켓 ID**: `#TASK-ES-314`
- **본질축**: `E3/UX`
- **상민님 원문 지시**:
  > *"피드 - 게시하기에서 연동할 실천기록은 가장 최신의 것을 먼저 자동적용하도록 해. 유저가 바꿀때 최신사항들이 위에 보이도록하고. 그리고 ai 피드백과 나누고싶은 한마디/다짐은 설정한 기록에 따라서 맞춤되도록 설정하고."*

## 2. 세부 요구사항
1. **실천기록 최신순 정렬 및 상단 노출 (`index.html`)**:
   - 피드 게시 모달(`openShareToFeedModal`) 내 실천 기록 목록(`userRecords`)을 일자 및 시간(date/startAt/createdAt) 기준 내림차순(최신순)으로 엄격히 정렬.
   - 유저가 연동할 실천 기록을 변경할 때(셀렉트 박스 드롭다운 및 칩 목록) 최신 사항들이 항상 상단 및 앞쪽에 먼저 배치되도록 보장.

2. **최신 실천 기록 자동 적용 (Default Auto-Select)**:
   - 피드 게시 모달 진입 시, 사용자의 가장 최신 실천 기록(`userRecords[0]`)을 기본값으로 자동 프리셀렉트 연동.
   - 기록 본문 포함 설정 및 인증 사진 첨부 옵션도 해당 최신 기록에 맞추어 자동 활성화.

3. **기록 맞춤형 AI 피드백 및 다짐 실시간 동적 연동**:
   - **기록 맞춤형 AI 피드백**: 선택된 기록에 수신된 피드백(`curRecord.feedback`)이 있으면 해당 피드백을 우선 자동 선택 및 프리뷰 표출. 없을 경우 최신 피드백 풀에서 최적 매칭.
   - **기록 맞춤형 한마디/다짐**: 선택된 기록의 내용(제목, 텍스트, 시간, 태그)에 따라 맞춤형 다짐 문구를 동적으로 생성하여 힌트/플레이스홀더 및 입력창에 즉시 연동.
   - 기록 변경 시(`shareRecordSelect` 변경 및 칩 클릭 이벤트) 다짐 멘트와 AI 피드백이 실시간으로 동기화되어 즉각 반응.

4. **단일 진실 공급원 및 4위 1체 배선 (`js/components.js`)**:
   - `handle소통_Item63Action` 구현.
   - `generateRecordPledgeMessage(record)` 유틸리티 함수 구현.
   - 12ms 햅틱 반응 (`triggerHaptic(12)`).
   - `og_task-63_cache` 로컬스토리지 영속화 (`latest_record_auto_select: true`, `record_customized_feedback_and_pledge: true`).
   - Supabase upsert 비동기 동기화 (`task-63`).
   - 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.

5. **품질 검증 및 3자 동기화**:
   - 단위 테스트 `tests/feed-share-latest-record.test.js` 전수 통과.
   - 스모크 테스트 `scripts/smoke-test.js` 432개 전수 무결점 통과 (0개 실패).
   - 법정 사전 검증 `reports/TASK-ES-314/claims.json` 통과.
   - Tri-Sync(노션, 옵시디언, 관제센터) 100% 무결성 동기화.
