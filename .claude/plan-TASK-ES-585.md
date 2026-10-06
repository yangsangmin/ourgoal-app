# TASK-ES-585 작업계획서: 전문 템플릿 기록 상세 모달·딥링크 원문 분열

- 기준 PR: #842 (66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9)
- 작업 브랜치: `codex/task-es-585-record-detail`
- 작업 트리: `C:/Users/HP/.codex/worktrees/agy-record-modals-585/ourgoal-app`
- 대상: `openTemplateRecordDetailModal` (index.html:7289~7411), `checkRecordDeepLink` (index.html:7414~7428)
- 대상 파일: `js/tabs/records/template-record-detail.js` 생성

## 단계별 체크리스트 (심사 청구까지)
- [x] 1단계: 인계 자료·최신 main(66ce3a63 PR #842) 동기화, archive 기준 보존, shared-learning bootstrap, REQ 작성 및 무결성 게이트 검증 통과
- [ ] 2단계: 스코프 분석 생성기(`inline-record-detail585.json`) 실행으로 `openTemplateRecordDetailModal` 및 `checkRecordDeepLink` 분열, `modules.json`/`cell-descriptions.json` 갱신
- [ ] 3단계: 정적 무결성 검증(`verify-inline-hard.js`) 토큰 동일·누수 0·이중처리기 0·800줄 이하 및 단독 로드/부팅 회귀 0 측정 (`module-load.js`)
- [ ] 4단계: 실제 UI 게스트 하네스 2회(base1, base2) vs 작업 1회(after) CDP 실제 호출 계측(템플릿 기록 저장, 카드 클릭 상세 모달 열기/닫기/차트기간/수정, #record:<id> 딥링크 실제 해시 탐색), DOM·스토리지·콘솔 비교, 탭 하네스 비교, npm 전체 시험 및 115개 시험 전후 비교
- [ ] 5단계: reports/TASK-ES-585 리포트 및 claims.json 적재, evidence-manifest 검증 통과, 정상 훅 커밋 완료

## 막힘 및 위험 요소 대응
- `OurgoalUiHelpers` 키트 덮어쓰기: `afterTag: <script src="js/core/ui-helpers.js"></script>`로 태그 배치하여 안전하게 속성 추가
- `hashchange` 이벤트 이중 등록 방지: `inline-record-detail585.json`의 `keepRest: true`로 원본 자리 리스너 1개만 보존
- 게스트 조작 범위 한정: AI 코치/Notion 내보내기는 외부/유료 네트워크 대상이므로 "미측정"으로 명확히 구분 기록
- URL 딥링크 이벤트: dispatchEvent나 상태 주입 없이 브라우저 해시 실제 탐색으로 이벤트 계측
- 외부 네트워크 차단 및 로컬 에러: Supabase 웹소켓 등 기존 미연결 에러는 기준과 작업 동일성을 확인하고 새 에러 0개 검증
