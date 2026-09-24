# 작업계획서 (PLAN) — 제미나이 API 중앙 게이트웨이 일원화 및 복원력 구축

> **문서 ID**: PLAN-TASK-ES-251-GEMINI-RESILIENCE  
> **티켓 연계**: #TASK-ES-251  
> **요구사항 연계**: [REQ-TASK-ES-251-GEMINI-RESILIENCE](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-251-GEMINI-RESILIENCE.md)  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: `C:\Users\HP\AGENTS.md` (아워골 최고 헌법 제2조 2회차 PLAN 8원칙 엄수)  

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **핵심 목표**:
  - `api/lib/gemini-gateway.js` 신설을 통한 중앙 일원화.
  - Multi-Key 로테이션, 3-State 서킷 브레이커, 4초 Strict Timeout, 정식 모델 캐스케이드, SHA-256 캐시, 자기치유 JSON 파서, 100% 오프라인 온톨로지 엔진 통합.
  - 기존 8개 엔드포인트의 중복 코드 소탕 및 `api/feedback.js:204`의 `endpoint is not defined` 런타임 버그 제거.
- **영향받는 파일 전수 목록**:
  1. `api/lib/gemini-gateway.js` (신규 생성: 코어 게이트웨이)
  2. `api/feedback.js` (리팩토링: 버그 제거 및 게이트웨이 연결)
  3. `api/goaltemplate.js` (리팩토링: 3대 분기 게이트웨이 연결)
  4. `api/todaymission.js` (리팩토링: 게이트웨이 연결)
  5. `api/goalstatus.js` (리팩토링: 게이트웨이 연결)
  6. `api/goalagent.js` (리팩토링: 게이트웨이 연결)
  7. `api/nextaction.js` (리팩토링: 게이트웨이 연결)
  8. `api/promptgen.js` (리팩토링: 게이트웨이 연결)
  9. `api/vision-table.js` (리팩토링: 게이트웨이 연결)
  10. `tests/gemini-gateway.test.js` (신규 생성: 단위 테스트 슈트)
  11. `docs/rules/TICKETS.md` (티켓 등록)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 및 배선(Wire) 식별

- **[본질] (Essence)**:
  - 외부 Gemini API의 429 레이트 리밋과 504 타임아웃에 좌우되지 않는 완벽한 무중단 서비스 연속성 확보.
- **[원인] (Root Causes)**:
  - 8개 엔드포인트의 개별 하드코딩 분산, 429 처리 시의 ReferenceError 폭사 버그, 타임아웃 부재, 캐시 및 서킷브레이커 결여.
- **[중심] (Core Bottleneck)**:
  - 단일 중앙 게이트웨이(`api/lib/gemini-gateway.js`)로 모든 Gemini 호출 인터페이스를 단일화하고 호출부 단축.
- **[핵심] (Critical Anchor)**:
  - 장애 상황에서도 100% 무손실 200 OK를 보장하는 로컬 온톨로지 폴백 체계 및 유저 입력 텍스트 보존.

