# [PLAN] #TASK-ES-151 ~ #TASK-ES-152 생각메모장 18항·19항 실행 계획서

- **문서 번호**: PLAN-NOTEPAD-BATCH-ES151-ES152
- **작성 일자**: 2026-09-17
- **적용 규칙**: 아워골 최고 헌법 15대 조문 (AGENTS.md) & 문제해결 8원칙 (2사이클 PLAN)
- **대상 과제**: #TASK-ES-151, #TASK-ES-152

---

## 1. 아키텍처 및 구현 설계

### 1.1 #TASK-ES-151: 일정 체크 토글 및 목표 양방향 연동
- 데이터 구조: customSchedules 항목에 done, linkedGoalId, linkedMsId, linkedTaskId 필드 보강.
- UI 렌더링:
  - 캘린더 일간 타임라인 블록 및 일정 카드 목록에서 좌측에 체크버튼 렌더링.
  - 연동된 목표가 있을 시 목표 뱃지(🎯 목표명) 노출.
- 이벤트 핸들러:
  - 체크버튼 클릭 시: toggleScheduleDone(schedId) 호출하여 sched.done = !sched.done.
  - sched.linkedGoalId 연결 시, 목표 탭 내 연동된 태스크/마일스톤의 완료 상태도 함께 토글 동기화.
  - 반대로 목표 탭에서 태스크 체크 시 연동된 일정의 done도 동기화.
  - saveProfile() 영속화 및 화면 즉시 리렌더링.
- 일정 모달 UI 보강:
  - 일정 등록/수정 모달에 연계할 목표 선택 셀렉터를 추가하여 사용자가 보유한 목표와 손쉽게 연결.

### 1.2 #TASK-ES-152: 백그라운드·앱종료·미확인 전역 알림 및 설정창 알림 제어 센터
- 데이터 구조: state.profile.settings.notifications 지원.
- 전역 알림 엔진 (window.OurgoalNotifyEngine):
  - dispatchGlobalNotification 통합 파이프라인 구축.
  - 1) 포그라운드: 상단 알림 배너 + 사운드/진동 피드백 + 해당 탭 레드닷 뱃지.
  - 2) 백그라운드: Notification.permission 확인 후 OS 시스템 알림 발송.
  - 3) 설정에 따른 프라이버시 마스킹: 간략형 선택 시 본문 숨김.
- DM 실시간 알림 연동: 대화방 외부에 있을 때 실시간 수신 알림 발송.
- 설정창 UI (renderSettingsScreen): 알림 환경설정 카드 섹션 추가 및 각 옵션 토글 배선.

---

## 2. 검증 계획
- scripts/smoke-test.js에 #TASK-ES-151, #TASK-ES-152 컴플라이언스 테스트 신설.
- 헌법 5대 게이트 15종 및 Zero Dead Click 전수 통과 확인.
- 실서버 라이브 배포 및 프로덕션 확인.