# TASK-ES-585 전문 템플릿 기록 상세 모달·딥링크 책임 원문 분열

작업참고 기준 PR #842 (66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9). 기준 origin/main 66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9.
표준 분열(L001·L002·L005·L006·L015·L016·L019·L021·L009).

## 1. [원칙 ①] 문제 정확히 파악
index.html의 인라인 IIFE 내 `템플릿 마켓 · 복제 · 전문 템플릿 기록` 구획에 위치한 전문 템플릿 기록 상세 모달 조회 함수 `openTemplateRecordDetailModal`(7289~7411줄, 123줄)과 URL 해시 딥링크 탐지 함수 `checkRecordDeepLink`(7414~7428줄, 15줄)를 `js/tabs/records/template-record-detail.js` 독립 책임 세포로 분열해야 한다.
- `openTemplateRecordDetailModal(record)`: 템플릿 키/ID 기반 컬럼 및 행 조회, 헤더 배지/날짜/항목수 표시, AI 코치/Notion/수정 버튼, 분석 요약 HTML, 기간별(7일 등) 추이 SVG 차트, 툴팁 및 필터 칩 이벤트 바인딩, 행 테이블 렌더링, 사진 표시, 캘린더 연계 버튼, 모달 닫기 이벤트 배선.
- `checkRecordDeepLink()`: `window.location.hash`의 `#record=<id>` 또는 `#record:<id>` 패턴을 정규식으로 탐지하여 해당 레코드 조회 후 모달 호출.
- 두 함수를 제외한 구획의 모든 다른 함수, 상수, 이벤트 등록(`window.addEventListener('hashchange', checkRecordDeepLink)` 등)은 `keepRest: true`로 원래 자리에 그대로 둔다.
- `Vision/quota/market/credit/944줄/빠른목표추가` 혼입 금지. 목표 빠른추가 진입은 숨김 여부 미측정 상태이며 본 작업 범위 밖이다.
- 새 기능 추가·기존 결함 수정·원문 압축은 일절 금지하며 기계적 생성기(`gen-inline-hard.js`)만 실행하여 손 수정 0을 엄수한다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 동작 100% 동일 보존, 무손실 원문 세포 분열.
- 원인: 거대 인라인 IIFE에 집중된 기록 상세 조회 모달 및 딥링크 탐지 책임을 독립 세포로 분리하여 유지보수성과 모듈성을 확보.
- 중심: `OurgoalUiHelpers`(`_uiKit`) 키트 통째 대입 보존, 슬롯 `HO`, `afterTag: <script src="js/core/ui-helpers.js"></script>` 뒤에 배치하여 키트 객체 덮어쓰기 영구 방지.
- 핵심: AST 수준에서 토큰 동일성(동일 토큰 수, 0 잔여 차이), 누수 0, 최상위 this/arguments 0, 새 전역 0, 새 파일 800줄 이하를 달성하고, 실제 브라우저 게스트 UI 조작 2+1회(base1, base2 vs after) 및 CDP 계측, #record:<id> 딥링크 실제 브라우저 탐색 계측으로 입증.

## 3. [원칙 ③] 해결방식
`docs/design/harness/module-split/inline-record-detail585.json` 설정과 기존 `gen-inline-hard.js` 스코프 분석 생성기만을 사용하여 기계적으로 분열한다.
- `openTemplateRecordDetailModal` -> `js/tabs/records/template-record-detail.js`
- `checkRecordDeepLink` -> `js/tabs/records/template-record-detail.js`
- 구획 내 잔여 코드: `keepRest: true` 유지
- 슬롯: `HO`
- 키트: `OurgoalUiHelpers`, 키트 변수: `_uiKit`
- `afterTag`: `<script src="js/core/ui-helpers.js"></script>`

## 4. [원칙 ④] 재검토
- `verify-inline-hard.js`를 통해 토큰 동일(접두 제외), 덩어리 줄 동일, 잔여 동일, 누수 0, setter 누락 0, this/arguments 0, 800줄 이하 검증.
- `js/tabs/records/template-record-detail.js`: 180줄 내외 (800줄 이하 완비).
- `window.addEventListener('hashchange', checkRecordDeepLink)`가 중복 등록되지 않고 `index.html` 원본 자리에 1개만 잔류하는지 확인.
- `js/core/ui-helpers.js`가 `global.OurgoalUiHelpers = OurgoalUiHelpers;`를 수행하므로, 반드시 그 뒤에 위치하여 속성을 확장하도록 보장.

