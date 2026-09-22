# 요구사항 정의서 (REQ) — 음성 마이크(STT) 클릭 시 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 배선

> **문서 ID**: REQ-TASK-ES-227-STT-PERMISSION-MODAL  
> **티켓 연계**: #TASK-ES-227  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity 웹 하드웨어 API & 음성 인터페이스 스페셜리스트  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다." (노션 생각 메모장 97번: `음성 마이크(STT) 클릭 시 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 배선`)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 홈 화면의 오늘의 3초 체크인 및 실시간 음성 표 입력에서 마이크 버튼(`#micBtn`) 클릭 시, 브라우저 마이크 권한이 차단되어 있으면 묵묵부답 먹통(Dead-Click)으로 방치되거나 단발성 토스트("마이크 사용 권한이 필요해요")만 1초 스쳐 지나가 사용자가 어떻게 브라우저 설정을 변경해야 하는지 알 길이 없음.
  - 마이크 권한 거부 시 유저는 앱이 고장 났다고 오인하여 입력을 포기하고 이탈함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 권한 거부(`not-allowed`, `service-not-allowed`) 발생 시 유저를 브라우저별 허용 설정으로 안내하는 전용 가이드 UI의 부재.
  - **2층 (구조/프로세스 부재)**: `navigator.permissions.query` 또는 `SpeechRecognition.onerror`를 자가 진단하여 즉시 1초 허용 모달을 띄우는 예외 대응 파이프라인 결여.
  - **3층 (시스템/유저 체감 괴리)**: 유저는 "버튼을 눌렀는데 아무 반응이 없다"며 하드웨어 기능 자체를 불신함.
- **사용자 상황 및 페르소나**:
  - 손을 쓰기 어려운 상황(러닝 중, 주방, 이동 중)에서 3초 만에 음성으로 체크인하려다 브라우저 마이크 권한 거부로 멈춰선 모바일 웹 유저.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프) / FIX (무결성 & 헌법 수호)
- **[본질] (Essence)**:
  - 브라우저 보안 제약 속에서도 사용자에게 침묵 결함(Silent Failure)을 주지 않고, iOS Safari와 Android Chrome 환경에 최적화된 3컷 시각 가이드와 1터치 재시도/텍스트 폴백을 제공하여 음성 체크인 루프를 무저항으로 완주시키는 하드웨어 안전 인터페이스.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: `SpeechRecognition`의 `onerror` 핸들러에서 권한 거부 시 단발성 텍스트 토스트만 출력하고 인터랙티브 안내 모달 부재.
  2. **원인 2**: iOS Safari와 Android Chrome의 마이크 권한 허용 경로가 완전히 다름에도 플랫폼별 맞춤 단계 안내 부재.
  3. **원인 3**: 인앱 브라우저(카카오톡, 인스타그램 등) 및 STT 미지원 브라우저 진입 시 텍스트 입력창 자동 포커스 스마트 폴백 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `openMicPermissionGuideModal(context)`를 구축하고, `setupVoiceCheckin`의 `micBtn` 클릭 및 `recognition.onerror`(`not-allowed`)에 직결하여 0.1초 즉시 가이드와 재시도/텍스트 폴백 제공.
- **[핵심] (Critical Safety & Termination)**:
  - 헌법 제3조 제2항(마이크 권한 오류 시 침묵 금지 / No Silent Failure), 제7조(Zero Dead-Click 및 375px 모바일 터치 타깃 44px 이상), 제4조 제9호(친절한 권한 가이드라인 제공)를 100% 엄수.
- **체감 가설 (User Experience Hypothesis)**:
  > *"마이크 권한이 차단된 유저가 마이크 버튼을 눌렀을 때 침묵하거나 당황하지 않고, 즉시 화면에 뜨는 3컷 일러스트 가이드(iOS Safari / Android Chrome 탭 스위처)를 보고 1초 만에 권한을 켜거나, 1클릭으로 텍스트 입력창으로 전환하여 하루의 소중한 체크인을 막힘 없이 완수한다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 정상 음성 권한을 가진 유저는 0.01초의 지연도 없이 즉시 기존 STT 음성 인식 가동.
  - 마이크 미지원 기기/브라우저에서도 텍스트 입력창 자동 포커스로 이탈률 제로화.
  - 기존 목표, 기록, 아바타 데이터 100% 무손실 보존.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 외부 권한 라이브러리 추가나 브라우저 native alert/confirm 의존 금지.
  - 지원 브라우저에서 마이크 버튼을 무단으로 숨겨버려 유저가 음성 입력을 찾지 못하게 하는 행위 금지.
