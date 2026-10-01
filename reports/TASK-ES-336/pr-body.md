## [블록 1] 작업 배경 및 목적 (Problem & Context)
- 티켓: #TASK-ES-336 (UX/E2)
- 상민님 원문 결심 및 지시:
  - 2026-10-01 상민님 질의: "1번 작업을 진행하면 기능이 점점 너무 많아지는거 아닌가? 좋은 기록을 재확인하면서 자기효능감이 증대되는 효과도 있을 것 같긴한데, 이 기능은 주기가 중요할 것 같아. 알림을 받고 앱을 들어가서 어디서 어떻게 보여지고 또 거기서 어떻게 그 기록들을 세부적으로 확인할 수 있는지, 그냥 알림 요약본만 보고 쉽게 닫을 수 있는지 등도 중요할 것 같고... 대안 A로 진행해"
- 배경 및 목적:
  - PR #594로 구축된 주간/월간 회고 푸시 알림 수신 후, 유저가 기록 탭에 도달했을 때 기능 비대화(Feature Creep)나 복잡한 신규 화면의 피로 없이 이번 주 성장을 3초 만에 훑어보고 안도감을 얻을 수 있는 초경량 요약 카드가 필요했습니다.
  - 상민님의 "대안 A로 진행해" 결정에 따라, 신규 별도 화면 신설이나 수동 별표(⭐) 노동을 원천 배제하고, 순수 팩트 기반(사진 ➔ 몰입 시간 ➔ 글자 수)의 베스트 모먼트 자동 큐레이션과 3대 핵심 지표(실천 횟수, 총 몰입 시간, 연속 스트릭), 그리고 0.5초 원터치 닫기(기존 피드로의 즉시 복귀)를 갖춘 초경량 요약 카드 모달을 구축합니다.

## [블록 2] 주요 변경 내역 (Key Changes)
- `index.html`:
  - **헤더 배선**: 기록 탭 헤더(`recHeaderActionArea`)에 `[🐾 이번 주 리캡]` 버튼(`#btnOpenWeeklyRecap`) 추가.
  - **URL 트리거**: 기록 탭 진입 시 URL 파라미터(`recap=weekly`) 또는 해시 감지 시 350ms 후 리캡 모달 자동 호출.
  - **팩트 기반 베스트 모먼트 알고리즘**: `findBestMoment(records, now)` 신설 — 수동 노동 없이 사진 첨부 여부(1순위) ➔ 몰입 시간(2순위) ➔ 글자 수(3순위) 순으로 이번 주 가장 빛난 순간 자동 선별.
  - **초경량 3초 요약 카드 모달**: `openWeeklyRecapModal()` 전면 개편 — 3대 팩트 지표(실천 횟수, 총 몰입 시간, 스트릭), 베스트 모먼트 미니 카드(클릭 시 해당 기록 상세 모달 `openRecordModal` 직통 연결), 0.5초 원터치 닫기 버튼(`#btnRecapTopClose`, `#btnRecapFeedGo`), 기존 캔버스 카드 공유 모달 연결(`openLegacyRecapCanvasModal`).
  - **캔버스 이미지 공유 보존**: 기존 캔버스 기반 인스타그램/SNS 공유 기능(`openLegacyRecapCanvasModal`, `generateWeeklyRecapImage`) 100% 무손실 보존.
- `docs/rules/TICKETS.md`: `#TASK-ES-336` 티켓 등록 및 `#TASK-ES-335` 완료 처리.
- `docs/specs/REQ-TASK-ES-336-WEEKLY-RECAP-CARD.md`: 요구사항 정의서 (8원칙 완비).
- `docs/specs/PLAN-TASK-ES-336-WEEKLY-RECAP-CARD.md`: 엔지니어링 작업계획서 (8원칙 완비).
- `reports/TASK-ES-336/claims.json`: 법정 심사용 5대 단언문(C1~C5) 작성.

## [블록 3] 법정 판정서 (GitHub Court)
- (GitHub court 실행 후 업데이트 예정)

## [블록 4] 영향 범위 및 롤백 대책 (Impact & Rollback Plan)
- 영향 범위: 기록 탭(`setTab('records')`, `renderRecordsScreen`), 위클리 리캡 모달(`openWeeklyRecapModal`).
- 롤백 대책: `git revert` 시 기존 이미지 캔버스 생성 중심의 모달로 즉시 원복 가능. 기존 기록 조회, 추가, 필터링 로직은 일체 불변으로 무손실 보존됨.
