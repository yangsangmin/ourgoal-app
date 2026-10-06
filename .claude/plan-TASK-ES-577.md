# TASK-ES-577 작업계획서: 생성지도 저장본 일괄 갱신 (PR #837 반영)

- 기준 PR: #837 (0b8cda96fad7e057ffcd20db1c7044799bd73d29)
- 작업 브랜치: `codex/task-es-577-map-batch`
- 작업 트리: `C:/Users/HP/.codex/worktrees/agy-maps-577/ourgoal-app`
- 작업 유형: L009 · L034 표준 기계 실행 (생성지도 일괄 갱신)
- 목표: PR #837까지 반영된 생성지도 저장본 갱신 (제품 동작 변경 0)
- 허용 변경 대상:
  - `docs/architecture/module-baseline.json`
  - `docs/architecture/cell-map.json`
  - `docs/architecture/inline-script-map.json`
  - `docs/architecture/INLINE-SCRIPT-MAP.md`
  - `.claude/plan-TASK-ES-577.md`

## 5단 추론 요약
- **이해**: PR #837(0b8cda96)까지의 세포 분열 작업으로 인해 변경된 코드베이스의 아키텍처 지도(모듈 기준선, 세포 지도, 인라인 스크립트 지도) 저장본을 최신 상태로 일괄 동기화한다. 제품 코드·테스트 코드 변경은 0건이어야 한다.
- **분류**: (가) 표준 기계 실행 (L009, L034). 기존 합의된 스크립트 도구 3종을 통한 기계적 재생성 및 래칫 기준선 하향 조정.
- **예상위험**: 스크립트 실행 중 시간 필드(generatedAt 등) 변동 외 비결정론적 diff 발생 가능성, module-guard 기준선 상승 시도 오류, 훅 실패(NODE_PATH 누락 등).
- **반론 2개 및 격파**:
  1. *반론*: "기존 파일의 diff를 줄이기 위해 생성기를 통하지 않고 손으로 일부 수치만 수정하는 것이 안전하다."
     *격파*: 손 편집은 엄격히 금지되며(L023), 스크립트 정본 파이프라인의 무결성을 깨뜨린다. 오직 공인 스크립트 3종의 출력만 그대로 반영해야 한다.
  2. *반론*: "결정론 검증 시 생성 시각(timestamp) 필드가 매번 달라지므로 완전 일치 검증이 불가능하여 검증을 생략해야 한다."
     *격파*: 시간 필드(`generatedAt` 등)만 명시적으로 제외하고 나머지 모든 AST/의미론적 필드를 100% deepStrictEqual로 대조하여 결정론을 엄격히 증명할 수 있다. (실측 결과 git commit 기반으로 완전 동일 바이트 매치 확인)
- **선택**: 지정된 순서(`module-guard.js --update` -> `cell-map-export.js` -> `inline-script-map.js --write`)로 1차 생성 후, 동일 명령 2차 재실행으로 시간 외 결정론을 검증하고, 검사 스크립트 3종 및 `npm test` 전경 실행으로 무결성을 입증한 뒤 정상 훅으로 단일 커밋한다.

## 단계별 체크리스트
- [x] 1. 작업 전 git 상태·HEAD(0b8cda96)·설정 확인 및 기록 완료 (`01_preflight.txt`)
- [x] 2. 5단 추론 및 작업계획서 작성 (`02_reasoning.txt`, `.claude/plan-TASK-ES-577.md`)
- [x] 3. 생성 전 npm test 전경 실행 및 원시 결과/로그 보존 (`03_npm_test_pre_clean_utf8.log`, exit code 0)
- [x] 4. 생성 스크립트 3종 순차 실행 (module-guard --update, cell-map-export.js, inline-script-map.js --write)
- [x] 5. 생성 4개 파일 재실행 및 결정론 비교 검증 (`05_determinism_comparison.json`, 4개 파일 모두 byte/semantic 100% 동일)
- [x] 6. 검사 스크립트 3종 및 npm test 전경 실행 검증 (`06_verify1~4.log`, 전수 exit code 0 통과)
- [x] 7. 제품·시험·금고 변경 0건 및 허용 목록 외 변경 0건 검증 (Codex 작업 서류 분리 확인)
- [x] 8. 계획서 완료 항목 반영 및 정상 훅 단일 커밋 완료

## 측정 완료 기준 (실측치)
- git status 변경 파일: 허용 5개 파일 외 제품/시험/금고 변경 0건
- 제품(`js/**`, `index.html`), 테스트(`tests/**`), 금고(`court/**`, `AGENTS.md` 등) diff: 0건
- 생성기 재실행 시 4개 파일 diff: 0 bytes (100% 완전 일치)
- `node scripts/module-specs.js --check`: 종료 코드 0 (경고 9건 기존 유지)
- `node scripts/module-guard.js`: 종료 코드 0 (① 5942, ② 71, ③ 260, ④ 0, ⑤ 0)
- `node scripts/inline-script-map.js --check`: 종료 코드 0 (묶음 130, 대상 59, IIFE 5920줄, 함수 46, window 206)
- `npm test` 전경 실행: 종료 코드 0 (13개 통과, 0개 실패)
- 커밋 훅: 정상 훅 검증 통과 (no-verify 미사용)

## 예상 장애 및 대응 결과
- `NODE_PATH` 미설정 방지: `$env:NODE_PATH='C:/dev/ourgoal-app/node_modules'` 일관 적용
- git config 변경 방지: 읽기 전용 조회만 수행
- 로그 인코딩: UTF-8 일관 적용 및 검증 완료
