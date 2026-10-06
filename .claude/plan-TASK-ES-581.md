# TASK-ES-581 작업계획서: 전체 화면 렌더·앱 부팅 원문 분열

- 기준 PR: #838 (37f41857ced08770a05b79565563326e0b851541)
- 작업 브랜치: `codex/task-es-581-app-boot`
- 작업 트리: `C:/Users/HP/.codex/worktrees/agy-boot-581/ourgoal-app`
- 대상: `renderAll` (index.html:7824~7835), `boot` (index.html:7854~8079)
- 대상 파일: `js/core/all-view-render.js`, `js/core/app-boot.js` 생성

## 단계별 체크리스트 (심사 청구까지)
- [x] 1단계: 인계 자료·최신 main(37f41857 PR #838) 동기화, archive 기준 보존, task-link 갱신, REQ 작성 및 무결성 게이트 검증 통과
- [ ] 2단계: 스코프 분석 생성기(`inline-boot581.json`) 실행으로 `renderAll` 및 `runAppBoot` 분열, `modules.json`/`cell-descriptions.json` 갱신
- [ ] 3단계: 정적 무결성 검증(`verify-inline-hard.js`) 토큰 동일·누수 0·이중처리기 0·800줄 이하 및 단독 로드/부팅 회귀 0 측정 (`module-load.js`)
- [ ] 4단계: 실제 UI 게스트 하네스 2회(base1, base2) vs 작업 1회(after) CDP 실제 호출 계측(boot/renderAll 및 runAppBoot), DOM·savedGuestProfile 키/leaf·스토리지·콘솔 비교, 탭 하네스 비교, npm 전체 시험 및 115개 시험 전후 비교
- [ ] 5단계: reports/TASK-ES-581 리포트 및 claims.json 적재, 정상 훅 커밋 완료

## 막힘 및 위험 요소 대응
- `boot` 내 24개 로그인/PKCE 비동기 분기: 게스트 모드 UI 하네스로는 게스트 경로 1회 실행만 관찰되므로, 로그인 분기는 "미측정"으로 명확히 구분 기록하여 정직성 준수
- `OurgoalUiHelpers` 키트 덮어쓰기: `afterTag: <script src="js/core/ui-helpers.js"></script>`로 태그 배치하여 안전하게 속성 추가
- `OurgoalCredits.init`(8082줄) 분열 방지: `Boot` 구획 주석 범위 바깥이므로 생성기 범위에서 제외되어 원본에 안전 잔류
- 외부 네트워크 차단 및 로컬 에러: Supabase 웹소켓 등 기존 미연결 에러는 기준과 작업 동일성을 확인하고 새 에러 0개 검증
