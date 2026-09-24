# 요구사항 정의서 (REQ) — 제미나이 API 중앙 게이트웨이 일원화 및 복원력 구축

> **문서 ID**: REQ-TASK-ES-251-GEMINI-RESILIENCE  
> **티켓 연계**: #TASK-ES-251  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: `C:\Users\HP\AGENTS.md` (아워골 최고 헌법 제2조 2중 8원칙 엄수)  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"01번 작업 상세히 설명해봐"* ➜ *"계획이 부실해보이는데?"* ➜ *"진행"*  
  ➔ Notion DB #1 `[01] [긴급(P0)] [AI/엔진] 제미나이 API 일원화 장애 대비 및 사전 해결책 마련` 승인 착수.

- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **엔드포인트 난립 및 중복 하드코딩**:
     - `api/feedback.js`, `api/goaltemplate.js`, `api/todaymission.js`, `api/goalstatus.js`, `api/goalagent.js`, `api/nextaction.js`, `api/promptgen.js`, `api/vision-table.js` 등 8개 이상의 API 파일에서 Gemini API URL을 각자 하드코딩 호출.
  2. **치명적 런타임 버그 (`api/feedback.js:204`)**:
     - 429 감지 시 `geminiRes = await fetch(endpoint, ...)`를 실행하나, `endpoint` 변수가 선언되어 있지 않아 `ReferenceError: endpoint is not defined`로 서버리스 함수가 즉시 폭사.
  3. **타임아웃 부재로 인한 504 Gateway Timeout 유발**:
     - 모든 호출에 타임아웃(`AbortController`)이 없어 Gemini 지연 시 Vercel 30초 한도 초과 및 504 에러로 클라이언트 먹통.
  4. **단일 API 키 의존 및 캐싱 0%**:
     - 단일 키(`GEMINI_API_KEY`) 고갈 시 전 기능 마비. 반복 프롬프트 캐싱이 전무하여 쿼터 급속 증발.
  5. **비표준 모델 루프로 인한 지연**:
     - `gemini-3.1-flash-lite`, `gemini-3.6-flash` 등 미지원 모델 루프로 첫 호출마다 불필요한 실패 지연 발생.

- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 429 복구 코드의 런타임 ReferenceError 폭사, 타임아웃 미설정으로 인한 504 게이트웨이 타임아웃.
  - **2층 (구조/프로세스 부재)**: 중앙 게이트웨이 부재, 키 풀링·서킷 브레이커·캐시 레이어의 구조적 결여.
  - **3층 (시스템/유저 체감 괴리)**: AI 장애 시 로딩 스피너가 영구히 돌거나 입력 폼이 증발하여 유저의 실천 의지 훼손.

- **사용자 상황 및 페르소나**:
  - 매일 실천 후 AI 피드백을 기대하며 체크인하는 유저, AI 목표 플랜을 생성하려는 신규 가입자. 네트워크 지연이나 AI 장애 상황에서도 100% 무중단으로 신속한 피드백과 템플릿을 받아야 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: `INFRA` (AI 엔진 복원력 및 무중단 인프라 확립)
- **[본질] (Essence)**:
  - Gemini API는 외부 클라우드 서드파티 서비스이므로 일시적 장애(429, 503, 타임아웃)는 필연적이다.
  - 본질은 **"외부 장애가 발생해도 유저는 장애를 전혀 인지하지 못하도록, 백엔드 게이트웨이 레벨에서 다중키·공식모델·서킷브레이커·캐시를 작동시키고, 최후의 순간에는 < 5ms의 고품질 로컬 온톨로지 엔진으로 즉시 완벽한 결과를 공급하는 100% 무중단 연속성"**이다.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (중앙 집중식 게이트웨이 부재)**: 8개 파일이 각자 개별 fetch()를 작성하며 에러 처리와 백오프가 누락/왜곡됨.
  2. **원인 2 (단일 실패점 Single Point of Failure)**: 단일 API 키와 단일 엔드포인트에 100% 의존.
  3. **원인 3 (보호 계층 결여)**: 캐시, 타임아웃, 서킷브레이커, 괄호 자기치유 파서 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `api/lib/gemini-gateway.js` 단일 파일로 모든 Gemini 호출 인터페이스를 단일화하고, 기존 8개 파일의 호출부를 단 한 줄의 `callGeminiGateway()`로 교체.
- **[핵심] (Critical Safety & Termination)**:
  - 장애 발생 시 에러 500/504를 클라이언트에 뿜지 않고, 100% 규격화된 로컬 온톨로지 폴백 객체를 반환하여 클라이언트 UI가 정상 렌더링되도록 보장.
