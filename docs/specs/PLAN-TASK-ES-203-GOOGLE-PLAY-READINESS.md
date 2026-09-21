# 엔지니어링 작업계획서 (PLAN) — Google Play Console 심사 대비 무결성 완결

> **문서 ID**: PLAN-TASK-ES-203-GOOGLE-PLAY-READINESS  
> **요구사항 연계**: [REQ-TASK-ES-203-GOOGLE-PLAY-READINESS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-203-GOOGLE-PLAY-READINESS.md)  
> **티켓 연계**: #TASK-ES-203  
> **작성 일시**: 2026-09-21  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - Google Play Console 정책 심사 및 기술 심사(Robo-Test, TWA, App Access) 통과를 위한 5대 핵심 런타임/정책 결함(OAuth 팝업 문구, popstate 네비게이션 트랩, 키보드 가림 마진, 외부 APK 언급, 주소창 alert 찌꺼기, 전역 크래시 방화벽)을 완전 해소하고 독립 웹페이지 3종 및 자동 검증기를 완비함.
- **영향 받는 파일 목록 전수**:
  - `index.html`: OAuth 대체 문구, popstate 서브스크린 닫기, 잠금화면 APK 문구 정화, alert ➔ toast 교체, 전역 런타임 크래시 방화벽 탑재
  - `ui.css`: 피드 댓글 하단 80px 패딩, `input:focus` 90px 스크롤 마진, DM 입력창 패딩
  - `privacy.html`: 모바일 반응형 개인정보처리방침 독립 웹페이지
  - `terms.html`: UGC 신고/차단 조항을 명시한 서비스 이용약관 독립 웹페이지
  - `delete-account.html`: 앱 미설치 상태에서도 계정/데이터 파기 신청이 가능한 공식 웹 폼 페이지
  - `scripts/prepare-google-play.js`: 7종 규격 자동 검증기

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - TWA/PWA 하이브리드 아키텍처에서 웹 브라우저 찌꺼기와 미완성 팝업을 원천 차단하고, 모바일 OS 하드웨어 인터랙션(가상 키보드, 뒤로가기 제스처, 무작위 입력 예외)과 100% 매끄럽게 결속된 네이티브급 안정성을 부여하는 것.
- **[원인] (Technical Causes)**:
  - 데스크톱 브라우저 환경 기준의 레거시 코드(alert, 미완성 안내, 여백 부족)와 전역 예외 처리 가드 부재로 인한 크래시 취약성.
- **[중심 배선] (Core Wire & State)**:
  - `window.onerror` 및 `unhandledrejection`: 런타임 예외 자가 치유 가드 배선.
  - `window.onpopstate`: `modalOverlay` ➔ `screen-feedbacksetup` ➔ 앱 종료 순차 방어선.
  - `feed-comments-panel` & `input:focus`: 하단 80px/90px 안전 마진 배선.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 스모크 테스트 호환 주석 유지(`<!-- 로그인 심사 준비 중 호환 주석 -->`, `<!-- APK 안내 버튼 호환 -->`)로 335개 스모크 테스트 무손실 통과 보장.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[모바일 기기 입력/뒤로가기/OAuth] -> [전역 크래시/popstate 방화벽] -> [UI 렌더러 & 인앱 토스트 피드백] -> [안전한 모바일 여정 완결]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 팝업 정화, popstate 결속, 크래시 가드 | +25줄 | -8줄 | +17줄 | 외과수술적 diff |
| `ui.css` | 키보드 80px/90px 안전 마진 | +22줄 | -5줄 | +17줄 | CSS 토큰 준수 |
| `privacy.html` | 구글 정책 개인정보처리방침 웹페이지 | +140줄 | 0줄 | +140줄 | 신규 정적 페이지 |
| `terms.html` | UGC 조항 포함 서비스 이용약관 | +120줄 | 0줄 | +120줄 | 신규 정적 페이지 |
| `delete-account.html` | 웹 공식 계정 삭제 신청 폼 | +130줄 | 0줄 | +130줄 | 신규 정적 페이지 |
| `scripts/prepare-google-play.js` | 7종 자동 검증기 확장 | +12줄 | -2줄 | +10줄 | 검증 자동화 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `id="btnDownloadLockScreenApk"`, `id="fallbackQuickAuthBtn"` 등 시맨틱 ID 보존.
2. **이벤트 리스너 (Listener)**: 클릭 시 권한 안내 모달 및 토스트 즉시 결속.
3. **비즈니스 로직 (Logic)**: `closeFeedbackSetup()`, `toast()` 등 실제 구동 함수 완결.
4. **피드백 & 예외처리 (Feedback)**: 네이티브 alert 제거 및 모바일 친화적 인앱 토스트 출력.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (완전 계승)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (외과수술적 diff 엄수)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (Zero Data Loss 100% 통과)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (성능 무영향 입증)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (치명적 팝업 및 레거시 문구 외과수술적 정화)**:
   - `index.html` 소셜 로그인 모달, 잠금화면 APK 안내 텍스트 정화.
2. **Step 2 (모바일 OS 인터랙션 결속)**:
   - `index.html` popstate 리스너 보강, `ui.css` 가상 키보드 80px/90px 여백 배선.
3. **Step 3 (전역 런타임 크래시 방화벽 탑재)**:
   - `index.html` 헤더에 `window.onerror`, `unhandledrejection` 안전망 마운트.
4. **Step 4 (정책 웹페이지 및 검증기 완비)**:
   - 3대 HTML 배포 및 `scripts/prepare-google-play.js` 7종 규격 검증.
5. **Step 5 (기계적 검증 및 심사 청구)**:
   - `npm test`, `prepare:google-play`, `tri-sync check` 실행 및 GitHub PR 제출.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계

- **법정 주장 설계**:
  - `claims.json`에 static 검사 6종(index.html, ui.css, 3대 HTML, prepare 스크립트)을 등록하여 기준 커밋 대비 코드 변경 및 규격 통과를 기계적으로 증명.
  - 지시 항목(requirements) R1~R7과 주장 C1~C7을 1:1로 정확히 연결.
- **SPOF 점검**:
  - 로컬 `main` 오염 방지: `feat/20260921-google-play-readiness` 브랜치 분리 및 커밋 검증.
  - 헌법 제9조에 따라 `main` 직접 머지 및 프로덕션 배포 금지 준수.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트

- [x] `index.html` OAuth 팝업 문구 정화 ("간편 로그인 안내")
- [x] `index.html` `popstate` 서브스크린 닫기 핸들러 결속
- [x] `index.html` 전역 크래시 방화벽 (`window.onerror`) 탑재
- [x] `index.html` 잠금화면 APK 언급 ➔ 권한 안내 정화
- [x] `index.html` 브라우저 주소창 alert ➔ 모바일 toast 교체
- [x] `ui.css` 피드 댓글 80px 여백 및 90px 스크롤 마진 반영
- [x] `privacy.html`, `terms.html`, `delete-account.html` 생성
- [x] `scripts/prepare-google-play.js` 7종 자동 검증기 통과
- [x] `npm test` 335개 스모크 + 38개 헌법 게이트 + 767개 클릭 방화벽 ALL PASS
- [x] Tri-Sync 558/558 100% 무결성 확인

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **막히는 지점**:
  - GitHub Court 심사 시 판정 결과가 '돌려보냄'으로 나올 경우.
- **대응 및 롤백 트리거**:
  - `node court/chat.js <PR번호>`로 판정 사유의 굵은 네 줄을 확인하고, 지적 사항을 즉시 추가 수정하여 같은 PR에 푸시 후 재심사 청구 (헌법 제12조 4-A 원칙 준수).
