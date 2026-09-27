# PLAN-TASK-ES-314: 피드 게시 시 실천기록 최신순 자동적용 및 기록 맞춤형 AI피드백/다짐 연동 실행 계획서

## 1. 목적 및 배경
- 사용자가 피드에 실천 내용을 공유할 때 가장 최근에 수행한 실천 기록을 일일이 찾지 않아도 최신순으로 자동 적용되도록 하고, 기록 변경 시에도 최신 기록들이 상단에 노출되도록 하여 탐색 피로도를 근절.
- 선택된 실천 기록의 구체적인 내용에 부합하는 맞춤형 AI 코칭 조언과 다짐 문구가 실시간으로 연동되어 생생하고 진정성 있는 피드 공유 경험을 제공.

## 2. 작업 순서
1. **`index.html` 피드 공유 모달 로직 고도화**:
   - `openShareToFeedModal` 내 `userRecords` 배열을 날짜/시간(date, startAt, createdAt) 기준 엄격한 내림차순(최신순) 정렬 적용.
   - 모달 초기 렌더링 시 최신 실천 기록(`userRecords[0]`)을 기본값으로 자동 프리셀렉트.
   - `generateRecordPledgeMessage(record)`를 활용하여 기록 맞춤형 다짐 문구를 생성하고, `shareCaptionInput`의 플레이스홀더 및 힌트에 동적 반영.
   - 실천 기록 변경 리스너(`shareRecordSelect` change 이벤트 및 `[data-targetrec]` 칩 클릭 이벤트)에서 선택된 기록에 맞추어:
     1) 기록 연동 AI 피드백 자동 탐색, 선택, 프리뷰 박스 실시간 갱신.
     2) 기록 맞춤형 다짐 멘트 동적 재생성 및 플레이스홀더 실시간 갱신.

2. **`js/components.js` 직통 액션 핸들러 구현**:
   - `handle소통_Item63Action` 및 `generateRecordPledgeMessage` 구현.
   - 12ms 햅틱 반응, `og_task-63_cache` 영속화, 4대 뷰 원자적 동시 전파.
   - `OurgoalComponents`, `window`, `module.exports` 노출.

3. **`docs/rules/TICKETS.md` 티켓 등록**:
   - `#TASK-ES-314` 진행중 등록.

4. **단위 및 스모크 테스트 작성/검증**:
   - `tests/feed-share-latest-record.test.js` 작성 및 통과.
   - `scripts/smoke-test.js`에 `#TASK-ES-314` 단언문 추가 및 432개 전수 무결점 통과 (0개 실패).

5. **법정 claims.json 작성 및 사전 검증**:
   - `reports/TASK-ES-314/claims.json` 작성 및 `court/claims.js` 통과.

6. **Git 커밋, 푸시, PR 생성 및 머지**:
   - GitHub Actions Court All Pass 확인 및 squash 머지.

7. **`TICKETS.md` 완료 반영 PR 및 머지**.

8. **Tri-Sync 3자 상호 동기화 무결성 100% 달성 및 보고**.
