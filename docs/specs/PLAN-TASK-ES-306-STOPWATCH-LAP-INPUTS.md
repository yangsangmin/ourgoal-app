# [구현 계획서] #TASK-ES-306: [55] 스톱워치 구간기록별 텍스트 입력창 UI 정돈 및 시인성 개선

## 1. 구현 개요
상민님의 원문 지시("스톱워치 구간기록의 각 입력창 더 깔끔하게 가다듬어")에 따라 스톱워치 위젯의 랩(구간기록) 리스트를 모던한 인터랙티브 카드 행으로 전면 고도화하고, 마진/패딩/보더 스타일 정돈과 텍스트 겹침을 완벽히 해소한다.

## 2. 변경 대상 파일 및 상세 내용
1. `index.html`:
   - `renderStopwatchWidgetHtml`:
     - `#swLapsList` 컨테이너 구조 개선 (`class="sw-laps-container"`).
   - 스톱워치 랩 핸들러 (`swLapBtn.onclick`):
     - 단순 텍스트 렌더링 대신 객체 배열(`swLaps: [{ id, num, time, memo }]`) 관리.
     - 랩별 `.sw-lap-row` 렌더링:
       - `.sw-lap-badge`: "Lap 1", "Lap 2" 등 뱃지.
       - `.sw-lap-time`: 모노스페이스 고대비 랩 타임 (`00:15.3`).
       - `.sw-lap-memo-input`: 구간별 활동 내용 입력창 (패딩/보더/마진 정돈, placeholder="구간 활동 내용 (예: 웜업, 세트 1)").
       - `.sw-lap-inject-btn`: 해당 랩 기록을 즉시 표에 기입하는 원클릭 액션 버튼.
     - 입력창 `input` 이벤트 시 `memo` 실시간 바인딩.
     - 해당 랩 기입 버튼 클릭 시 활성 셀(또는 시간 열)에 시간 및 메모 기입.
     - 리셋 시 랩 목록 및 데이터 안전 초기화.
2. `ui.css`:
   - `.sw-laps-container`, `.sw-lap-row`, `.sw-lap-badge`, `.sw-lap-time`, `.sw-lap-memo-input`, `.sw-lap-inject-btn` 스타일 정의.
   - 375px 모바일 반응형 (줄바꿈 방지 및 flex 래핑 방어, 폰트 및 패딩 최적화).
3. `tests/stopwatch-lap-inputs.test.js`:
   - 전용 단독 검증 스크립트 작성 및 통과 확인.
4. `scripts/smoke-test.js`:
   - `TASK-ES-306` 검증 블록 추가 및 총 424개 테스트 통과 확인.
5. `reports/TASK-ES-306/claims.json`:
   - R1~R4에 대한 Court 심사용 claims 정의.

## 3. 검증 전략
- `node tests/stopwatch-lap-inputs.test.js` PASS
- `node scripts/smoke-test.js` 424개 전수 PASS
- GitHub Actions Court 심사 합격 및 squash 머지.
