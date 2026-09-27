# TASK-ES-317 법정 주장서 (Claims)

## 과제 개요
- **티켓**: `#TASK-ES-317`
- **노션 생각 메모장 번호**: `[66]번`
- **지시 내용**: "아워골 평가해주기 창 밑에 ‘언제 얼마든지 평가해주실 수 있습니다’ 문구 추가해서 한번 평가하면 끝인가? 싶은 의문 해소"

## 요구사항 및 실체 코드 매핑
- **R1 / C1**: `index.html` 내 `appEvaluationModal` (평가 모달) 하단에 `evalModalAlwaysNotice` 요소 구비 및 "언제 얼마든지 평가해주실 수 있습니다" 안내 표출
- **R2 / C2**: `index.html` 내 `appEvaluationModal` 본문 서두에 "언제 얼마든지 평가해주실 수 있습니다" 안내 문구 추가
- **R3 / C3**: `index.html` 내 홈탭 고정 배너 `homeEvalBannerAlwaysNotice`에 상시 반복 평가 환영 캡션 보강
- **R4 / C4**: `index.html` 내 평가 제출 성공 토스트에 언제 얼마든지 다시 평가해주실 수 있습니다 문구 추가
- **R5 / C5~C6**: `js/components.js` 내에 `handle홈탭_Item66Action` 직통 핸들러 및 `og_task-66_cache` 로컬 캐시 영속화, 4대 뷰 원자적 전파 구현
- **R6 / C7**: `tests/app-evaluation-notice.test.js` 및 `scripts/smoke-test.js`에 `#TASK-ES-317` 전수 검증 테스트 구축 (435개 전수 통과)
- **R7 / C8**: `docs/rules/TICKETS.md`에 `#TASK-ES-317` 승인 티켓 등록

## 검증 결과
- `tests/app-evaluation-notice.test.js`: 통과 (100%)
- `scripts/smoke-test.js`: 435개 통과, 0개 실패 (100% 무결점)
