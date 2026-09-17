# [요구사항 정의서] #TASK-ES-155 캘린더 배경사진·체크토글·잇템추가 결함 해결 및 일정 안내문구 추가

## 1. 개요 및 배경
- **티켓**: #TASK-ES-155 (E1/FIX)
- **발견된 문제**:
  1. 캘린더 일자 클릭 후 일간 허브 모달에서 '이날의 배경사진 고르기' 클릭 시 모달이 닫히거나 전환되지 않는 문제 (closeModal 호출 후 popstate 충돌).
  2. 일간 상세뷰의 '이날의 배경사진 고르기' 진입 후 사진을 선택해도 미리보기가 표출되지 않고, 저장 버튼을 눌러도 동작하지 않는 결함 (showToast is not defined 런타임 오류로 인한 이벤트 핸들러 중단).
  3. 캘린더 일간 일정 목록에서 체크버튼 클릭 시 완료/미완료 토글이 동작하지 않는 결함 (renderCalDayDetail 내 ms-status가 비인터랙티브 정적 요소로 남아있음).
  4. 프로필 편집 내 잇템 추가 서브 모달에서 새 잇템 등록 후 확인을 누르면 모달이 강제 종료되거나 기존 목록에 반영되지 않는 결함 (openProfileEditor가 기존 draft를 수신하지 않고 초기화하며, closeModal 후 popstate 충돌).
  5. 추가 요청: 일정 탭 제목과 달력 사이에 '일정을 사진배경으로 채워서 나만의 사진일기장을 만들어봐요' 안내 문구 삽입.

## 2. 문제해결 8원칙 (REQ)
1. 문제 정확히 파악: 모달 간 전환 시 popstate 레이스, showToast 함수 미정의 에러, 캘린더 상세 체크 핸들러 누락, 잇템 draft 미전달.
2. 본질·원인·핵심 파악 (E1/FIX): 런타임 예외 방어 및 모달 전환 아키텍처 정규화.
3. 해결방식 결정:
   - [모달 전환]: 선행 closeModal() 호출 없이 openModal() 직접 호출.
   - [토스트 함수]: toast() 호출로 정정 및 window.showToast = toast 등록.
   - [일정 체크]: renderCalDayDetail 내 ms-status를 sched-check 버튼으로 교체하고 data-caltogglesched 배선.
   - [잇템 추가]: openProfileEditor(existingDraft) 인자 지원 및 closeModal() 없는 부드러운 복귀.
   - [안내 카피]: screen-calendar 헤더 아래 cal-sub-guide 클래스 탑재.
4. 1~3 재검토·보완: 292개 기존 테스트 및 신규 무결성 보존.
5. 절차 정리: ui.css, index.html, scripts/smoke-test.js 순차 패치.
6. 절차 재검증: headless 스크립트로 5개 기능 동시 시뮬레이션.
7. 단계별 실행 기준: npm test 통과 및 실서버 배포.
8. 막히는 지점 예상: popstate와 모달 히스토리 상태 무결성 보존.
