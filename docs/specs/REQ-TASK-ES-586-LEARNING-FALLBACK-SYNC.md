# TASK-ES-586 fallback 참고 사본과 생성지도 동기화

기준 WORK-REFERENCE PR #842, origin/main 66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9. 표준: L009/L024 생성지도 일괄갱신 및 사본 동기화. 앱 세포 변경 없음, DOM ID 해당 없음.

## 1. [원칙 ①] 문제 정확히 파악
저장소 fallback은 헤더와 실제 원장 수·내용이 다르고 절대 런타임 안내가 없다. 현재 정본을 byte 복사하고 실제 fallback 실행으로 확인한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질: 새 세션의 발견 경로가 정본 없는 경우에도 이어져야 한다. 원인: 저장소 사본 갱신 지연. 중심: 원문 history 보존과 최신 사본. 핵심: ID/versionHash/출처PR/확인횟수 대조 및 fallback readReceipt.

## 3. [원칙 ③] 해결방식
docs/agents/lessons.json·WORK-REFERENCE.md·reference-meta.json을 로컬 정본에서 복사한다. 기존 파일은 git show의 LF byte 그대로 docs/agents/history에 보존한다. README에 C:/dev/agent-knowledge/shared-learning.js 절대 고정 entry를 안내한다. 정본 부재는 reports/TASK-ES-586의 임시 registry 복제본으로 재현한다.

## 4. [원칙 ④] 재검토
정본 원장·runtime·노션·헌법·금고·제품·기존시험 변경0. 레지스트리 실제설정은 수정하지 않는다. 원래 없는 meta는 부재로 기록하며 만들었다고 역사에 쓰지 않는다. 앱 신고서는 check만 한다.

## 5. [원칙 ⑤] 절차
history byte snapshot → sourceHash 확인·사본 복사 → ID별내용 대조 → 임시 registry canonicalRoot unavailable+fallback repoRoot로 bootstrap → module-guard --update 낮추기만 → cell-map-export → inline-script-map --write 후 두 번 재생성 SHA 대조 → npm test → PR → Court artifact.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
반론1: 덮어쓰면 옛 원장이 사라진다. 격파: Git원문byte history와 SHA를 보존한다. 반론2: 헤더수만 맞추면 충분하다. 격파: 실제배열의 모든 ID/versionHash/PR/확인횟수를 대조하고 canonical 없는 실행에서 fallbackReceipt를 읽는다.

## 7. [원칙 ⑦] 단계별 실행
대상 함수 bootstrap/ sourceSnapshot은 기존 installed CLI 사용만, 수정0. 파일은 docs/agents 사본/history/README와 생성기 산출 지도만이다. script 실행 원시·input/source commit·hash는 reports/TASK-ES-586에 기록한다. dev_log/TICKETS는 자기 행만 추가한다.

## 8. [원칙 ⑧] 막히는 지점 예상 및 성과 측정
정본 갱신경합·main 이동·줄끝 차이는 hash/실제원문 비교로 분리한다. 생성물의 시각필드가 있으면 그 차이를 명시하고 나머지 구조/hash를 대조한다. npm·worker검사는 주장이고 독립Court가 판정한다. 효과 개선은 다음 해당유형 실제표본까지 null이다.
