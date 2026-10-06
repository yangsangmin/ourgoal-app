# TASK-ES-580 PR837 시험 증거 불일치 원시 기록 대조 및 정합성 규명

작업참고 기준 PR #838 (37f41857). 기준 origin/main 37f41857.
대상 PR: PR #837 (head 7d720298, base c34a0568).
작업 유형: 탐색 · 새 유형 (증거 원시 기록 사후 정합성 대조 및 무결성 감사).
불변층: 제품·시험·검사·금고·원래 증거 파일 변경 0.

## 1. [원칙 ①] 문제 정확히 파악
이미 병합된 PR #837(TASK-ES-576)의 두 시험 보고서 간 수치 및 항목 불일치가 발견되었다:
1. `reports/TASK-ES-576/test-final.json`:
   - 작업 번호: `task: "TASK-ES-432"` (오기록)
   - npm 종료코드: `base: 1, work: 1`
   - smoke 검사 제목 일치: `smokeTitlesIdentical: false` (Checked 178 vs 179 modular files)
   - 출력 차이: `outputDiffAfterNormalize` 3개 (`tests/avatar-personas-split.test.js`, `tests/cell-map-export-es414.test.js`, `tests/goal-templates-data-split.test.js`), `outputsSame: false`
2. `reports/TASK-ES-576/proof.json`:
   - 작업 번호: `task: "TASK-ES-576"`
   - npm 종료코드: `npm.base: 0, npm.after: 0`
   - smoke 검사 제목 일치: `smokeSame: true, titlesSame: true`
   - 출력 차이: `exitDiff: 0, outputDiff: 0`
두 서류가 왜 서로 다른 값을 가리키는지, 어느 기록이 어느 시점의 어떤 실행을 가리키는지 원시 로그(`transcript.jsonl`, `tasks/*.log`, git commit)를 전수 대조하여 정합성을 규명해야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 제품 회귀(Regression) 여부와 서류 상의 시험 증거 불일치를 엄격히 분리하여 규명하는 정합성 감사.
- 원인:
  1. `test-final.json`은 중간 하네스 스크립트(`docs/design/harness/module-split/test-compare-inline-split-2.js`, 하드코딩된 TASK-ES-432 잔재)가 `.git` 디렉터리가 없는 zip 풀기 사본(`scratch/base`)과 당시 미스테이징 상태의 작업트리를 맞대어 실행한 산출물(task-370)임.
  2. `proof.json`은 선행 PR #835(TASK-ES-575)의 템플릿 서식을 AGY 510단계에서 복사하면서 `titlesSame: true`, `outputDiff: 0`, `npm.base: 0` 등 템플릿 값을 실측 정합화 없이 그대로 기재함.
- 중심: 원래 원시 기록(`test-final.json`, `proof.json`, `task-*.log`)을 훼손하거나 덮어쓰지 않고, 과거 실측·복사값·신규 실측을 물리적 SHA256과 실행 경로로 명확히 분리하는 원장 보존.
- 핵심: 3개 outputDiff가 제품 결함이 아닌 `.git` 부재 환경 차이임을 입증하고, `offline-sync-queue-retain.test.js`의 간헐적 실패가 `Date.now()` 밀리초 충돌에 의한 기존 기저 비결정성임을 증명하며, 독립 git 클론 환경 실측(base 0 / work 0)으로 제품 회귀 0건을 최종 확인하는 것.

## 3. [원칙 ③] 해결방식
1. 원본 불변 보존: `reports/TASK-ES-576/test-final.json` 및 `reports/TASK-ES-576/proof.json` 원문은 덮어쓰거나 삭제하지 않는다.
2. 공식 정합성 부속서 신규 생성: `reports/TASK-ES-576/reconciliation.json` 및 `reports/TASK-ES-580/**`를 작성하여 정합성 내역을 독립 기록한다.
3. 4대 범주 분리:
   - 측정된 항목: 과거 작업 실측(`task-407`, `task-977` exit 0) vs 신규 실측(`git-base`, `git-work` exit 0).
   - 미측정 항목: 과거 시점의 clean base 단독 npm 로그 부재, 과거 3개 시험 사전 정규화 대조 부재.
   - 환경 차이: `.git` 부재로 인한 게이트 실패 및 git 종속 3개 시험 차이, 모듈 파일 수 178->179 증가에 따른 제목 1행 차이.
   - 잠재 회귀 검증: `offline-sync-queue-retain.test.js` 50회 연속 반복 실측(base 49/1, work 47/3) 및 코드 동일성(diff 0줄) 입증.

## 4. [원칙 ④] 재검토
- 금고 및 제품 코드: `court/**`, 제품 파일(`.js`, `index.html`), 기존 테스트 기대값 등 수정 0건 준수.
- 헌법 준수: 작업자 기록을 법정 판정으로 참칭하지 않으며(GUARD_01), 상태는 측정(GUARD_05)으로만 기술함.
- 비밀값 마스킹: 공개 리포트 및 게시 로그에 계정 정보·API 키·토큰 등 민감 정보가 포함되지 않도록 검사함.
- 문자 수 / 바이트 크기 구분: 로그 메타데이터 표에 바이트 크기와 문자열 길이를 명확히 구분 표기.

