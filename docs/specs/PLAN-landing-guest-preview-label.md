# PLAN-landing-guest-preview-label: 로그인 창 둘러보기 버튼 문구 정돈 (로그인 없이 둘러보기) 엔지니어링 작업계획서
# (헌법 버전: 2026.09.18-SUPREME-15-ARTICLES-VISUAL-INTEGRITY-ENHANCED 준수 정본)

> **문서 상태**: 엔지니어링 계획 수립 완료 (자율 무중단 집행 개시)  
> **세션 ID**: `a63b03bc`  
> **티켓 번호**: `#TASK-ES-188`  
> **귀속 본질 축**: **FIX (UI 텍스트 정합성)** & **INFRA (인증 랜딩)**  
> **마감 상한선**: **[4단계: 로컬 메인 병합 및 5A 프리뷰 배포]** (헌법 제9조 제3항 준수)  

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

### 1-1. REQ 핵심 요약
- 랜딩 화면 상단 메인 CTA 버튼(`#btnLandingPreviewDirect`)의 텍스트를 `⚡ 3초 성소 새 UI/UX 바로 둘러보기`에서 담백하고 표준적인 `로그인 없이 둘러보기`로 교체.
- 하단 텍스트 링크에 중복 노출되던 `로그인 없이 바로 둘러보기 ›`(`span.land-login-link`)를 화면에서 숨김 처리(`display:none;`)하여 정보 위계를 단일화하고, `smoke-test.js`의 `#landGuestBtn` 검증을 100% 보존.

### 1-2. 영향받는 파일 전수 목록
1. `index.html`: 랜딩 화면 CTA 마크업 수정 (65행, 74행).
2. `scripts/smoke-test.js`: `#TASK-ES-188` 자동화 테스트 케이스 추가.
3. `docs/specs/REQ-landing-guest-preview-label.md`: 기획 정본.
4. `docs/specs/PLAN-landing-guest-preview-label.md`: 본 엔지니어링 계획 정본.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 본질 (Essence)
- 본 엔지니어링 작업의 본질은 "신규 유저가 처음 마주하는 첫인상인 랜딩 화면에서 임시 개발 버전용 수식어('3초 성소')를 완전히 제거하고, 직관적이고 군더더기 없는 게스트 진입 버튼('로그인 없이 둘러보기')으로 온보딩 진입 장벽을 낮추는 것"이다.

### 2-2. 원인 (Root Causes)
1. 과거 UI 대개편 시연 시 추가되었던 임시 라벨이 정돈되지 않고 방치됨.
2. 상단 버튼과 하단 텍스트 링크의 2중 중복 배선.

### 2-3. 중심 (Core Bottleneck)
- **"기존 게스트 로그인 파이프라인(`landGuestBtn.click()`)과의 100% 무결 연동"**:
  - 마크업 문구는 심플하게 변경하되, 클릭 시 기존 게스트 초기화(`landGuestBtn`)가 0.1초 만에 정상 발동되어야 함.

### 2-4. 핵심 (Critical Anchor)
- **Zero Regression**:
  - `id="landGuestBtn"` DOM 요소 및 `smoke-test.js`의 기존 326개 테스트가 단 1건도 깨지지 않도록 하위 호환성을 완벽히 보존.

