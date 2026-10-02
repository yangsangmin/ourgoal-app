# [PLAN] #TASK-ES-140 ~ #TASK-ES-142: 아바타 레벨표시 제거 및 목표·일정·기록·소통 6대 결함 일괄 정상화

## 1. 단계별 실행 계획
1. **아바타 창 레벨 표시 제거**: `js/avatar-system.js`에서 `.avatar-lv-pill` 제거 및 `ui.css`에 `.avatar-lv-pill { display: none !important; }` 적용.
2. **목표 탭 배너 & 스크롤 복구**: `.goals-sticky-subnav`의 네거티브 마진 제거 및 불투명 배경 적용, 상하 스크롤 락 해제, 개인목표 패딩/마진 50% 슬림화.
3. **일정 탭 7열 그리드 짤림 복구 & 구글 세션 유지**: 문법 오류 정상화, `repeat(7, minmax(0, 1fr))` 적용, 구글 캘린더 비휘발성 로컬 스토리지 영구 고정.
4. **기록·소통 탭 스크롤 복구 & 시인성 개선 & 중앙 정렬**: `#screen-records`, `#screen-comm` 스크롤 활성화, 소통 피드 카드 고대비 리디자인, 상단 배너(`.reaction-floating-bar`, `#commHeadlineSentence`) 정중앙 정렬.
5. **법정 검증 및 CDP 실측**: 38개 헌법 게이트 100% 통과, 390px 뷰포트 실측 및 스크린샷 검증.
