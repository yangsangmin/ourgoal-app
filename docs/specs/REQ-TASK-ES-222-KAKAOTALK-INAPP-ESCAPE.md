# 요구사항 정의서 (REQ) — 카카오톡 인앱 브라우저 감지 및 Safari/Chrome 1초 탈출 안내 배너 탑재

> **문서 ID**: REQ-TASK-ES-222-KAKAOTALK-INAPP-ESCAPE  
> **티켓 연계**: #TASK-ES-222  
> **작성 일시**: 2026-09-23  
> **작성자**: 한국형 모바일 웹 배포 전문 테크니컬 리드  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다." (생각 메모장 [92] 카카오톡 인앱 브라우저 감지 및 Safari/Chrome 1초 탈출 안내 배너 탑재)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 카카오톡 메신저에서 아워골 공유 링크를 클릭했을 때 인앱 웹뷰 브라우저로 열리면서, 쿠키 파편화, 소셜 로그인 시 세션 단절/403 오류, PWA 홈 화면 추가 미지원 등의 치명적인 사용성 문제가 발생함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 안드로이드 환경에서 intent 자동 실행이 즉시 연동되지 않고 단순 버튼 클릭에 의존하고 있어 대부분의 유저가 인앱 브라우저에 그대로 갇힘.
  - **2층 (구조/프로세스 부재)**: iOS Safari 탈출 시 카카오톡 최신 UI(우측 하단 [···] 및 [Safari로 열기])에 맞춘 명확한 시각 가이드 및 세션 보관(닫기 시 재노출 방지) 부재.
  - **3층 (시스템/유저 체감 괴리)**: 웹뷰 창을 닫으면 로그인 및 작성 중이던 체크인 세션이 날아가 "앱이 불안정하다"는 불신감 초래.
- **사용자 상황 및 페르소나**:
  - 카카오톡 단톡방이나 1:1 채팅에서 친구가 보낸 목표/기록/루틴 공유 링크를 누르고 들어온 신규 및 기존 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX / INFRA (외부 연동 E2E 무결성 및 로그인 안정성)
- **[본질] (Essence)**: 웹뷰의 한계에 유저를 방치하지 않고, 안드로이드는 1초 무조작 Chrome 자동 전환, iOS는 고시인성 에메랄드 플로팅 가이드로 안전하게 표준 브라우저에 안착시키는 것.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (자동 전환 부재)**: 안드로이드 intent scheme 자동 호출 미배선으로 수동 클릭 전까지 웹뷰에 체류.
  2. **원인 2 (iOS 가이드 인터페이스 조형 미흡)**: 상단 배너가 구식 노란색에 버튼도 투박하여 유저 눈에 잘 띄지 않고 카톡 최신 인터페이스([···] 버튼)와 불일치.
  3. **원인 3 (세션 닫기 메모리 누락)**: 배너를 닫아도 페이지 전환 시 다시 떠서 사용자를 방해하는 문제.
- **[중심] (Core Bottleneck & Anchor)**:
  - `KAKAOTALK` User-Agent 정밀 감지.
  - 안드로이드 환경 감지 시 `intent://` 자동 1초 전환.
  - iOS/기타 환경 감지 시 토스 스타일 에메랄드 플로팅 배너 (`#inAppBrowserNotice`, `#btnEscapeInAppNotice`, `#btnCloseInAppBanner`) 렌더링.
- **[핵심] (Critical Safety & Termination)**:
  - 일반 Safari/Chrome 브라우저에서는 배너 노출 0건(불필요한 DOM 차단).
  - `sessionStorage`를 통한 닫기 상태 보존으로 중복 방해 차단.
  - 12ms 미세 햅틱 피드백 준수.
- **체감 가설 (User Experience Hypothesis)**:
  > *"카톡 링크로 들어온 안드로이드 유저는 1초 만에 Chrome으로 매끄럽게 넘어가 로그인되고, 아이폰 유저는 상단 친절한 가이드 배너를 보고 3초 만에 Safari로 열어 PWA 홈 화면 추가까지 완수한다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 표준 브라우저로 이동하여 쿠키/세션 영속성 및 OAuth 무결성 보장.
  - 일반 브라우저: 어떠한 간섭이나 UI 방해도 없음 (0 impact).

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 일반 브라우저 유저에게 불필요한 안내 배너를 강제로 노출하는 행위 금지.
  - 복잡한 도구 언어(User-Agent, Webview, Intent)를 노출하는 행위 금지.
