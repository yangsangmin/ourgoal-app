# REQ-landing-guest-preview-label: 로그인 창 둘러보기 버튼 문구 정돈 (로그인 없이 둘러보기) 요구사항 정의서
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 기획 정의 완료 (상민 대표님 지침 100% 반영)  
> **작성 일시**: 2026-09-19  
> **귀속 본질 축**: **FIX (UI 텍스트 정합성 및 온보딩 심플화)** & **INFRA (인증 랜딩 진입점)**  
> **티켓 번호**: `#TASK-ES-188`  
> **적용 범위**: `index.html`, `docs/specs/`, `scripts/smoke-test.js`  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

### 1-1. 상민 대표님 지시 원문
> "로그인 창에서 3초 성소 둘러보기 삭제하고 그냥 로그인 없이 둘러보기로 바꿔"

### 1-2. 기저 3층위 심층 분석
1. **1층 (표면적 현상: Developer Jargon on Landing Screen)**:
   - 랜딩 및 로그인 화면 상단 메인 CTA 버튼에 `⚡ 3초 성소 새 UI/UX 바로 둘러보기`라는 개발/업데이트 안내용 임시 문구가 노출되어 있음.
   - 신규 방문 유저 입장에서 "3초 성소"라는 단어가 불필요하게 생소하고 과장된 인상을 줌.
2. **2층 (구조적 결합: Redundant Double Entrypoint)**:
   - 상단 초록색 대형 버튼(`⚡ 3초 성소 새 UI/UX 바로 둘러보기`) 아래에 또다시 텍스트 링크로 `로그인 없이 바로 둘러보기 ›`가 중복 노출되어 화면 집중도를 흐림.
3. **3층 (시스템 괴리: Clean Onboarding Principle)**:
   - 앱의 첫인상을 결정하는 랜딩 화면은 군더더기 없는 담백한 표준 언어("로그인 없이 둘러보기")로 진입 장벽을 낮춰야 함.

### 1-3. 대상 사용자 페르소나 및 발생 상황
- **처음 방문한 신규 유저(페르소나 1)**:
  - 카카오 로그인이나 회원가입을 망설이며 먼저 앱을 구경하고 싶은 유저.
  - "3초 성소"라는 개발 용어 대신 "로그인 없이 둘러보기"라는 명확하고 안전한 버튼을 통해 심리적 저항 없이 앱을 체험하고자 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 본질 (Essence)
- 본 작업의 본질은 **"랜딩 화면의 개발자/버전 관리용 표현을 걷어내고, 가장 직관적이고 표준적인 게스트 온보딩 CTA('로그인 없이 둘러보기')로 정돈하는 것"**이다.

### 2-2. 원인 (Root Causes)
1. 지난 UI/UX 대개편 시연 당시 임시로 부착했던 안내 문구("3초 성소 새 UI/UX 바로 둘러보기")가 프로덕션 랜딩 화면에 남아있었음.
2. 상단 메인 버튼과 하단 텍스트 링크 간의 문구 및 역할이 중복되어 정보 위계가 분산됨.

### 2-3. 중심 (Core Bottleneck)
- **"상단 메인 CTA 버튼 텍스트의 정제 및 하단 중복 링크의 호환성 유지 은폐"**:
  - 상단 대형 버튼 텍스트를 정확히 `로그인 없이 둘러보기`로 교체하고,
  - 하단 `#landGuestBtn` ID를 필요로 하는 기존 스모크 테스트의 회귀를 방지하면서 중복 노출을 해소해야 함.

### 2-4. 핵심 (Critical Anchor)
- **Zero Regression in Guest Login**:
  - 버튼 클릭 시 게스트 로그인 및 온보딩 파이프라인(게스트 세션 생성, 환영 인사, 3초 체크인 화면 진입)이 100% 동일하게 동작해야 함.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말 것 vs 할 것
- **하지 말 것**:
  - `#landGuestBtn` ID를 완전히 삭제하여 기존 테스트나 리스너를 깨뜨리는 행위.
  - 로그인이나 게스트 생성 비즈니스 로직을 변경하는 행위.
- **할 것**:
  - `index.html` 내 `#btnLandingPreviewDirect` 버튼 텍스트를 `<span>로그인 없이 둘러보기</span>`로 교체.
  - 하단 텍스트 링크의 `#landGuestBtn`을 감싸는 래퍼를 `display:none;` 처리하여 화면 중복 노출을 해소하고 기존 스크립트 클릭 트리거 무결성을 100% 보존.

