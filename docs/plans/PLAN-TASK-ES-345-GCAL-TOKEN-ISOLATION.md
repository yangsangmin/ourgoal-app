# 작업계획서 (PLAN) — #TASK-ES-345 구글 캘린더 토큰 계정 격리 (CAL-02)

> **문서 ID**: PLAN-TASK-ES-345-GCAL-TOKEN-ISOLATION  
> **요구사항 연계**: [REQ-TASK-ES-345-GCAL-TOKEN-ISOLATION](../specs/REQ-TASK-ES-345-GCAL-TOKEN-ISOLATION.md)  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CAL-02  
> **작성 일시**: 2026-10-04  

## 1. 변경 범위

| 파일 | 변경 |
| :-- | :-- |
| `index.html` | 토큰·일정 캐시 uid 격리, 공용 키 정리, 다른 uid 설정 복사 제거, 게스트→회원 1회 이전, 만료·부재 '다시 연결' |
| `scripts/smoke-test.js` | `[#TASK-ES-265]` 검사의 복사 확인 줄을 "복사 없음"으로 교체, `[#TASK-ES-345]` 실행형 검사 추가(index.html 의 실제 함수를 vm 으로 돌림) |
| `docs/design/harness/gcal-isolation-check.js` | 신규 헤드리스 점검(shots-lib `newPage` 재사용) |
| `docs/design/harness/out-gcal-isolation-2026-10-04.json` | 수정 전·후 측정 요약 |
| `docs/specs/REQ-…`, `docs/plans/PLAN-…`, `reports/TASK-ES-345/claims.json`, `docs/rules/TICKETS.md`, `dev_log.md` | 문서 |

손대지 않는 것: `court/**`, `AGENTS.md`, `CLAUDE.md`, `.github/workflows/**`, `scripts/essence-gate.js`, `scripts/verify-integrity-gate.js`, `package.json` scripts, `vercel.json`, `api/track.js`.

## 2. 문제해결 8원칙 체크리스트

- [x] 1. 목표 정의: 같은 기기에서 계정 B 가 계정 A 의 구글 토큰·일정·이메일을 받지 않는다. 같은 계정은 자기 토큰을 그대로 복원한다.
- [x] 2. 현상 분석: `restoreGoogleToken()` `_last`/전체 키 탐색, `saveGoogleToken()` `_last` 쓰기, `loadLocalSettings()` 타 uid 복사, 공용 `ourgoal_gcal_events`, 메모리 토큰 주인 미확인(REQ 1절 표).
- [x] 3. 원인 추정: #TASK-ES-265 재연동 완화용 공용 키·폴백이 계정 경계를 없앴다.
- [x] 4. 대안 탐색: (A) 공용 키에 uid 태그만 붙이고 유지 — 폴백 경로가 남아 복잡. (B) 현재 uid 키만 읽고 공용 키 삭제 + 게스트→회원 명시 이전 + 1탭 재연결 — 채택. (C) 서버 갱신 토큰 보관 — 개인정보 수집 확대라 [결심 필요], 범위 밖.
- [x] 5. 실행 계획: 헬퍼 `purgeLegacySharedGcalKeys`·`gcalCurrentUid`·`gcalEventsKey`·`ensureGcalOwner`·`gcalTokenStatus` 추가 → 읽기/쓰기 경로 교체 → UI `#gcalReconnectBtn`·`#calGcalMiniBadge[data-gcal-state]`.
- [x] 6. 절차 재검증 및 반론 격파: REQ 6절(재연동 악화 반론 → 같은 계정은 M2 로 복원 확인 / 게스트 이전 반론 → 현재 게스트 프로필 키만·1회·삭제).
- [x] 7. 즉시 실행: 구현 후 `gcal-isolation-check.js` 를 수정 전(origin/main)·후에 실행, `npm test` 실행.
- [x] 8. 성과 측정: 요약 JSON 과 `npm test` 종료코드를 PR 본문에 예비 확인으로 옮김(판정은 법정).

## 3. 단계

- [x] [1단계: REQ]
- [x] [2단계: PLAN]
- [x] [3단계: 구현]
- [x] [4단계: 심사 청구]

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