- **데이터 흐름 다이어그램 (End-to-End)**:
  ```
  클라이언트 요청 (POST /api/feedback, /api/goaltemplate 등)
        │
        ▼
  엔드포인트 핸들러 ──► callGeminiGateway({ task, prompt, responseSchema, localFallback })
        │
        ├─► [1] 캐시 확인 (SHA-256 Hash Key) ── (HIT) ──► 즉시 캐시 데이터 반환 (0ms)
        │
        ├─► [2] 서킷 브레이커 상태 점검
        │       ├─ OPEN 상태 (최근 3회 연속 실패) ──► 즉시 localFallback() 실행 (0ms)
        │       └─ CLOSED / HALF-OPEN ──► 다음 단계 진행
        │
        ├─► [3] Multi-Key Pool 로드밸런서
        │       └─ Key A (쿨다운 중이면 B, C 순환)
        │
        ├─► [4] 공식 모델 캐스케이드 (2.0-flash ➜ 1.5-flash ➜ 1.5-flash-8b)
        │       └─ AbortSignal.timeout(4000) 장착
        │
        ├─► [5] 결과 수신 및 자기치유 JSON 파싱
        │       ├─ 성공: 캐시 저장 ➜ 반환
        │       └─ 실패/429/타임아웃: 키 쿨다운 등록 ➜ 모델 강등 ➜ 서킷 실패 카운트 증가
        │
        └─► [최후의 보루] 모든 원격 시도 실패 시 localFallback() 안전 실행 ➜ 200 OK 보장
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 | 변경 유형 | 예상 추가 | 예상 삭제 | 핵심 변경 내용 |
|---|---|---|---|---|
| `api/lib/gemini-gateway.js` | 신규 | +350 | -0 | 코어 게이트웨이 모듈 (서킷브레이커, 캐시, 파서, 폴백) |
| `api/feedback.js` | 수정 | +25 | -50 | `endpoint is not defined` 버그 제거, 게이트웨이 배선 |
| `api/goaltemplate.js` | 수정 | +40 | -120 | 3대 분기 게이트웨이 단일화 |
| `api/todaymission.js` | 수정 | +20 | -40 | 게이트웨이 단일화 |
| `api/goalstatus.js` | 수정 | +20 | -35 | 게이트웨이 단일화 |
| `api/goalagent.js` | 수정 | +25 | -45 | 게이트웨이 단일화 |
| `api/nextaction.js` | 수정 | +20 | -35 | 게이트웨이 단일화 |
| `api/promptgen.js` | 수정 | +20 | -35 | 게이트웨이 단일화 |
| `api/vision-table.js` | 수정 | +20 | -35 | 게이트웨이 단일화 |
| `tests/gemini-gateway.test.js` | 신규 | +180 | -0 | 6대 시나리오 단위 테스트 |
| **합계** | | **약 +720** | **약 -395** | 순수 코드 다이어트 & 안정성 극대화 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- **응답 스키마 100% 호환**:
  - 각 엔드포인트의 반환 JSON 필드명(`mission`, `feedback`, `milestones`, `columns`, `defaultRows` 등)을 완벽히 보존.
  - 클라이언트(`ui.js`, `js/`)에서는 백엔드의 게이트웨이 도입 여부와 무관하게 완전히 투명하게 작동.
- **유저 자산 보존 (헌법 제15조)**:
  - 데이터 삭제나 변형 없이 순수 백엔드 AI 호출 파이프라인의 복원력 강화이므로 유저 데이터 100% 보존.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1**: `api/lib/gemini-gateway.js` 작성.
2. **Step 2**: `tests/gemini-gateway.test.js` 작성 및 로컬 단위 테스트 통과 확인.
3. **Step 3**: `api/feedback.js` 리팩토링 (ReferenceError 버그 척결).
4. **Step 4**: `api/goaltemplate.js` 리팩토링.
5. **Step 5**: `api/todaymission.js`, `api/goalstatus.js`, `api/nextaction.js` 등 잔여 엔드포인트 순차 리팩토링.
6. **Step 6**: 전체 테스트 슈트(`npm test`) 및 법정 예비 점검(`node scripts/pre-court-check.js`) 실행.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계

- **주장 항목**:
  1. `api/lib/gemini-gateway.js`가 존재하고 export된 함수들이 정상 동작하는가?
  2. 429 응답 및 타임아웃 발생 시 에러로 폭사하지 않고 로컬 폴백을 100% 반환하는가?
  3. `api/feedback.js`에 존재하던 `endpoint is not defined` 결함이 완전히 제거되었는가?
  4. 기존 엔드포인트들의 응답 규격이 깨지지 않고 100% 유지되는가?

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트

- [ ] `api/lib/gemini-gateway.js` 구현
- [ ] `tests/gemini-gateway.test.js` 작성 및 실행
- [ ] `api/feedback.js` 수정
- [ ] `api/goaltemplate.js` 수정
- [ ] `api/todaymission.js` 수정
- [ ] `api/goalstatus.js` 수정
- [ ] `api/goalagent.js` 수정
- [ ] `api/nextaction.js` 수정
- [ ] `api/promptgen.js` 수정
- [ ] `api/vision-table.js` 수정
- [ ] `npm test` 통과 확인
- [ ] `node scripts/pre-court-check.js` 통과 확인

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **막히는 지점**:
  - Vercel Serverless Function 배포 시 CommonJS(`require`) 모듈 로딩 경로 문제 발생 가능성.
  - **대응책**: 모든 import를 상대 경로(`const { callGeminiGateway } = require('./lib/gemini-gateway');`)로 엄밀히 지정하고 `node -e "require('./api/feedback.js')"`로 로컬 검증 수행.
- **롤백 계획**:
  - 브랜치 격리 작업 중이므로 문제 발생 시 브랜치 초기화로 즉시 원복 가능.
