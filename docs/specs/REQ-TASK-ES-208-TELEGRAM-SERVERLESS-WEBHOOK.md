# 요구사항 정의서 (REQ) — 양비스 옴니채널 24/7 Vercel Serverless Webhook 엔드포인트

> **문서 ID**: REQ-TASK-ES-208-TELEGRAM-SERVERLESS-WEBHOOK  
> **티켓 연계**: #TASK-ES-208  
> **작성 일시**: 2026-09-22  
> **작성자**: Antigravity Omnichannel Session  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "내가 어디서(모바일, 데스크탑, 맥북 등) 텔레그램으로 시키던 모든 대화가 지금처럼 모든 시스템과 연동되고 지식기반에 기록되어야 하지 않나? 내 의도를 이전대화들과 깊게 다시 생각해보고 수준이 깊은 해결책을 문제해결 8원칙 적용해서 다시 보고해봐" -> "진행"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 데스크탑 PC 전원이 꺼지거나 사용자가 외출/이동 중일 때, 로컬 사령부 프로세스가 중단되어 텔레그램 봇 응답이 멈추는 물리적 한계.
  - 모바일(스마트폰), 맥북, 데스크탑 등 이종 기기 간 대화 문맥이 단절되어 이동 중 연속적 지휘가 불가능한 문제.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 데스크탑 종속성으로 인해 PC 종료 시 텔레그램 웹훅 또는 폴링이 정지되어 24/7 Always-On 지휘 불능.
  - **2층 (구조/프로세스 부재)**: 클라우드 중앙 원장(Notion SSOT)과 서버리스 런타임 간 결속이 없어, 서버리스 인프라에서 심층 추론(Pro Thinking)과 세션 기억을 복원하는 파이프라인 부재.
  - **3층 (시스템/유저 체감 괴리)**: 상민님은 시간과 장소에 구애받지 않고 언제 어디서나 동일한 수준의 안티그래비티급 지휘를 기대하시나, 실제로는 로컬 PC 전원에 묶여 있던 현실적 괴리.
