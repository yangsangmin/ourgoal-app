# [PLAN-INSTANT-QUEST-AI-FEEDBACK-AND-RECORD-DATA-CLEANSE] 최근 실천기록 데이터 정규화 & AI 모드 맞춤 피드백 & 3대 퀘스트 즉각 반응 엔지니어링 계획서 (#TASK-ES-100)

## 1. 문제 해결 8원칙 2회차 적용 (계획 단계)

### ① 원인재분류
- **데이터 계층**: `launch.html` 목업의 snake_case와 `index.html` camelCase 간의 필드 불일치 + 날짜 파싱 방어선 부재.
- **AI 인텔리전스 계층**: `localFeedback`의 모드(기본/중간/정밀)별 분기 결여로 인한 동일 1줄 정적 응답.
- **인터랙션/피드백 계층**: `renderFeedbackSlot`의 시각적 강조 및 스크롤 인 부재 + `captureSave` 직후 `renderDailyQuestBar` 미호출.

### ② 시스템 영향도
- **영향 파일**: `index.html`, `launch.html`, `js/records-stats.js`, `ui.css`.
- **불변 제약**: `index.html` 22,196줄 불변 절대 엄수.
- **기능 호환성**: 245개 기존 테스트 100% Pass 및 5대 무결성 게이트 유지.

### ③ 단계별 격리
- **Step 1 [데이터 무결성]**: `fmtDateLabel`, `dateKey`, `buildRecordCardHtml`, `records-stats.js`, `launch.html` 데이터 정규화 (Zero NaN, Zero Blank).
- **Step 2 [AI 모드별 인텔리전스 고도화]**: `localFeedback` 내 기본(3문장), 중간(페이스/마찰점), 정밀(가상레일/캘린더) 3대 맞춤 엔진 구현 및 피드백 슬롯 시각 강조.
- **Step 3 [데일리 퀘스트 실시간 연동 & 시각효과]**: `captureSave` 직후 `renderDailyQuestBar(true)` 배선, 글로우 펄스 & 컨페티 & 게이지 애니메이션.
- **Step 4 [무결성 검증 및 줄수 보존]**: `npm test` 245개 통과, `index.html` 22,196줄 검증.
- **Step 5 [로컬 수동 실물 확인]**: Chrome CDP를 통한 실물 브라우저 스크린샷 캡처 및 검증.
- **Step 6 [로컬 main 병합]**: 4단계 마감 상한선 준수 후 상민님께 보고.

### ④ 검증 시나리오
1. **기록 화면**: `launch.html` 로드 후 기록 탭 진입 시 날짜가 `9월 15일 (오늘)`, `9월 14일 (어제)` 등으로 깨끗하게 표출되고 `NaN년 NaN월 NaN일`이 전무할 것. 본문 내용("하이록스 8대 스테이션...", "모닝 5km 러닝...")이 선명하게 표출될 것.
2. **홈 화면 오늘 기록하기 & AI 모드**:
   - '중간' 선택 후 기록 저장 시 `[중간]` 뱃지와 함께 페이스/마찰점 분석 피드백 카드가 부드럽게 스크롤 인되며 즉각 나타날 것.
   - '정밀' 선택 후 기록 저장 시 `[정밀]` 뱃지와 함께 D-Day 가상 레일 사각지대 분석 및 캘린더 즉시 등록 버튼이 나타날 것.
3. **오늘의 3대 퀘스트 실시간 체크**:
   - 홈에서 기록 저장 버튼을 누르는 순간 탭 이동 없이 즉시 1번 퀘스트가 `✅ 오늘 한 줄 체크인 남기기`로 바뀌고, 파워 게이지 바가 즉시 상승하며 축하 효과가 작동할 것.

### ⑤ 롤백 플랜
- 각 수정 단계는 git 브랜치 `feat/fix-recent-records-ai-feedback-and-instant-quest` 내에서 수행하며, 문제 발생 시 즉시 `git reset --hard HEAD`로 이전 상태 복원.