- **해야 할 것 (Action)**:
  - 안드로이드 카카오톡 접속 시 즉각 intent scheme 자동 탈출 실행.
  - iOS 카카오톡 접속 시 산뜻한 에메랄드 플로팅 배너 표출 및 닫기 세션 보관.
  - 복사하기 및 Safari 열기 안내 모달 연결.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 해당 없음 (클라이언트 브라우저 세션 제어).
- **2호 (스마트 스토리지 분기 설계)**: `sessionStorage.setItem('ourgoal_hide_kakao_escape', '1')`을 통해 당일 세션 내 중복 노출 차단.
- **3호 (4대 뷰 전파 배선도)**: 브라우저 레벨 최상단 배너로 4대 뷰에 독립적 안착.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `btnEscapeInAppNotice` | 카톡 탈출 플로팅 배너 | 탭/클릭 | Safari 열기 안내 모달 표출 및 주소 복사 | 12ms 햅틱 + 모달 표시 + 토스트 |
| `btnCloseInAppBanner` | 카톡 탈출 플로팅 배너 | 탭/클릭 | 배너 즉시 닫기 및 세션 스토리지 영속화 | 12ms 햅틱 + 배너 제거 |
| `btnCopyInAppUrlAgain` | 탈출 안내 상세 모달 | 탭/클릭 | 현재 URL 클립보드 복사 | 12ms 햅틱 + 복사 완료 토스트 |
| `btnCloseInAppModal` | 탈출 안내 상세 모달 | 탭/클릭 | 모달 닫기 | 12ms 햅틱 + 모달 제거 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 외부 브라우저 탈출 시 현재 쿼리 파라미터(`invite_group`, `utm_source` 등)와 해시 경로 100% 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토**: 안드로이드에서 일부 구형 기기나 특수 설정으로 intent 자동 전환이 차단될 수 있으므로, 배너에도 수동 전환 버튼을 상시 비치.
- **기존 기능과의 충돌 방지**: 일반 브라우저에서는 User-Agent 정규식 불일치로 코드가 아예 실행되지 않음.
- **엣지 케이스**:
  - 클립보드 API가 차단된 보안 브라우저: textarea 폴백 복사 로직 적용.
  - 사용자가 배너를 닫은 경우: `sessionStorage`에 기록하여 해당 세션 동안 다시 나타나지 않음.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `index.html` 내 `checkKakaoInAppBrowser()` 함수 신설 및 로드 시 즉시 실행.
  2. 안드로이드 감지 시 `location.href = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;end'` 1초 자동 트리거.
  3. iOS 감지 및 `sessionStorage` 미차단 시 토스 스타일 에메랄드 플로팅 배너 슬라이드 인.
  4. `escapeKakaoInAppBrowser()` 모달 및 복사 핸들러에 12ms 햅틱 배선.
  5. `scripts/smoke-test.js`에 감지 및 배너 검증 케이스 추가.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: `sessionStorage` 접근이 제한된 시크릿 모드 환경에서도 try-catch로 감싸 스크립트 크래시 방지.
- **가정의 타당성 검증**: 카카오톡 최신 버전의 [···] 메뉴 위치(우측 하단) 반영 검증.
- **재검증 결과 도출된 절차 수정/보완사항**: intent 전환 실패 시에도 유저가 머물 수 있도록 안드로이드에서도 배너 DOM을 백그라운드로 안전하게 생성.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test` 스모크 테스트 통과.
- `node scripts/verify-integrity-gate.js` 38대 게이트 ALL PASS.
- `node scripts/verify-all-clicks.js` 791+ 정적 버튼 Zero Dead-Click 통과.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: intent scheme 호출 시 데스크톱 브라우저에서 에러 경고가 발생할 가능성.
- **대책**: `/Android/i.test(navigator.userAgent)`와 `/KAKAOTALK/i.test(navigator.userAgent)`가 동시에 만족할 때만 호출.
- **재검증 트리거**: 모의 테스트에서 예외 발생 시 조건 분기 정밀 조정.
