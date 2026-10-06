# TASK-ES-584 공통 작업학습 연결 도구

기준: WORK-REFERENCE PR #841. 탐색 유형: 정본 경험칙·동반작업·증거 제출 방식을 차용하되 기존 원장과 규범은 변경하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악
보완점을 기록해도 다음 지시서·검사기로 연결되지 않아 반복된다. AUD119 검증 스크립트 부재, AUD121 재발, AUD212 CI=완료 오인, AUD214 공유 트리 충돌이 조사 근거다. 새 도구의 검사 실물과 원시 로그를 제출한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질: 읽기와 반영은 다르다. 원인: 경험칙·브리프·검사·측정 입력의 연결이 없다. 중심: 정본을 교체하지 않는 연결 registry. 핵심: 전체 정본 readReceipt와 appliedLessons를 별도로 검사한다.

## 3. [원칙 ③] 해결방식
docs/agents/shared-learning/registry.json은 발견 참조다. docs/design/harness/shared-learning/cli.js의 bootstrap, validate, collect는 Node builtin만 사용한다. bootstrap은 명령을 실행하지 않는다. 도구명에서 권한을 추론하지 않고 participants.allowedActions를 그대로 표시한다. DOM ID: 해당 없음(앱 화면 변경 0).

## 4. [원칙 ④] 재검토
lessons.json·WORK-REFERENCE.md·노션 기존 정본 수정 0. 원시 증거 변경 0. 새 수집은 task별 파일과 exclusive lock, source hash CAS를 쓴다. fixture는 이 도구의 단위검사 입력이며 제품 E2E 가짜 데이터가 아니다.

## 5. [원칙 ⑤] 절차
전체 원천을 읽고 해시 기록 → 공통 계약·adapter·경험칙·최근 보완점을 brief 연결 → 이벤트 필수 필드·실제 파일·SHA·입력·scope 검사 → 제안만 직렬 수집 → 실제 CLI 두 공동조합·실패 케이스 → 정상 훅 PR → 독립 법정.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
반론1: 브리프가 전체 읽기를 대체한다. 격파: 전체 WORK-REFERENCE 영수증을 필수로 유지하고 사용자 읽기는 여전히 필요하다. 반론2: measured나 exitCode 0이면 품질 승인이다. 격파: measurementOnly=true와 courtUrl 분리, 필수 확인 누락은 오류, 제품 판정은 도구가 내리지 않는다.

## 7. [원칙 ⑦] 단계별 실행
소유 파일: docs/agents/shared-learning/**, docs/design/harness/shared-learning/**, reports/TASK-ES-584/**, 자기 REQ/plan·dev_log/TICKETS 행. validateEvent·bootstrap·collectEvent 함수. 기존 제품·시험·Court·헌법·금고 변경 0. 전체 경로·해시 대조와 다른 TASK after 오사용·중복/CAS 충돌을 실행한다.

## 8. [원칙 ⑧] 막히는 지점 예상 및 성과 측정
정본 갱신은 stale 표시와 CAS 차단. 없어진 증거·다른 head after·잠금 경합은 실패 로그로 보존. 효과는 다음 같은 유형 5건, 반복 결함 0·증거 불일치 0으로 후속 측정; 아직 표본이 없어 개입·품질 개선은 null. 공통3회/adapter2회 승격 충돌은 proposal만, 자동 승격 0. 법정 판정 전 완료/제품 안전 선언 0.
