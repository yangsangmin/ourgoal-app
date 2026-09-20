# verify-master-integrity.js 118개 검사 판정 방식 분류 (정적 파싱 산출)

- 대상: `C:\dev\ourgoal-app\scripts\verify-master-integrity.js` (618줄)
- 검사 118개 / assert 132개 / 판정 원자 216개
- 원자 종류: {"includes":158,"truthy":32,"regex":21,"exists":4,"length":1} / 부정(없어야 함) 원자 10개
- 원자를 걷어낸 잔여 코드가 논리연산자·괄호뿐인 검사: 118/118 → 함수 호출·실행·네트워크 수단 없음
- 검증기가 require 하는 모듈: fs(L20), path(L21), assert(L22) / fs 호출: {"readFileSync":10,"existsSync":13,"readdirSync":1}
- 판정 수단별(mechanism): {"A":104,"C":10,"B":4} / D(런타임)=0 / E(외부 실측)=0
- 최종 분류(primary, F 우선): {"A":65,"C":10,"F":41,"B":2}
- F1 공허 통과(빈 저장소에서도 통과) 7개: SEC-05, SEC-09, SEC-10, SEC-11, PER-11, STO-09, STO-16
- F2 포화 통과(K=20회 이상 나오는 토큰만으로 충족) 34개. K별 개수: {"5":55,"20":34,"50":21,"100":13}
- 서로 다른 판정식 수: 113 / 판정식이 다른 검사와 완전히 같은 검사 7개: MOB-01, MOB-02, MOB-03, MOB-04, MOB-07, MOB-08, MOB-09
- 현재 작업폴더 기준 정적 재현 통과 수: 118/118

