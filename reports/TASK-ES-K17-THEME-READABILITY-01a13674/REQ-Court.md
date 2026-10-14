# 원077: 확정 기록 안내와 네 테마 표시

공통 TASK-CC-CELL-UNWIRE-RUN-309dca5d. 작업참고 기준 PR984. 제품 source57f5a11c, 기준 e176ccb9. 원승인: 결심 기록.md SHA7018f6c1a6ee0cddefad9f67517e1f8d71502218dbf3730e47522d62f6d806d4, D-2026-10-13-01 L94 마9 및 D-2026-10-13-02 L115 바9. 문구는 「기록하고 나의 역사데이터를 만들어요.」, 고정 50% 제약은 후속 바9에서 해제됐다.

## ① 파악
R077_TEXT: 초기 HTML 및 세 runtime writer의 안내를 확정 문구로 일치시키고 빈칸/입력/삭제 행동을 보존한다. R077_READ: focus-sanctuary/black/white/urban-city의 안내를 읽기 좋게 표시한다. 해당 DOM은 #captureInput::placeholder다.
## ② 본질·원인·중심·핵심
본질은 빈 기록 입력에서 확정 안내를 읽는 것이다. 원인은 index.html, renderFirstCheckinTutorialBanner, bindCaptureSave의 익명 click handler, applyQuickCunningText가 서로 다른 placeholder를 쓰는 배선이다. 중심은 같은 입력칸이고 핵심은 문구 일치와 테마별 표시다.
## ③ 해결방식
index.html 및 js/tabs/records/{first-checkin-tutorial,checkin-capture,checkin-helpers}.js의 네 대입만 변경했다. ui.css 말미의 네 테마 한정 pseudo 규칙은 --ink-soft와 opacity 1을 사용한다. 실제 대비/PNG의 관측 층과 공식 법정 측정을 분리한다.
## ④ 재검토
기존 value·dispatch·focus·칩 선택·저장 세대/락·기기/서버 순서·XP·DTO·기존 값은 바꾸지 않는다. source 보존 측정과 최초 실패를 보존한다. 칩·컨디션·역할 삭제, MASTER와 규범 개정은 이번 범위가 아니다.
## ⑤ 절차
원문/source 고정→다섯 제품 최소 수정→작성자 정상 guest 관측→별도 독립 네 테마 관측→세 old text expectation 정합→필수 네 스크립트와 모듈 검사→정식 claims/PR/법정 순서다. source/실제 PC/공식 판정/운영은 서로 대체하지 않는다.
## ⑥ 절차 재검증
반론1 검사 교정으로 제품 오류를 숨긴다: 변경은 승인 문구와 충돌한 세 텍스트 기대뿐이며 원 check명·단언 개수·부정 value-injection을 유지했다. 반론2 guest 관측으로 모든 writer를 실제 실행했다고 부른다: 새 quickchip/guest 저장은 별도 법정 행동 시나리오로, 신규 계정 tutorial은 needs-login으로 분리했다. 시각 품질은 visual-quality 도구 한계로 분리한다.
## ⑦ 단계별 실행
claims.json의 네 테마, 실제 칩 클릭, 일시적 guest 기기 저장 시나리오는 기존 UI로만 조작한다. 프로필/DOM/함수 주입·새 fixture·원격 게시·SQL·실계정 쓰기는 없다. guest 저장의 /api/feedback POST 가능성을 API0으로 표시하지 않는다. 실제 backend가 없는 법정 static origin과 운영 전송을 구분한다.
## ⑧ 막힐 지점 예상
법정의 외부 차단 때문에 실제 로그인 온보딩/원격 저장은 잴 수 없다. pseudo의 시각 품질은 DOM computed style 하나로 단정하지 않는다. 첫 실패/독립 의견과 교정 확인을 보존하며, 공식 판정·운영 사용·전체 요구·효과는 확인 전 null이다.