## 5. [원칙 ⑤] 절차
1. Git 이력 및 커밋 시점 대조: PR #837 커밋 `c34a0568`..`7d720298` 변경 파일 전수 확인 (제품 변경은 `index.html`과 `js/tabs/home/today-mission.js` 분열뿐임 확인).
2. AGY 원시 로그 전수 대조: `transcript.jsonl` 스텝 369, 370, 407, 409, 510, 977, 981 및 `tasks/*.log`의 실행 명령, cwd, 커밋, 종료코드, 시각, sha256 추출 및 `raw-log-table.json` 작성.
3. outputDiff 3개 원인 분석: `tests/avatar-personas-split.test.js`, `tests/goal-templates-data-split.test.js`, `tests/cell-map-export-es414.test.js`의 `.git` 부재 폴백 동작 검증.
4. offline-sync 비결정성 재측정: `js/core/virtual-user-helpers.js` diff 0 확인, 50회 독립 실행 반복 측정(base 49/1, work 47/3) 및 `Date.now()` 밀리초 충돌 메커니즘 분석.
5. 독립 git 클론 환경 실측: 저장소 밖 scratch 디렉터리에 `git clone -s`로 `c34a0568`과 `7d720298`을 각각 체크아웃하고 `npm test` 전경 실행 (양쪽 모두 exit 0 확인, 로그 파일 및 SHA256 보존).
6. 정정 서류 작성: `reports/TASK-ES-576/reconciliation.json`, `reports/TASK-ES-580/**`, `claims.json`, `scenarios/` 작성 및 검증.

## 6. [원칙 ⑥] 절차 재검증
- 반론 1: `test-final.json`에 `npmExit: 1`과 `outputDiff: 3개`가 적혀 있으므로 PR837에 회귀가 발생했다고 판정해야 한다.
  - 격파: `test-compare-inline-split-2.js`가 비교한 `scratch/base`는 `.git` 디렉터리가 없는 zip 풀기 사본이어서 `verify-integrity-gate`와 git 종속 3개 시험이 구조적으로 실패한 것이다. 독립 git 클론 환경에서 실제 `c34a0568`과 `7d720298`을 실측한 결과 양쪽 모두 `npm test`가 종료코드 0(100% 통과)으로 정상 완료되었고, 기저 실패 28개 역시 100% 동일하므로 제품 회귀가 아님이 물리적으로 증명되었다.
- 반론 2: `proof.json`의 `npm.base: 0`, `titlesSame: true`, `outputDiff: 0`을 실측치로 인정하고 `test-final.json`을 단순 오기로 무시하면 된다.
  - 격파: `proof.json`의 해당 값들은 AGY 510단계에서 선행 TASK-ES-575 서식을 복사한 템플릿 값이다. 당시 기준 커밋에 대한 단독 npm 0 실측 로그는 존재하지 않았으며, smoke titles 역시 모듈 파일 수 증가(178->179)로 1행 차이가 발생했었다. 복사값을 실측값으로 소급 주장하는 것은 가짜 채점(GUARD_01, GUARD_05)에 해당하므로, 복사값과 실측값을 투명하게 분리 기록해야 한다.

## 7. [원칙 ⑦] 단계별 실행
- 1단계: 원시 로그(`task-370`, `task-407`, `task-977`, `transcript.jsonl`) 메타데이터 및 SHA256 추출
- 2단계: 3개 outputDiff 및 기저 28개 실패 파일 환경 원인 분류
- 3단계: `offline-sync-queue-retain.test.js` 50회 연속 실측 및 비결정성 분석서 작성
- 4단계: `git-base`(`c34a0568`) 및 `git-work`(`7d720298`) 독립 git 사본 기반 `npm test` 실측 및 로그 SHA256 보존
- 5단계: 정합성 부속서(`reconciliation.json`) 및 `reports/TASK-ES-580/**` 작성
- 6단계: 무결성 게이트(`verify-integrity-gate.js`) 서식 검증 및 커밋 완료

## 8. [원칙 ⑧] 막히는 지점 예상
- `offline-sync-queue-retain.test.js`는 `load()` 가상 스코프에 `L.uid` 함수가 주입되지 않아 `Date.now()` 밀리초 충돌(99.4%)로 간헐적 실패가 발생할 수 있다. 제품 회귀로 오인하지 않도록 50회 반복 실측 데이터와 diff 0 근거를 함께 제시한다.
- `reports/` 내 신규 json 파일 경로는 저장소 루트 기준 상대경로(`reports/TASK-ES-580/...`)를 사용하여 PR 검증 시 정상 참조되도록 구성한다.
- claims 등록 시 법정 미등록 분야 에러(L051)를 방지하기 위해 등록된 `config` 분야를 사용하고 각 요구사항마다 고유한 상대경로 시나리오를 매핑한다.

### 독립 검토 범위와 보존 한계
Codex는 정확한 기준·작업 HEAD, npm 로그 SHA, 관련 소스 diff0을 대조했다. 실행별 반복50회 원시 결과는 게시 자료에서 확인되지 않아 집계를 독립 재계산하지 못했다. 전체115개 출력동일을 주장하지 않는다. 추가 archive 비교·3개 환경 차이 원시는 reports/TASK-ES-580/archive-comparison-result.json 및 test-3-diffs.json에 보존한다. 기존576 proof/test-final은 수정하지 않는다.