- **체감 가설 (User Experience Hypothesis)**:
  > *"네트워크 순단이나 Gemini API 서버 점검 중에도 사용자는 지연(30초 대기)이나 먹통 없이 1~2초 내에 고품질 목표/피드백/미션을 끊김 없이 공급받아 성장의 몰입을 유지한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말 것 (Don'ts)**:
  - 각 API 파일마다 분산하여 429 재시도 로직을 개별 구현하는 땜질 처방 금지.
  - 무제한 재시도로 Vercel 함수 실행 시간(30초)을 낭비하는 루프 금지.
  - 외부 추가 유료 SaaS나 무거운 의존성 라이브러리 추가 금지 (Node.js 순수 내장 모듈 활용).
- **할 것 (Dos)**:
  - **`api/lib/gemini-gateway.js` 신설**:
    1. Multi-Key Pool & 60초 쿨다운 로테이터
    2. 3-State Serverless Circuit Breaker (CLOSED / OPEN / HALF-OPEN)
    3. Strict AbortSignal Timeout (4,000ms 강제)
    4. 공식 표준 모델 캐스케이드 (`gemini-2.0-flash` ➜ `gemini-1.5-flash` ➜ `gemini-1.5-flash-8b`)
    5. SHA-256 인메모리 요청 캐시 (12시간~7일 TTL) & In-Flight Deduplication
    6. Self-Healing JSON Parser (마크다운 백틱 탈색, 자동 괄호 복구)
    7. 100% 독립 로컬 온톨로지 폴백 엔진 (6대 카테고리 완결형)
  - 기존 8개 API 엔드포인트 전수 리팩토링 및 `endpoint is not defined` 버그 영구 박멸.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **비판적 재검토**:
  - Vercel Serverless 환경은 인스턴스가 수시로 콜드스타트/종료되므로 글로벌 인메모리 서킷 브레이커와 캐시가 인스턴스 간 공유되지 않을 수 있음.
  - **보완책**: 인메모리 캐시와 서킷 상태는 활성 인스턴스 수명 동안 유효하게 작동하며, 인스턴스가 새로 떠도 1차 호출 실패 시 즉시 격리되므로 Vercel 환경에서도 충분한 성능 방어 효과를 발휘함.
- **엣지 케이스 대응**:
  1. API 키가 아예 환경변수에 없는 경우 ➜ 원격 호출 시도 없이 0ms 로컬 폴백 반환.
  2. Gemini가 잘린 JSON(`{"milestones":[{"title":"운동"`) 반환 시 ➜ 자기치유 파서가 괄호 보정 후 파싱, 실패 시 로컬 엔진으로 무손실 승계.
  3. 모든 키와 모델이 429/503을 낼 경우 ➜ 서킷 OPEN 전이 후 즉시 로컬 엔진 작동.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. `api/lib/gemini-gateway.js` 코어 게이트웨이 모듈 생성.
2. 단위 테스트 `tests/gemini-gateway.test.js` 작성 및 429/타임아웃/서킷 상태 모의 검증.
3. `api/feedback.js` 리팩토링 (ReferenceError 제거 및 게이트웨이 배선).
4. `api/goaltemplate.js` 리팩토링 (3대 분기 게이트웨이 배선).
5. `api/todaymission.js`, `api/goalstatus.js`, `api/goalagent.js`, `api/nextaction.js`, `api/promptgen.js`, `api/vision-table.js` 게이트웨이 배선.
6. 로컬 스모크 테스트 및 `scripts/pre-court-check.js` 무결성 검증.
7. 초안 PR 발행 및 GitHub 법정(`court`) 검사 판정.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점(SPOF) 검증**:
  - 게이트웨이 내부에서 예외가 발생하더라도 최상위 `try-catch`가 최종 방어선으로 `localFallback()`을 강제 호출하므로 API 응답 실패율은 0%임.
- **기존 기능 호환성 검증**:
  - 각 API 엔드포인트의 입력 파라미터(`req.body`)와 출력 JSON 스키마(`res.json()`)는 100% 동일하게 유지되어 클라이언트 코드 수정 불필요.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

- **물리적 검증 지표**:
  1. `tests/gemini-gateway.test.js` 100% 통과 (정상 호출, 타임아웃 강제 절단, 429 키 로테이션, 서킷 오픈 전이, 오프라인 폴백).
  2. `api/feedback.js` 429 발생 시 `endpoint is not defined` 에러 0건 보장.
  3. `scripts/pre-court-check.js` 38대 게이트 100% ALL PASS.
  4. GitHub Court 판정 통과.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커**:
  - 일부 엔드포인트(`api/goaltemplate.js`, `api/vision-table.js`)의 응답 규격이 특수하여 단일 게이트웨이 응답 파서와 불일치할 가능성.
- **재검증 트리거**:
  - 엔드포인트별 스키마 및 반환 형식을 파라미터화하여 `callGeminiGateway({ task, prompt, systemInstruction, responseSchema, localFallback })` 형태로 유연하게 수용.