| id | 중요도 | 주장(제목) | 분류 | 수단 | 실제 판정(원자 · 대상파일 출현횟수) | 줄 | 비고 |
|---|---|---|---|---|---|---|---|
| SOC-01 | P0 | 피드 응원(data-react) 클릭 핸들러 및 리액션 엔진 배선 검증 | A | A | index.html 에 문자열 "data-react" [7회] / 파일존재(비어있지않음) js/reactions.js [있음] / js/reactions.js 에 문자열 "feed_cheers" [2회] | 79,80 |  |
| SOC-02 | P1 | 응원 고속 연타 방어 디바운스 및 쓰로틀링 로직 검증 | A | A | index.html 에 문자열 "data-react" [7회] / 파일존재(비어있지않음) js/reactions.js [있음] / js/reactions.js 에 정규식 /debounce\|throttle\|_isReacting\|isSubmitting/i [0회] | 84 | 0회 가지 1개(다른 OR 가지로 통과) |
| SOC-03 | P0 | 팀 목표 초대 링크 및 딥링크 프로토콜 배선 검증 | A | A | 파일존재(비어있지않음) js/team-invite-comm.js [있음] / js/team-invite-comm.js 에 정규식 /invite\|share\|clipboard/i [109회] | 88,89 |  |
| SOC-04 | P1 | 팀 목표 멤버십 및 실시간 브로드캐스트 배선 검증 | A | A | 파일존재(비어있지않음) js/team-linked-goals.js [있음] / index.html 에 문자열 "team_pings" [19회] / index.html 에 문자열 "team_comments" [7회] / js/team-linked-goals.js 에 문자열 "groupState" [9회] | 93,94 |  |
| SOC-05 | P0 | 팀원 체크인 시 팀 전체 달성률(%) 롤업 계산 로직 검증 | A | A | 파일존재(비어있지않음) js/team-leader-check.js [있음] / 파일존재(비어있지않음) js/team-visibility-levels.js [있음] / js/team-leader-check.js+js/team-visibility-levels.js 에 정규식 /compute\|progress\|rollup\|percent\|pct/i [46회] | 98,99 |  |
| SOC-06 | P0 | 방장(Owner) 전용 권한 분기 및 일반 멤버 제어 검증 | A | A | 파일존재(비어있지않음) js/team-leader-check.js [있음] / js/team-leader-check.js 에 정규식 /owner\|isLeader\|isOwner\|leader/i [58회] | 103 |  |
| SOC-07 | P1 | 방장 탈퇴 시 차순위 승계 또는 팀 보호 로직 검증 | A | A | js/team-leader-check.js+js/team-linked-goals.js 에 정규식 /leave\|withdraw\|delegate\|owner/i [5회] | 107 |  |
| SOC-08 | P1 | 소셜 코멘트 작성 시 푸시 디스패치 및 알림 엔진 배선 | C | C | 파일존재(비어있지않음) js/notify-engine.js [있음] / 파일존재 api/push-dispatch.js [있음] | 111,112 |  |
| SOC-09 | P1 | 댓글 삭제 시 대댓글 보존 및 마스킹 처리 검증 | A | A | index.html 에 문자열 "comments" [31회] / index.html 에 문자열 "cmt" [11회] / index.html 에 정규식 /삭제된 댓글\|is_deleted\|deleted_at\|deleted/i [8회] | 116,117 |  |
| SOC-10 | P2 | 320종 아바타 시스템 및 프로필 모달 렌더링 검증 | A | A | 파일존재(비어있지않음) js/avatar-system.js [있음] / js/avatar-system.js 에 문자열 "320" [69회] | 121 |  |
| SOC-11 | P0 | UGC 불량 사용자 및 콘텐츠 신고 기능(content_reports) 배선 검증 | A | A | index.html 에 문자열 "data-reportpost" [3회] / index.html 에 문자열 "data-reportcmt" [2회] / index.html 에 문자열 "openItemReportModal" [6회] / api/feedback.js 에 문자열 "content_reports" [0회] / index.html 에 문자열 "content_reports" [1회] / 파일존재(비어있지않음) js/content-moderation.js [있음] | 125,126 | 0회 가지 1개(다른 OR 가지로 통과) |
| SOC-12 | P0 | 불량 유저 차단(Block) 및 피드 영구 숨김 처리 검증 | A | A | index.html 에 문자열 "data-blockuser" [5회] / index.html 에 문자열 "차단한 사용자" [3회] / index.html 에 문자열 "blockedList" [9회] | 130,131 |  |
| SOC-13 | P2 | 소통 피드 내 유저 멘션(@) 및 하이라이트 배선 검증 | F | A | index.html 에 정규식 /@\|mention\|displayName/i [130회] | 135 | F2 포화 |
| SOC-14 | P2 | 템플릿 복제 시 원작자 크레딧 및 통계 연동 검증 | C | C | 파일존재(비어있지않음) js/template-credit.js [있음] / 파일존재(비어있지않음) js/credits.js [있음] | 139 |  |
| SOC-15 | P2 | 도움돼요(Helpful) 투표 및 사유 분석 엔진 검증 | C | C | 파일존재(비어있지않음) js/helpful-reason.js [있음] / 파일존재(비어있지않음) js/top-helpful.js [있음] | 143 |  |
| SOC-16 | P1 | 성취 카드 Canvas 렌더링 및 웹 공유 API 배선 검증 | A | A | 파일존재(비어있지않음) js/viral-sharing.js [있음] / js/viral-sharing.js 에 문자열 "canvas" [6회] / js/viral-sharing.js 에 문자열 "getContext" [1회] | 147,148 |  |
| ACC-01 | P0 | 게스트 모드 로컬 스토리지 초기화 및 기본 데이터 보장 | F | A | index.html 에 문자열 "ourgoal_guest_profile" [15회] / index.html 에 문자열 "guest" [66회] | 155 | F2 포화 |
| ACC-02 | P0 | 게스트 데이터의 소셜 로그인 클라우드 자동 이관 무결성 | A | A | index.html 에 정규식 /ourgoal_guest_profile\|migrateGuestData\|mergeGuestData\|guestGoals/i [15회] | 159 |  |
| ACC-03 | P0 | Supabase Auth onAuthStateChange 토큰 세션 갱신 리스너 검증 | A | A | index.html 에 문자열 "onAuthStateChange" [2회] | 163 |  |
| ACC-04 | P0 | 로그아웃 시 민감 세션 및 로컬 사용자 캐시 완전 파기 검증 | A | A | index.html 에 문자열 "signOut" [10회] / index.html 에 문자열 "auth.signOut" [9회] / index.html 에 문자열 "localStorage.removeItem" [11회] / index.html 에 문자열 "localStorage.clear" [0회] / 파일존재(비어있지않음) js/auth-safety.js [있음] | 167,168 | 0회 가지 1개(다른 OR 가지로 통과) |
| ACC-05 | P0 | 사용자별 스토리지 키 분리(ourgoal_settings_userId 등) 검증 | F | A | index.html 에 문자열 "ourgoal_settings_" [4회] / index.html 에 문자열 "uidVal" [37회] | 172 | F2 포화 |
| ACC-06 | P0 | api/withdraw.js CASCADE 데이터 영구 파기 및 탈퇴 로직 검증 | A | A | api/withdraw.js 에 문자열 "deleteUser" [2회] / api/withdraw.js 에 문자열 "checkins" [1회] | 176 |  |
| ACC-07 | P0 | 회원 탈퇴 완료 후 세션 초기화 및 로그인/온보딩 강제 이동 | A | A | index.html 에 문자열 "withdrawConfirmBtn" [3회] / index.html 에 문자열 "signOut" [10회] | 180 |  |
| ACC-08 | P1 | Supabase Realtime 변경 감지 및 화면 상태 갱신 루틴 | A | A | index.html 에 문자열 "realtime" [0회] / index.html 에 문자열 "channel(" [4회] / index.html 에 문자열 "onAuthStateChange" [2회] | 184 | 0회 가지 1개(다른 OR 가지로 통과) |
| ACC-09 | P1 | 데이터 전체 JSON 내보내기(Export) 함수 구현 검증 | F | A | index.html 에 문자열 "application/json" [29회] / index.html 에 문자열 "exportData" [0회] / js/universal-stats.js 에 문자열 "export" [12회] | 188 | F2 포화 · 0회 가지 1개(다른 OR 가지로 통과) |
| ACC-10 | P1 | JSON 데이터 복원 및 스키마 유효성 검증 루틴 | C | C | 파일존재 scripts/test-universal-import.js [있음] | 192 |  |
| ACC-11 | P1 | CSV 내보내기 시 UTF-8 with BOM(\\uFEFF) 인코딩 적용 검증 | A | A | index.html 에 문자열 "\\uFEFF" [4회] / index.html 에 문자열 "%EF%BB%BF" [0회] / index.html 에 정규식 /charset=utf-8/i [7회] | 196 | 0회 가지 1개(다른 OR 가지로 통과) |
| ACC-12 | P2 | 임시 저장소(Draft) 또는 삼중 백업 복구 루틴 검증 | F | A | index.html 에 문자열 "ourgoal_goals_backup_" [9회] / index.html 에 문자열 "backup" [50회] | 200 | F2 포화 |
| ACC-13 | P1 | QuotaExceededError 발생 방지 및 가비지 컬렉션/예외 처리 검증 | F | A | index.html 에 정규식 /try\s*\{[\s\S]*?localStorage\.setItem[\s\S]*?\}\s*catch/i [25+회] | 204 | F2 포화 |
| ACC-14 | P1 | 테마 및 아바타 커스텀 설정값 영속 저장 검증 | C | C | 파일존재(비어있지않음) js/theme-system.js [있음] / 파일존재(비어있지않음) js/avatar-system.js [있음] | 208 |  |
| 4VW-01 | P0 | 목표 완료 체크인 시 캘린더 히트맵 잔디 승급 배선 검증 | F | A | index.html 에 문자열 "updateCalendarState" [0회] / index.html 에 문자열 "renderCalendarScreen" [45회] / index.html 에 문자열 "renderCalendar" [47회] | 215 | F2 포화 · 0회 가지 1개(다른 OR 가지로 통과) |
| 4VW-02 | P0 | 목표 완료 체크인 시 기록 타임라인 체크인 카드 자동 생성 배선 | F | A | index.html 에 문자열 "renderRecordsTimeline" [0회] / index.html 에 문자열 "renderRecordsScreen" [51회] | 219 | F2 포화 · 0회 가지 1개(다른 OR 가지로 통과) |
| 4VW-03 | P0 | 목표 체크인 시 연속 달성일수(Streak) 및 달성률 즉시 재계산 | A | A | 파일존재(비어있지않음) js/streaks.js [있음] / index.html 에 문자열 "computeStreakDays" [24회] | 223 |  |
| 4VW-04 | P1 | 목표 체크인 시 잠금화면 모달 및 상단 HUD 게이지 전파 | A | A | index.html 에 문자열 "renderLockscreenModal" [0회] / index.html 에 문자열 "dispatchFullViewPropagation" [13회] | 227 | 0회 가지 1개(다른 OR 가지로 통과) |
| 4VW-05 | P0 | 캘린더에서 체크인 취소/삭제 시 목표/기록/통계 역방향 동시 갱신 | A | A | index.html 에 문자열 "dispatchFullViewPropagation" [13회] | 231 |  |
| 4VW-06 | P1 | 기록 탭에서 사진/메모 수정 시 캘린더 모달 동기화 배선 | C | C | 파일존재(비어있지않음) js/calendar-attachment.js [있음] | 235 |  |
| 4VW-07 | P0 | 목표 제목/카테고리 수정 시 4대 뷰 내 해당 목표 일괄 갱신 | A | A | 파일존재(비어있지않음) js/goal-edit-ux.js [있음] / index.html 에 문자열 "saveProfile" [293회] | 239 |  |
| 4VW-08 | P0 | 목표 삭제 시 캘린더/통계/기록에서 안전한 참조 제거(Cascade) 처리 | F | A | index.html 에 정규식 /trash\|delete\|filter/i [534회] | 243 | F2 포화 |
| 4VW-09 | P0 | 타임 트래커 가동 중 탭 전환 시 타이머 중단 없는 지속 카운팅 | A | A | 파일존재(비어있지않음) js/time-tracker.js [있음] / js/time-tracker.js 에 정규식 /setInterval\|Date\.now/i [8회] | 247 |  |
| 4VW-10 | P1 | 타이머 종료 시 기록 탭 타임라인 및 통계 탭 누적 합산 전파 | A | A | 파일존재(비어있지않음) js/time-tracker.js [있음] / js/time-tracker.js 에 정규식 /save\|record\|finish/i [54회] | 251 |  |
| 4VW-11 | P1 | 성역(Sanctuary v3) 모드 전환 시 4대 뷰 상태 동기화 검증 | A | A | 파일존재(비어있지않음) js/sanctuary-v3-engine.js [있음] / index.html 에 문자열 "OurgoalSanctuaryV3" [24회] | 255 |  |
| 4VW-12 | P1 | 캘린더 주간/월간 모드 토글 시 포커스 날짜 보존 검증 | F | A | index.html 에 문자열 "renderCalendarMode" [0회] / index.html 에 문자열 "renderCalendarScreen" [45회] | 259 | F2 포화 · 0회 가지 1개(다른 OR 가지로 통과) |
| 4VW-13 | P1 | AI 추천 목표 승인 시 목표 탭 및 4대 뷰 즉시 슬롯 배치 | C | C | 파일존재 api/goalagent.js [있음] / 파일존재(비어있지않음) js/goal-templates-registry.js [있음] | 263 |  |
| 4VW-14 | P1 | 탭 전환 시 display 제어를 통한 화면 깜빡임 제로 검증 | F | A | index.html 에 문자열 "setTab" [40회] | 267 | F2 포화 |
| MOB-01 | P0 | 모달 오픈 시 하드웨어 뒤로가기 입력으로 모달만 닫힘 검증 | A | A | index.html 에 문자열 "handleHardwareBackButton" [6회] | 274 | 동일식: MOB-02,MOB-03,MOB-04 |
| MOB-02 | P0 | 중첩 모달/백드롭 상태에서 최상위 팝업 순차적 닫힘 검증 | A | A | index.html 에 문자열 "handleHardwareBackButton" [6회] | 278 | 동일식: MOB-01,MOB-03,MOB-04 |
| MOB-03 | P1 | 사이드 드로어 열림 상태에서 뒤로가기 입력 시 드로어 닫힘 | A | A | index.html 에 문자열 "handleHardwareBackButton" [6회] | 282 | 동일식: MOB-01,MOB-02,MOB-04 |
| MOB-04 | P1 | 서브 탭 탐색 중 뒤로가기 시 홈 탭 복귀 네비게이션 검증 | A | A | index.html 에 문자열 "handleHardwareBackButton" [6회] | 286 | 동일식: MOB-01,MOB-02,MOB-03 |
| MOB-05 | P0 | 홈 최상단 뒤로가기 시 "한 번 더 누르면 앱이 종료됩니다" 토스트 안내 | A | A | index.html 에 문자열 "한 번 더 누르면 앱이 종료됩니다" [1회] | 290 |  |
| MOB-06 | P0 | 2초 내 뒤로가기 재입력 시 Capacitor App.exitApp() 정상 종료 | A | A | index.html 에 문자열 "exitApp" [4회] | 294 |  |
| MOB-07 | P1 | 체크박스 및 잔디 터치 시 햅틱 피드백(Haptics/vibrate) 작동 | F | A | index.html 에 문자열 "triggerHaptic" [85회] / index.html 에 문자열 "navigator.vibrate" [28회] | 298 | F2 포화 · 동일식: MOB-08,MOB-09 |
| MOB-08 | P2 | 피드 응원 버튼 클릭 시 리듬감 있는 진동 펄스 전달 | F | A | index.html 에 문자열 "triggerHaptic" [85회] / index.html 에 문자열 "navigator.vibrate" [28회] | 302 | F2 포화 · 동일식: MOB-07,MOB-09 |
| MOB-09 | P2 | 목표 드래그앤드롭 순서 변경 시 햅틱 피드백 제공 | F | A | index.html 에 문자열 "triggerHaptic" [85회] / index.html 에 문자열 "navigator.vibrate" [28회] | 306 | F2 포화 · 동일식: MOB-07,MOB-08 |
| MOB-10 | P1 | 소프트 키보드 활성화 시 하단 바 가림 방지 및 visualViewport 대응 | A | A | ui.css 에 문자열 "safe-area-inset-bottom" [12회] / index.html 에 문자열 "visualViewport" [0회] | 310 | 0회 가지 1개(다른 OR 가지로 통과) |
| MOB-11 | P1 | 긴 폼 입력 시 키보드 뒤 가림 방지 scrollIntoView 대응 | F | A | index.html 에 정규식 /scrollIntoView\|focus/i [113회] | 314 | F2 포화 |
| MOB-12 | P0 | 노치/상태표시줄 영역 겹침 방지 env(safe-area-inset-top) 검증 | A | A | ui.css 에 문자열 "safe-area-inset-top" [6회] | 318 |  |
| MOB-13 | P0 | 홈 인디케이터 겹침 방지 env(safe-area-inset-bottom) 검증 | A | A | ui.css 에 문자열 "safe-area-inset-bottom" [12회] | 322 |  |
| MOB-14 | P1 | OS prefers-color-scheme 시스템 테마 실시간 연동 검증 | A | A | 파일존재(비어있지않음) js/theme-system.js [있음] / js/theme-system.js 에 문자열 "prefers-color-scheme" [1회] | 326 |  |
| MOB-15 | P0 | 앱 백그라운드 전환 시 로컬 스토리지 데이터 강제 플러시 | F | A | index.html 에 정규식 /appStateChange\|visibilitychange\|beforeunload\|freeze/i [34회] | 330 | F2 포화 |
| MOB-16 | P0 | 앱 포그라운드 복귀 시 자정 날짜 갱신 및 소켓 헬스체크 | F | A | index.html 에 정규식 /appStateChange\|visibilitychange\|focus/i [104회] | 334 | F2 포화 |
| MOB-17 | P1 | 안드로이드 매니페스트 세로 모드(portrait) 고정 검증 | B | B | android/app/src/main/AndroidManifest.xml 에 문자열 "android:screenOrientation=\"portrait\"" [1회] | 338 |  |
| MOB-18 | P2 | 테마에 따른 안드로이드 상태표시줄 스타일 및 메타 테마색 검증 | A | A | index.html 에 문자열 "theme-color" [2회] | 342 |  |
| OFF-01 | P1 | 네트워크 단절 시 상단 오프라인 안내 배너 자동 노출 검증 | A | A | index.html 에 문자열 "offlineNoticeBanner" [3회] | 349 |  |
| OFF-02 | P0 | 오프라인 상태에서 목표 생성 시 로컬 스토리지 안전 저장 검증 | F | A | index.html 에 문자열 "ourgoal_goals_backup_" [9회] / index.html 에 문자열 "saveProfile" [293회] | 353 | F2 포화 |
| OFF-03 | P0 | 오프라인 상태에서 체크박스 토글 시 로컬 기록 즉각 반영 | A | A | index.html 에 문자열 "saveQuickCheckin" [4회] | 357 |  |
| OFF-04 | P0 | OfflineSyncManager를 통한 선입선출(FIFO) 변경 큐 적재 | A | A | index.html 에 문자열 "OfflineSyncManager" [4회] / index.html 에 문자열 "ourgoal_offline_sync_queue" [1회] | 361 |  |
| OFF-05 | P0 | 온라인 복귀 시 OfflineSyncManager.flush() 자동 클라우드 동기화 | A | A | index.html 에 문자열 "OfflineSyncManager.flush" [1회] | 365 |  |
| OFF-06 | P1 | 동기화 완료 후 사용자 안내 토스트 및 배너 퇴장 피드백 | F | A | index.html 에 문자열 "온라인에 다시 연결되었어요" [1회] / index.html 에 문자열 "동기화" [55회] | 369 | F2 포화 |
| OFF-07 | P1 | 서버-로컬 데이터 충돌 시 Last-Write-Wins 타임스탬프 무결성 | F | A | index.html 에 문자열 "timestamp" [5회] / index.html 에 문자열 "nowISO" [104회] | 373 | F2 포화 |
| OFF-08 | P0 | 지연 네트워크 환경에서 다중 제출(Double Submit) 차단 디바운스 | F | A | index.html 에 정규식 /disabled\|isSubmitting\|loading\|btn\.disabled/i [97회] | 377 | F2 포화 |
| OFF-09 | P0 | API 에러 발생 시 UI 상태 롤백 및 사용자 오류 피드백 | F | A | index.html 에 정규식 /catch\s*\(.*?\)[\s\S]*?toast/i [25+회] | 381 | F2 포화 |
| OFF-10 | P1 | 일시적 서버 에러 시 무차별 폭풍 요청 방지 지연 로직 | F | A | index.html 에 정규식 /setTimeout\|delay\|retry\|backoff/i [46회] | 385 | F2 포화 |
| OFF-11 | P0 | sw.js의 CacheFirst 전략 및 정적 핵심 에셋 100% 캐싱 보증 | A | A | sw.js 에 문자열 "caches.open" [2회] / sw.js 에 문자열 "cache.addAll" [1회] | 389 |  |
| OFF-12 | P1 | 새로운 배포 감지 시 서비스워커 갱신 및 캐시 무효화 | A | A | sw.js 에 문자열 "CACHE_NAME" [4회] / sw.js 에 문자열 "activate" [1회] | 393 |  |
| OFF-13 | P1 | 오프라인 사진 첨부 시 로컬 Blob URL 선반영 검증 | A | A | index.html 에 문자열 "createObjectURL" [3회] / index.html 에 문자열 "readAsDataURL" [4회] / 파일존재(비어있지않음) js/calendar-attachment.js [있음] | 397 |  |
| OFF-14 | P1 | 네트워크 실패 시 무한 로딩 탈출 및 "다시 시도" 버튼 제공 | A | A | index.html 에 정규식 /다시 시도\|재시도\|retry/i [19회] | 401 |  |
| SEC-01 | P0 | 비공개 목표(is_private=true) 타인 조회 원천 차단 RLS 정책 | A | A | index.html 에 문자열 "visibility:g.visibility\|\|'private'" [2회] | 408 |  |
| SEC-02 | P0 | UPDATE/DELETE 시 auth.uid() = user_id 엄격 검증 | A | A | index.html 에 문자열 "user_id:uidVal" [2회] / index.html 에 문자열 "id: uidVal" [1회] | 412 |  |
| SEC-03 | P0 | INSERT 페이로드의 user_id 조작 차단 | F | A | index.html 에 문자열 "uidVal" [37회] | 416 | F2 포화 |
| SEC-04 | P0 | 미가입 외부 유저의 비공개 팀 데이터 접근 차단 | C | C | 파일존재(비어있지않음) js/team-visibility-levels.js [있음] / 파일존재(비어있지않음) js/team-linked-goals.js [있음] | 420 |  |
| SEC-05 | P0 | 프론트엔드 코드 내 SUPABASE_SERVICE_ROLE_KEY 누출 제로 검증 | F | A | NOT index.html 에 문자열 "SUPABASE_SERVICE_ROLE_KEY" [0회] / NOT ui.js 에 문자열 "SUPABASE_SERVICE_ROLE_KEY" [0회] | 424,425 | F1 공허 |
| SEC-06 | P0 | 목표 제목 및 메모 escapeHtml() XSS 살균 방어 검증 | A | A | index.html 에 문자열 "function escapeHtml(s)" [1회] / index.html 에 문자열 "escapeHtml(g.title)" [13회] / index.html 에 문자열 "escapeHtml(item.title)" [4회] / index.html 에 문자열 "escapeHtml(text" [1회] | 429,430 |  |
| SEC-07 | P0 | 피드 및 댓글 렌더링 시 악의적 HTML 살균 검증 | A | A | index.html 에 문자열 "escapeHtml(c.display_name" [2회] / index.html 에 문자열 "escapeHtml(p.display_name" [2회] | 434 |  |
| SEC-08 | P0 | Supabase Client Parameterized Query 사용 검증 | C | C | 파일존재 scripts/sql-lint.js [있음] | 438 |  |
| SEC-09 | P0 | 브라우저 콘솔 내 비밀번호 및 인증 토큰 평문 로깅 차단 | F | A | NOT index.html 에 문자열 "console.log(password)" [0회] / NOT index.html 에 문자열 "console.log(token)" [0회] | 442,443 | F1 공허 |
| SEC-10 | P0 | HTTPS 강제 및 평문 HTTP 비인가 접근 차단 검증 | F | B | NOT capacitor.config.json 에 문자열 "\"cleartext\": true" [0회] | 447 | F1 공허 |
| SEC-11 | P1 | localStorage 비밀번호 평문 보관 금지 검증 | F | A | NOT index.html 에 문자열 "localStorage.setItem('password'" [0회] | 451 | F1 공허 |
| SEC-12 | P0 | 사진 업로드 시 MIME-Type 및 5MB 용량 제한 검증 | F | A | index.html 에 문자열 "image/" [28회] / 파일존재(비어있지않음) js/calendar-attachment.js [있음] | 455 | F2 포화 |
| SEC-13 | P1 | api/ 엔드포인트 메서드(POST/GET) 검증 및 CORS 방어 | A | A | api/withdraw.js 에 문자열 "req.method !== 'POST'" [1회] | 459 |  |
| SEC-14 | P1 | 입력 필드 maxlength 속성 및 텍스트 슬라이싱 방어 | A | A | index.html 에 문자열 "maxlength" [12회] | 463 |  |
| PER-01 | P1 | 렌더 블로킹 CSS 최소화 및 중요 스타일 인라인 배치 | A | A | index.html 에 문자열 "<style>" [0회] / index.html 에 문자열 "ui.css" [1회] | 470 | 0회 가지 1개(다른 OR 가지로 통과) |
| PER-02 | P1 | 초기 렌더링 시 대형 외부 이미지 의존성 배제 및 SVG 인라인화 | A | A | index.html 에 문자열 "<svg" [110회] / index.html 에 문자열 "avatar-system.js" [1회] | 474 |  |
| PER-03 | P1 | 터치 이벤트 시 불필요한 메인스레드 블로킹 방어 (async/await 및 rAF) | F | A | index.html 에 문자열 "requestAnimationFrame" [0회] / index.html 에 문자열 "async function" [317회] | 478 | F2 포화 · 0회 가지 1개(다른 OR 가지로 통과) |
| PER-04 | P1 | 폰트 로딩 및 이미지 레이아웃 이동 방지 크기 고정 | F | A | ui.css 에 문자열 "width:" [312회] / ui.css 에 문자열 "height:" [359회] | 482 | F2 포화 |
| PER-05 | P1 | 하드웨어 가속 transform/will-change 및 overscroll 최적화 | F | A | ui.css 에 문자열 "transform" [218회] / ui.css 에 문자열 "overflow-y:auto" [3회] | 486 | F2 포화 |
| PER-06 | P1 | 피드 및 기록 탭 slice(0, 30) 등 청크 렌더링 검증 | F | A | index.html 에 문자열 ".slice(0," [136회] / index.html 에 문자열 ".slice(0, 50)" [1회] | 490 | F2 포화 |
| PER-07 | P0 | 탭 전환 시 중복 DOM 생성 방지 (기존 노드 innerHTML="" 또는 재사용) | F | A | index.html 에 문자열 "container.innerHTML = ''" [2회] / index.html 에 문자열 "setTab" [40회] | 494 | F2 포화 |
| PER-08 | P0 | 모달 개폐 시 전역 리스너 누적 방어 및 일회성 핸들러 관리 | F | A | index.html 에 문자열 "closeModal" [238회] | 498 | F2 포화 |
| PER-09 | P1 | 실시간 알림 수신 시 전체 리렌더 없이 타겟 노드만 부분 갱신 | A | A | index.html 에 문자열 "topNotifBadge" [2회] / index.html 에 문자열 "textContent" [165회] | 502 |  |
| PER-10 | P2 | 320종 아바타 SVG 심볼 캐시 및 중복 렌더링 방지 | C | C | 파일존재(비어있지않음) js/avatar-system.js [있음] | 506 |  |
| PER-11 | P2 | 바닐라 JS 기반 무거운 프레임워크 런타임 배제 경량화 | F | A | NOT index.html 에 문자열 "react.production.min.js" [0회] | 510 | F1 공허 |
| PER-12 | P1 | 비활성 화면 시 애니메이션 중단 및 타이머 최적화 | F | A | index.html 에 정규식 /visibilitychange\|hidden/i [111회] / 파일존재(비어있지않음) js/time-tracker.js [있음] | 514 | F2 포화 |
| STO-01 | P0 | 설정 탭 내 명확한 회원 탈퇴 버튼(withdrawBtn) 3클릭 도달 배치 | A | A | index.html 에 문자열 "id=\"withdrawBtn\"" [1회] | 521 |  |
| STO-02 | P0 | 탈퇴 모달 내 개인정보 영구 파기 정책 명시 검증 | A | A | index.html 에 문자열 "데이터 영구 파기 및 법적 보존 고지사항" [1회] | 525 |  |
| STO-03 | P0 | 앱 내 개인정보 처리방침 전문 모달 및 3조 보유/파기 조항 검증 | A | A | index.html 에 문자열 "아워골 개인정보처리방침" [1회] / index.html 에 문자열 "제3조 (보유 및 파기)" [1회] | 529 |  |
| STO-04 | P0 | 앱 내 서비스 이용약관 전문 모달 및 3조 커뮤니티 정책 조항 검증 | A | A | index.html 에 문자열 "아워골 서비스 이용약관" [1회] / index.html 에 문자열 "제3조 (사용자 콘텐츠 및 커뮤니티 정책)" [1회] | 533 |  |
| STO-05 | P0 | 유저 게시물/댓글에 상시 노출되는 신고(Report) 버튼 배선 | A | A | index.html 에 문자열 "data-reportpost" [3회] / index.html 에 문자열 "data-reportcmt" [2회] | 537 |  |
| STO-06 | P0 | 유저 게시물/댓글에 상시 노출되는 차단(Block) 버튼 배선 | A | A | index.html 에 문자열 "data-blockuser" [5회] | 541 |  |
| STO-07 | P1 | 설정 탭 내 오류 제보 및 1:1 문의 채널(api/feedback.js) 배선 | A | A | 파일 길이>0 api/feedback.js [있음] / index.html 에 문자열 "feedback" [119회] | 545 |  |
| STO-08 | P0 | 광고/결제 유도 다크패턴 배제 및 명확한 닫기(X) 버튼 보장 | A | A | index.html 에 문자열 "subscriptionState" [1회] / index.html 에 문자열 "isPro:true, plan:'free_all'" [2회] | 549 |  |
| STO-09 | P1 | 외부 메일 앱 의존 링크(mailto:) 제로 검증 | F | A | NOT index.html 에 문자열 "href=\"mailto:" [0회] | 553 | F1 공허 |
| STO-10 | P1 | 주요 버튼 및 탭의 48x48px 터치 영역 규격 충족 검증 | F | A | ui.css 에 문자열 "min-height: 48px" [0회] / ui.css 에 문자열 "min-width: 48px" [1회] / ui.css 에 문자열 "min-height:var(--topbar-h)" [1회] / ui.css 에 문자열 "44px" [27회] / ui.css 에 문자열 "48px" [21회] | 557 | F2 포화 · 0회 가지 1개(다른 OR 가지로 통과) |
| STO-11 | P1 | WCAG AA 4.5:1 이상 명도 대비 색상 팔레트 검증 | A | A | ui.css 에 문자열 "--ink:" [8회] / ui.css 에 문자열 "--bg:" [21회] | 561 |  |
| STO-12 | P1 | 아이콘 버튼에 aria-label 및 role="button" 부여 검증 | A | A | index.html 에 문자열 "aria-label=" [57회] / index.html 에 문자열 "role=" [15회] | 565 |  |
| STO-13 | P2 | 가변 폰트 단위(rem/em) 사용으로 시스템 폰트 확대 대응 | F | A | ui.css 에 문자열 "rem" [471회] | 569 | F2 포화 |
| STO-14 | P0 | 네트워크 미연결 시에도 화이트아웃 크래시 없는 오프라인 가드 | A | A | index.html 에 문자열 "offlineNoticeBanner" [3회] / index.html 에 문자열 "window.addEventListener('offline'" [1회] | 573 |  |
| STO-15 | P0 | .well-known/assetlinks.json SHA-256 서명 링크 무결성 검증 | B | B | .well-known/assetlinks.json 에 문자열 "com.yangbis.ourgoal" [1회] / .well-known/assetlinks.json 에 문자열 "sha256_cert_fingerprints" [1회] | 577 |  |
| STO-16 | P0 | AndroidManifest.xml 내 불필요한 민감 권한 요구 제로 검증 | F | B | NOT android/app/src/main/AndroidManifest.xml 에 문자열 "android.permission.READ_CONTACTS" [0회] / NOT android/app/src/main/AndroidManifest.xml 에 문자열 "android.permission.ACCESS_FINE_LOCATION" [0회] | 581,582 | F1 공허 |