### 3-2. 스토리지 원장화 3대 명세 (헌법 제2조 제4항)
1. **1호 (원격 DB 스키마 명세)**: 게스트 로그인 방식 유지로 DDL 변경 불필요.
2. **2호 (스마트 스토리지 분기 설계)**: 기존 게스트 세션 키(`ourgoal_guest_session`, `state.profile`) 정상 작동.
3. **3호 (4대 뷰 전파 배선도)**: 게스트 진입 후 `renderAll()` 호출로 홈, 목표, 일정, 기록 뷰 정상 초기화.

### 3-3. 전수 인터랙션 (Zero-Dead-Click) 명세표
| 요소 ID | 이벤트 | 트리거 동작 | 피드백 및 결과 |
| :--- | :---: | :--- | :--- |
| `#btnLandingPreviewDirect` | click | `landGuestBtn.click()` 호출 | 게스트 세션 생성 후 메인 홈 화면으로 즉시 진입 |

### 3-4. 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항)
```
[랜딩 화면: landingScreen]
  └─ [Hero 헤드라인] "오늘 한 줄이 내일의 나를 만들어요"
  └─ [핵심 CTA 영역]
       ├─ [메인 버튼: btnLandingPreviewDirect] ➔ "로그인 없이 둘러보기" (단일 강조)
       ├─ [카카오 소셜 버튼: landKakaoBtn] ➔ "카카오로 3초 만에 시작하기"
       ├─ [익명 보장 뱃지: landAnonymityBadge]
       └─ [보조 링크들] 닉네임 빠른 시작 / 로그인
```

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

### 4-1. 맹점 및 허점 비판적 분석
1. **기존 자동화 테스트와의 충돌 점검**:
   - `smoke-test.js` 3705행에서 `assert.ok(html.includes('id="landGuestBtn"'))`를 검증하고 있음.
   - **보완책**: `id="landGuestBtn"` 요소를 DOM에 온전히 유지하여 테스트 깨짐을 원천 방지함.
2. **이모지('⚡') 제거 여부 확인**:
   - 상민님 지시: "로그인 창에서 3초 성소 둘러보기 삭제하고 그냥 로그인 없이 둘러보기로 바꿔"
   - 불필요한 번개 아이콘이나 '3초 성소' 등의 수식어를 모두 빼고 담백하게 `로그인 없이 둘러보기`로 확정.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. **Step 1: 마크업 텍스트 교체**:
   - `index.html` 65행의 `#btnLandingPreviewDirect` 내부 `<span>⚡ 3초 성소 새 UI/UX 바로 둘러보기</span>`를 `<span>로그인 없이 둘러보기</span>`로 수정.
2. **Step 2: 중복 링크 화면 정리**:
   - 74행의 `span.land-login-link` 내 `landGuestBtn` 노출부를 정리하여 화면 중복 제거.
3. **Step 3: 테스트 및 스크립트 검증**:
   - `scripts/smoke-test.js`에 `#TASK-ES-188` 검증 추가.
   - `npm test` 및 `verify-integrity-gate.js` 실행.
4. **Step 4: CDP 실측 스크린샷 캡처**:
   - 랜딩 화면 375px 모바일 실측 스크린샷 캡처.
5. **Step 5: 로컬 main 병합 (4단계) 및 Vercel 프리뷰 배포 (5A)**.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

### 6-1. 단일 실패점(SPOF) 및 가설 검증
- **검증 1**: 상단 버튼 클릭 시 `document.getElementById('landGuestBtn').click()`이 정상 트리거되는가?
  - ➔ `landGuestBtn`은 DOM에 존재하므로 정상 클릭 트리거됨.
- **재검증 도출 수정사항**:
  - `landGuestBtn`을 감싸는 부모 `span`에 `style="display:none;"`을 적용하여 화면에는 보이지 않되 DOM 트리에는 남아있도록 배선.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

1. **기능 기준**:
   - 랜딩 화면 메인 버튼 텍스트가 정확히 `로그인 없이 둘러보기`로 표시됨.
   - "3초 성소"라는 문구가 랜딩 화면 UI에서 0건으로 완전 제거됨.
   - 버튼 클릭 시 게스트 로그인 및 메인 화면 진입 100% 정상 작동.
2. **기술 기준**:
   - `npm test` 326개 이상 ALL PASS.
   - `verify-integrity-gate.js` ALL PASS.
   - 랜딩 화면 실측 캡처 완료.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

1. **블로커 시나리오**: 기존 테스트에서 '3초 성소' 문자열을 검사하는 단언문이 존재하는지 여부.
   - ➔ 사전 정적 검색 결과 `smoke-test.js`에 해당 문자열 단언문 없음을 확인 완료.
2. **롤백 계획**:
   - 문제 발생 시 `git checkout main`으로 즉시 원복.