- **해야 할 것 (Action)**:
  - `openMicPermissionGuideModal(context)` 3컷 시각 가이드 모달 신설.
  - iOS Safari / Android Chrome 탭 스위처(`#btnTabIosSafari`, `#btnTabAndroidChrome`) 및 플랫폼 자동 감지.
  - 1터치 재요청 버튼(`#btnRetryMicPermission`) 및 텍스트 전환 버튼(`#btnFallbackToText`) 배선.
  - 12~15ms 미세 햅틱 피드백 적용.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**:
  - 권한 안내는 클라이언트 UI/하드웨어 가이드 인터페이스이므로 DB 스키마 변경 없음.
- **2호 (스마트 스토리지 분기 설계)**:
  - 사용자가 가이드를 확인하고 텍스트 전환 시 기존 작성 중인 체크인 `baseText` 100% 보존.
- **3호 (4대 뷰 전파 배선도)**:
  - 텍스트 입력 폴백 시 `#captureInput`에 즉시 포커스 부여하여 홈 화면 체크인 루프 완주.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#micBtn` | 홈 3초 체크인 | 터치/클릭 | STT 시작 또는 권한 자가진단 후 가이드 모달 호출 | `not-allowed` 감지 시 가이드 모달 즉시 팝업 |
| `#btnTabIosSafari` | 마이크 권한 모달 | 터치/클릭 | iOS Safari 3컷 가이드 노출 | 활성 탭 스타일 전환 및 12ms 햅틱 |
| `#btnTabAndroidChrome` | 마이크 권한 모달 | 터치/클릭 | Android Chrome 3컷 가이드 노출 | 활성 탭 스타일 전환 및 12ms 햅틱 |
| `#btnRetryMicPermission` | 마이크 권한 모달 | 터치/클릭 | `getUserMedia` / STT 재기동 시도 | 성공 시 모달 닫기 + 음성인식 개시, 실패 시 토스트 |
| `#btnFallbackToText` | 마이크 권한 모달 | 터치/클릭 | 모달 닫고 `#captureInput` 즉시 포커스 | 12ms 햅틱 및 텍스트 입력창 하이라이트 |
| `#btnCloseMicGuide` | 마이크 권한 모달 | 터치/클릭 | 모달 닫기 | 12ms 햅틱 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **체크인 버퍼 보존**: 마이크 권한 모달이 열려도 기존 `#captureInput`에 입력되어 있던 글자는 1글자도 지워지지 않음.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 브라우저 보안 정책상 JavaScript 코드가 직접 브라우저 OS 권한 팝업을 강제로 재오픈할 수 없는 경우(`denied` 영구 거부)가 존재함.
  - 이에 대비하여 "주소창 좌측 버튼을 눌러 허용하는 시각적 3단계 그림 설명"을 제공하고, "직접 텍스트로 쓰기" 버튼을 통해 유저 흐름이 단절되지 않도록 2중 안전장치 마련.
- **엣지 케이스 (Edge Cases)**:
  - 카카오톡 인앱 브라우저: 웹뷰 자체에서 Web Speech API를 지원하지 않는 경우, 인앱 브라우저 안내 문구 표출 및 Safari/Chrome 외부 브라우저 열기 팁 제공.
  - 마이크가 없는 PC 데스크톱: 음성 인식 미지원 감지 시 텍스트 모드로 자연스러운 전환.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `openMicPermissionGuideModal(context)` 함수 구현 및 시각 가이드 마크업/스타일 완성.
  2. `setupVoiceCheckin`의 권한 진단 및 에러 핸들러(`not-allowed`, `service-not-allowed`)에 모달 호출 배선.
  3. `openVoiceTableModal`의 STT 에러 핸들러에도 모달 호출 배선.
  4. `scripts/smoke-test.js`에 TASK-ES-227 전용 검증 단언문 추가.
  5. `npm test` 및 5대 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - `SpeechRecognition` 객체 생성 자체가 실패하거나 브라우저에 존재하지 않는 경우?
  - -> `window.SpeechRecognition || window.webkitSpeechRecognition` 안전 가드 및 폴백 처리.
- **재검증 결과 도출된 보완사항**:
  - 모달 닫기 시 작성 중이던 텍스트 입력창(`#captureInput`)으로 스크롤 및 포커스가 자연스럽게 유지되도록 보장.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 마이크 권한 거부 상태에서 마이크 버튼 클릭 시 권한 안내 모달 즉시 표출 확인.
- iOS Safari / Android Chrome 탭 전환 시 시각 가이드 정상 전환 확인.
- `#btnRetryMicPermission`, `#btnFallbackToText`, `#btnCloseMicGuide` 100% Zero Dead-Click 확인.
- `npm test` 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: `navigator.permissions.query`가 일부 모바일 Safari에서 지원되지 않아 예외를 던질 수 있음.
  - **대책**: `try-catch` 래핑 및 `onerror` 이벤트 기반 2중 안전 트리거 설계.
- **재검증 트리거**: 마이크 클릭 시 아무 반응이 없거나 콘솔 에러 발생 시 즉시 원칙 ⑤로 회귀.
