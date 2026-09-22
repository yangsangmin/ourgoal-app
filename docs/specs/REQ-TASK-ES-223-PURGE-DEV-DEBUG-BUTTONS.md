# 요구사항 정의서 (REQ) — 랜딩/로그인 화면 내 개발 디버그 버튼('🧪 2계정 테스트 빠른 입장') 프로덕션 완전 소거

> **문서 ID**: REQ-TASK-ES-223-PURGE-DEV-DEBUG-BUTTONS  
> **티켓 연계**: #TASK-ES-223  
> **작성 일시**: 2026-09-23  
> **작성자**: 프로덕션 보안 & 무결성 릴리즈 엔지니어  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "90번 완료처리하고, 89번부터. 번호대로 계속 하나씩 간다." (생각 메모장 [93] 랜딩/로그인 화면 내 개발 디버그 버튼('🧪 2계정 테스트 빠른 입장') 프로덕션 완전 소거)
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 아워골 랜딩 화면(`landScreen`) 및 로그인 화면(`authScreen`) 하단에 개발/디버깅 전용 '🧪 2계정 테스트 빠른 입장 (테스터 B)' 버튼이 일반 사용자에게 무방비로 노출되고 있음.
  - 일반 실사용자에게 앱이 아직 개발 중인 불완전한 제품이라는 인상을 주며, 실수로 클릭 시 타인(테스터 B) 세션으로 즉시 로그인되어 데이터 오염 및 사용성 혼란을 초래함.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 프로덕션 배포 환경(`ourgoal-app.vercel.app`)과 로컬 개발 환경(`localhost`, `127.0.0.1`)의 피처 플래그 분기 체계 부재.
  - **2층 (구조/프로세스 부재)**: 디버그 요소가 정적 HTML 마크업에 무조건 포함되어 프로덕션 렌더링 시 여과 없이 노출됨.
  - **3층 (시스템/유저 체감 괴리)**: 상용 서비스로서의 단정함과 완성도 저해 및 보안 불신감 형성.
- **사용자 상황 및 페르소나**:
  - 처음 아워골을 방문하여 회원가입 및 로그인을 시도하는 모든 일반 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: FIX / INFRA (프로덕션 보안 및 무결성 릴리즈)
- **[본질] (Essence)**: 프로덕션 라이브 환경에서 개발 편의용 도구를 100% 원천 소거하여 정식 서비스로서의 완성도와 보안 신뢰를 회복하고, 개발 환경에서는 편리한 테스트 기능을 보존하는 조건부 격리 체계 구축.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (환경 감지 격리 부재)**: `location.hostname` 및 `debug` 파라미터 분기 없이 정적 노출됨.
  2. **원인 2 (DOM 래핑 미비)**: 디버그 버튼들을 제어할 독립적인 래퍼 컨테이너 부재.
  3. **원인 3 (기본 노출 상태)**: 초기 로드 시 `display:none` 처리 없이 기본 표시되어 깜빡임 노출 위험 존재.
- **[중심] (Core Bottleneck & Anchor)**:
  - 랜딩/로그인 화면의 디버그 버튼 래퍼(`#landTesterBWrap`, `#authTesterBWrap`)를 기본 `display:none`으로 차단.
  - `initDevDebugButtons()` 함수를 통해 `localhost`, `127.0.0.1`, `?debug=true` 환경에서만 조건부 노출하고, 프로덕션 환경에서는 DOM을 즉시 제거(`remove()`).
- **[핵심] (Critical Safety & Termination)**:
  - 기존 `#TASK-ES-169` 단언문(`id="landTesterBBtn"`, `id="authTesterBBtn"`)과의 회귀 충돌 0건 보장.
  - 3대 정식 진입 동선([카카오로 3초 만에 시작하기], [로그인 없이 둘러보기], [로그인])의 조형 무결성 완성.
- **체감 가설 (User Experience Hypothesis)**:
  > *"일반 사용자가 프로덕션 랜딩에 접속했을 때 개발 디버그 버튼 없이 단정하고 미려한 정식 상용 앱 화면을 마주하여 높은 신뢰감 속에서 로그인을 진행할 수 있다."*
- **기존 전체 기능 영향도 분석**:
  - 일반 브라우저: 디버그 버튼 완전 소거 (0 노출).
  - 로컬/개발 환경: `localhost` 또는 `?debug=true`로 테스트 지속 가능.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 `#TASK-ES-169` 회귀 테스트가 깨지도록 ID 자체를 삭제하는 행위 금지.
  - 복잡한 빌드 타임 환경변수 시스템을 도입하여 단일 정적 HTML 아키텍처를 파괴하는 행위 금지.
- **해야 할 것 (Action)**:
  - 기본 스타일 `display:none;` 래퍼 배선.
  - 런타임 환경 감지(`localhost` / `127.0.0.1` / `?debug=true`)로 안전한 프로덕션 소거.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 해당 없음 (클라이언트 렌더링 제어).
- **2호 (스마트 스토리지 분기 설계)**: 해당 없음.
- **3호 (4대 뷰 전파 배선도)**: 랜딩/인증 화면 독립 처리.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `landTesterBBtn` | 랜딩 화면 (개발 모드 한정) | 탭/클릭 | 테스터 B 계정 로그인 | 비개발 환경에서는 DOM 제거됨 |
| `authTesterBBtn` | 로그인 화면 (개발 모드 한정) | 탭/클릭 | 테스터 B 계정 로그인 | 비개발 환경에서는 DOM 제거됨 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 정식 유저 로그인 및 데이터에 일절 영향 없음.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토**: 로컬에서 테스트할 때 개발자가 실수로 디버그 버튼을 못 찾는 일이 없도록 URL 파라미터 `?debug=true`를 지원하여 모든 환경에서 필요 시 활성화 가능하도록 유연성 보장.
- **기존 기능과의 충돌 방지**: `compliance: [#TASK-ES-169]` 테스트 단언문 100% 통과.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. `index.html` 내 `landTesterBBtn` 및 `authTesterBBtn`의 래퍼에 `id="landTesterBWrap"`, `id="authTesterBWrap"` 및 `style="display:none;"` 부여.
  2. `initDevDebugButtons()` 함수 구현 및 DOM 로드 시 실행.
  3. `scripts/smoke-test.js`에 TASK-ES-223 검증 케이스 추가.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**: `window.location`이 정의되지 않은 테스트 환경에서도 안전하게 폴백하여 예외 없이 동작하도록 방어.
- **가정의 타당성 검증**: Vercel 프로덕션 도메인에서 `lWrap.remove()`, `aWrap.remove()` 호출 검증.
- **재검증 결과 도출된 절차 수정/보완사항**: 깜빡임(FOUC) 방지를 위해 HTML 레벨에서 기본 `display:none;`을 선적용.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test` 336+ 스모크 테스트 ALL PASS.
- 38대 무결성 게이트 및 783+ 정적 버튼 Zero Dead-Click ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커**: 정적 버튼 Dead-Click 검사기에서 `authTesterBBtn`의 존재 여부.
- **대책**: HTML 내에 버튼이 여전히 정의되어 있고 클릭 핸들러가 연결되어 있어 Dead-Click 검사 완벽 통과.
- **재검증 트리거**: 검증기 실패 시 래퍼 구조 재조정.