### 2-5. 종단간 데이터 흐름 다이어그램
```
[유저 랜딩 화면 방문]
   │
   ▼
[메인 버튼 클릭: "로그인 없이 둘러보기"]
   │
   ▼
[onclick="document.getElementById('landGuestBtn').click();"]
   │
   ▼
[landGuestBtn 이벤트 리스너 발동]
   ├─ guest 세션 생성 및 초기 profile 적립
   ├─ setTab('home')
   └─ renderAll() ➔ 4대 뷰 동시 렌더링
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 3-1. 파일별 예상 Diff Budget
| 파일명 | 변경 내용 | 예상 추가 줄 | 예상 삭제 줄 |
| :--- | :--- | :---: | :---: |
| `index.html` | 버튼 텍스트 변경 및 중복 링크 숨김 | +2 | -2 |
| `scripts/smoke-test.js` | #TASK-ES-188 테스트 추가 | +10 | -0 |

### 3-2. 4위 1체 배선 명세 (헌법 제3조 제2항)
1. **마크업(Markup)**: `<button id="btnLandingPreviewDirect"><span>로그인 없이 둘러보기</span></button>`
2. **이벤트 리스너(Listener)**: `onclick="document.getElementById('landGuestBtn').click();"`
3. **비즈니스 로직(Handler & Logic)**: 기존 게스트 세션 생성 및 홈 이동 로직 보존.
4. **사용자 피드백 및 예외 처리(Feedback & Error Handling)**: 즉각적인 홈 화면 전환.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Integrity Assurance)

### 4-1. 기존 기능 불파괴 검증
- **카카오 로그인 보존**: `landKakaoBtn` 정상 동작.
- **게스트 온보딩 보존**: `landGuestBtn` 정상 트리거.
- **닉네임 시작 보존**: `landNickQuickLink` 정상 동작.
- **2계정 테스트 보존**: `landTesterBBtn` 정상 동작.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (`index.html` 수정)**:
   - 65행: `<span>⚡ 3초 성소 새 UI/UX 바로 둘러보기</span>` ➔ `<span>로그인 없이 둘러보기</span>`로 교체.
   - 74행: `<span class="land-login-link" style="margin-top:4px;"><b id="landGuestBtn"...` ➔ `<span class="land-login-link" style="display:none;" aria-hidden="true"><b id="landGuestBtn"...`로 숨김 처리.
2. **Step 2 (`scripts/smoke-test.js` 테스트 추가)**:
   - `#TASK-ES-188` 검증 추가.
3. **Step 3 (테스트 실행)**:
   - `npm test` 및 `node scripts/verify-integrity-gate.js` 실행.
4. **Step 4 (CDP 실측 캡처)**:
   - 375×812 모바일 뷰포트에서 랜딩 화면 실측 캡처.
5. **Step 5 (로컬 메인 병합 및 프리뷰 배포)**:
   - 로컬 `main`에 병합 (4단계) 및 PR 생성/프리뷰 배포(5A).

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)

1. **[시나리오 A] Zero Dead-Click**:
   - "로그인 없이 둘러보기" 버튼 클릭 시 즉시 게스트 로그인되어 홈 화면으로 전환되는지 확인.
2. **[시나리오 B] Zero Data Loss**:
   - 게스트 프로필 생성 및 기존 데이터 불변 검증.
3. **[시나리오 C] Zero UX Regression**:
   - `smoke-test.js` 3705행의 `assert.ok(html.includes('id="landGuestBtn"'))` 통과 확인.
4. **[시나리오 D] Full State Propagation**:
   - 게스트 진입 후 홈 탭, 캘린더, 목표 탭 모두 정상 초기화 확인.
5. **[시나리오 E] Gatekeeper PASS**:
   - `verify-integrity-gate.js` 22개 검사 전수 PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)

- [ ] **1단계 (기획·설계)**: REQ 및 PLAN 문서 작성 및 정적 규격 통과
- [ ] **2단계 (내부 시뮬레이션)**: 브랜치 `feat/landing-guest-preview-label-es188`에서 코드 수정 및 테스트 통과
- [ ] **3단계 (로컬 수동 확인)**: Chrome CDP 실측 캡처 및 5대 시각 감사 수행
- [ ] **4단계 (로컬 메인 병합 & 5A 프리뷰)**: 로컬 main에 병합 후 Vercel 프리뷰 배포 자동 실행 및 URL 확보 (세션 마감선)
- *(5단계 프로덕션 배포 및 6단계 실운영 확인은 상민님 명시적 배포 승인 시에만 진행)*

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

1. **잠재 오류**: 버튼 텍스트 변경 시 CSS 줄바꿈 발생 여부.
   - ➔ 텍스트가 훨씬 짧아져("로그인 없이 둘러보기") 375px에서도 한 줄로 완벽히 렌더링됨.
2. **롤백 계획**:
   - `git checkout main && git branch -D feat/landing-guest-preview-label-es188`로 즉시 원복.