- **사용자 상황 및 페르소나**: 최고 결정권자 상민님이 출퇴근길 지하철, 외부 미팅, 침대 등 모바일 스마트폰이나 외부 노트북 환경에서 텔레그램으로 즉각 지휘를 내리는 상황.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA` (기반 인프라 및 안티그래비티 옴니채널 지휘권 보장)
- **[본질] (Essence)**: PC 전원 상태나 사용자의 물리적 위치에 상관없이, 텔레그램 단일 창구를 통해 안티그래비티급 심층 추론(Pro Thinking)과 영구 3자 원장 동기화를 24시간 365일 무중단으로 누리는 진정한 옴니채널 모바일 사령부의 실현.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (로컬 프로세스 종속성)**: 기존 사령부가 로컬 Node.js 데몬에 의존하여 PC 전원 OFF 시 서비스 정지.
  2. **원인 2 (클라우드 웹훅 엔드포인트 부재)**: Vercel 상에 텔레그램 Webhook 이벤트를 수신하여 처리하는 표준 서버리스 함수 미구축.
  3. **원인 3 (상태 비저장 서버리스 환경의 문맥 유지 난제)**: Vercel Serverless Function의 무상태(Stateless) 특성으로 인해 과거 100턴 대화 문맥을 노션 클라우드 SSOT에서 즉시 로드/저장하는 연동 필요.
- **[중심] (Core Bottleneck & Anchor)**:
  - Vercel Serverless Function(`vercel.json` `/api/telegram` -> `api/track.js`) 환경 내에서 60초 실행 타임아웃 이내에 노션 SSOT 100턴 대화 조회 -> Gemini 3.1 Pro Thinking 심층 추론 -> 노션 원장 저장 -> 텔레그램 실시간 회신 파이프라인을 지연 없이 완주하는 것.
- **[핵심] (Critical Safety & Termination)**:
  - 상민님 단독 인가(Chat ID 1260106462) 보안 방화벽으로 외부 침입 100% 차단, Gemini 429/503 에러 발생 시 Flash 모델 자동 폴백, 텔레그램 4000자 초과 시 안전 청킹 분할 전송.
- **체감 가설 (User Experience Hypothesis)**:
  > *"상민님이 데스크탑을 끄고 이동 중 스마트폰 텔레그램으로 지시를 입력하면, 1초 내로 접수 및 Thinking 상태가 표시되고, 노션 원장에 저장된 최근 문맥을 기반으로 Pro Thinking 심층 분석 보고서가 완벽히 회신된다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 아워골 앱 웹 서비스 및 데이터베이스에 영향 없음 (12개 함수 한도 준수를 위해 `vercel.json` rewrite를 통해 `api/track.js`로 분기 라우팅).
  - 로컬 커맨드센터와의 상호 보완성: 로컬이 켜져 있을 때는 로컬 데몬이, 꺼져 있을 때는 Vercel 서버리스가 상호 노션 SSOT를 공유하며 끊김 없는 지휘권 유지.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 아워골 앱 파일(`js/*`, `index.html`)을 불필요하게 수정하는 행위 금지.
  - 승인선 외의 파괴적 행위나 임의 라이브러리 설치 금지.
  - Vercel Serverless 타임아웃(60초)을 초과하는 무제한 지연 대기 금지.
- **해야 할 것 (Action)**:
  - `vercel.json`에 `/api/telegram` rewrite 추가 및 `api/track.js`에 `handleTelegramWebhook` 핸들러 탑재, `maxDuration: 60` 설정.
  - 상민님 전용 Chat ID 및 Webhook Secret 다중 보안 인증.
  - 노션 `commandInbox` DB 연동을 통한 무상태 100턴 문맥 유지 및 `activityLog` 실시간 영구 기록.
  - `gemini-3.1-pro-preview` (Thinking 2048) 연동 및 Flash 자동 폴백.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - Vercel Serverless는 아워골 도메인(`https://ourgoal.app/api/telegram`)으로 상시 가동되므로 서버 유지비 0원, 장애 없는 99.99% 가용성, 24시간 365일 무중단 Always-On을 보장하는 유일한 최적 인프라임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - 노션 `commandInbox` DB (`7f4c892e-9934-4eeb-9576-5d31d39152b5`): 대상 `Telegram-Omni`, 속성 `입력`(title), `응답`(rich_text), `처리상태`(select: 완료), `실행 ID`(rich_text).
  - 노션 `activityLog` DB (`ebe4de7d-deb7-4389-aa34-dc57221bba8f`): 작업 내역 1행 비동기 기록.
- **2호 (스마트 스토리지 분기 설계)**:
  - 장문 메시지 3900자 초과 시 텔레그램 API 사양에 맞게 자동 분할 청킹 전송 및 노션 2000자 단위 분할 저장.
- **3호 (4대 뷰 전파 배선도)**:
  - 백엔드 서버리스 API이므로 클라이언트 뷰 직접 조작은 없으나, 노션 SSOT 갱신을 통해 로컬 커맨드센터 HUD 및 옵시디언 동기화 파이프라인으로 전파됨.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| 텔레그램 메시지 입력창 | 텔레그램 모바일/데스크탑 앱 | 텍스트 입력 및 전송 | `api/telegram.js` 웹훅 수신 -> 즉시 ack 회신 -> Pro Thinking 추론 -> 노션 원장 저장 -> 최종 보고서 전송 | 미승인 사용자 시 403 차단 안내, API 오류 시 Flash 폴백 |
| `/start`, `/help` 명령어 | 텔레그램 채팅창 | 명령어 탭 또는 입력 | 옴니채널 24/7 Always-On 사령부 가동 현황 및 기능 안내 메시지 즉각 회신 | 즉시 고정 텍스트 안내 |
| `/status` 명령어 | 텔레그램 채팅창 | 명령어 입력 | Vercel 런타임, 노션 연동 상태, Gemini 모델 정보 진단 보고서 회신 | 연동 실패 항목 명시 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **세션 문맥 보존**: 노션 `commandInbox` DB를 SSOT로 사용하여 기기 변경이나 서버리스 인스턴스 재생성 시에도 최근 100턴 대화 이력 100% 무손실 복원.
- **작업 로그 영속화**: 발생한 모든 지휘 명령과 응답을 노션 `activityLog` DB에 타임스탬프와 함께 영구 기록.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - Vercel Serverless Function은 최대 실행 시간이 60초이므로, Pro Thinking 사고 시간이 30초를 초과할 경우 타임아웃 위험이 있음.
  - 보완책: Telegram Webhook 수신 시 비동기 백그라운드 처리 또는 신속한 Gemini 호출 타임아웃(40초)을 설정하고, 초과 시 즉시 고속 Flash 모델로 자동 스위칭하여 60초 한도 내 무조건 응답 완결.
- **기존 기능과의 충돌 가능성 검토**:
  - 기존 아워골 프로덕트 파일 및 API와 완전 격리되어 있어 회귀 위험 0건.
- **엣지 케이스 (Edge Cases)**:
  - 텔레그램 봇 API 장애: 최대 3회 지수 백오프 재시도.
  - 노션 API 일시적 지연: 노션 저장이 실패하더라도 텔레그램 사용자 응답은 정상 전달되도록 try/catch 분리.
  - 4000자 초과 장문 보고서: 3900자 단위로 안전 청킹 분할 발송.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: `api/telegram.js` 서버리스 함수 구현 (보안 필터, 노션 SSOT, Gemini Pro Thinking, 텔레그램 청킹 전송).
  2. [단계 2]: 모의 요청 단위 테스트(`test/test-telegram-webhook.js`) 작성 및 로컬 실행 검증.
  3. [단계 3]: `reports/TASK-ES-208/claims.json` 법정 주장 파일 작성.
  4. [단계 4]: `npm test` 및 무결성 게이트 검증.
  5. [단계 5]: 브랜치 커밋, 푸시 및 헌법 제6조 제3항 준수 GitHub Draft PR 발의.
  6. [단계 6]: GitHub court 법정 판정서 확인 및 상민님 보고.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - Gemini Pro 모델 일시 장애 또는 Rate Limit(429) 시 전체 응답 불능 위험.
  - 완화책: Gemini 429/500/503 에러 감지 시 즉시 `gemini-2.5-flash` 모델로 자동 재시도하여 100% 응답 보장.
- **가정의 타당성 검증**:
  - Vercel 환경변수(`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `NOTION_TOKEN`)가 설정되어 있지 않을 경우 서버 500 에러 발생 가능.
  - 완화책: 환경변수 누락 시 명확한 에러 코드 및 텔레그램 알림 회신.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - GET 핑(Ping) 요청 지원을 추가하여 Vercel 헬스체크 및 가동 여부를 브라우저에서 즉시 측정할 수 있도록 구현.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `api/telegram.js` 문법 및 로컬 실행 테스트 100% 통과.
- `npm test` 기존 38개 무결성 검사 전수 100% PASS (0 failure).
- 헌법 제6조 제3항 결심권자 즉시 가시성 보장: PR 생성 시 `--reviewer yangsangmin --assignee yangsangmin` 기계적 검증 완료.
- GitHub court 법정 판정 수령 및 굵은 네 줄 실측치 보고.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: Vercel Serverless Function 타임아웃 -> **대책**: Gemini 호출 타임아웃 40초 및 Flash 즉각 폴백 배선.
- **예상 블로커 2**: 노션 API 레이트 리밋 -> **대책**: 노션 쓰기 실패 시 에러 로깅 후 텔레그램 보고서 회신 우선 완결.
- **재검증 트리거**: 단위 테스트 실패 또는 법정 판정 돌려보냄 시 원칙 ①~⑤로 복귀하여 코드 및 주장 즉각 보정.