## 5. [원칙 ⑤] 절차
1. 원본 기준사본 보존 (git archive SHA: 66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9).
2. `inline-record-detail585.json` 설정 기반 `gen-inline-hard.js` 실행으로 세포 파일 생성 및 `index.html` 수정.
3. `verify-inline-hard.js` 실행하여 토큰/스코프/누수 정밀 무결성 검증.
4. `scripts/module-specs.js --write` 실행하여 `modules.json` 코드칸 갱신 및 `cell-descriptions.json` 설명 등록.
5. 단독 로드 탐침(`court/probes/module-load.js`)으로 원본 및 신규 세포 회귀 0 측정.
6. 실제 브라우저 게스트 UI 하네스 2회(base1, base2) vs 작업 1회(after) 실행 (게스트 둘러보기 → 인사닫기 → 기록탭 → recQuickDockBar '📋 템플릿' 토글 → recOpenProTemplateBtn → 행 입력 → proGeneralSaveBtn → 생성된 기록카드 클릭 → 상세모달 열기/닫기/차트기간/수정·취소, #record:<id> 브라우저 해시 딥링크 실제 탐색).
7. 표준 `tab-check` 2+1 비교.
8. npm test 및 115개 전체 개별 시험 전후 비교.
9. `evidence-manifest.json`, `check-evidence.cjs`, `claims.json`, `proof.json` 작성 및 정상 커밋.

## 6. [원칙 ⑥] 절차 재검증
- 반론 1: `js/core/ui-helpers.js`가 전역 `OurgoalUiHelpers` 객체를 리터럴 대입(`global.OurgoalUiHelpers = OurgoalUiHelpers;`)으로 초기화하므로 새 세포가 먼저 실행되면 속성이 지워질 수 있다.
  - 격파: 브리프 설정의 `afterTag`가 `<script src="js/core/ui-helpers.js"></script>`로 지정되어 새 세포 태그가 반드시 `ui-helpers.js` 바로 뒤에 삽입된다. 따라서 새 세포는 이미 초기화된 `OurgoalUiHelpers`에 안전하게 함수를 추가한다.
- 반론 2: URL 해시 딥링크 `#record:<id>`는 브라우저 전역 `hashchange` 이벤트와 결합되어 있으므로, 세포 이전 시 리스너가 중복 등록되어 모달이 중복 호출될 수 있다.
  - 격파: `inline-record-detail585.json`에서 `take.names`에 함수 선언(`openTemplateRecordDetailModal`, `checkRecordDeepLink`)만 지정하고 `keepRest: true`를 적용하여, `window.addEventListener('hashchange', checkRecordDeepLink)`는 원래 자리인 `index.html`에 단 1개만 남는다. IIFE 스코프 상단에서 `var checkRecordDeepLink = _uiKit.checkRecordDeepLink;`로 가져오므로 이중 등록 없이 완벽히 동작한다.

## 7. [원칙 ⑦] 단계별 실행
- 1단계: 인계 및 기준 동기화, archive 보존, task-link 확인(root 담당), REQ 작성 및 무결성 게이트 검사 통과.
- 2단계: `inline-record-detail585.json` 설정 기반 `gen-inline-hard.js` 실행 및 신고서 갱신.
- 3단계: `verify-inline-hard.js`, `module-load.js` 정적/로드 검증.
- 4단계: 실제 UI 게스트 하네스 2+1, CDP 호출수/분기 계측, DOM/스토리지 불변성 검증, 탭 하네스 비교, 전체 시험 비교.
- 5단계: 결과 리포트 및 claims 작성, evidence-manifest 검증, 정상 훅 커밋 완료.

## 8. [원칙 ⑧] 막히는 지점 예상
- 게스트 환경에서 전문 템플릿 저장 시 AI 프로 코치 분석 또는 Notion 내보내기 버튼은 외부/유료 네트워크 전송 대상이므로 클릭하여 가짜 성공을 만들지 않고 미측정(unmeasured)으로 분리한다.
- 날짜 생산식 검증: 전문 템플릿 저장 전 모달의 `#proRecDate` 마크업 입력값과 저장 후 `startAt`의 `new Date(schedDateVal).toISOString()` 생산식 관계를 3회 실행(base1, base2, after) 전수 오프라인 검증하고, 동일 연도 내 일 변조(sameYearDayTamper)에 대한 감도 카나리를 완비한다.
- seed 검증 한계: `manito-basics`의 `manitoState` 최초 접근 시 `Math.floor(Math.random()*100000)` 난수는 원시 데이터 내에 정확 난수 독립 앵커가 부재하므로 미측정(unmeasured)으로 분리·유지한다.
- 브라우저 URL 딥링크 계측 시 `dispatchEvent`나 직접 호출 대신 실제 `page.evaluate(() => { window.location.hash = '#record:' + id; })` 또는 `page.goto(url + '#record:' + id)`로 탐색하여 실제 hashchange 이벤트를 계측한다.
- 외부 API 호출 실패에 대한 안전 처리: Supabase 웹소켓 미연결 등 기존 로컬 환경 콘솔 에러는 기준과 작업에서 동일하게 관찰되며 새 에러가 0개임을 검증한다.
