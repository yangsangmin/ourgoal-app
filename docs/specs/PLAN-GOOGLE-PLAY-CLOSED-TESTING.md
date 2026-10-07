# [PLAN] #TASK-GOOGLE-PLAY-CLOSED-TESTING 아워골 구글 플레이 비공개 테스트 버전 출시 지원 작업계획서

- **문서 번호**: PLAN-GOOGLE-PLAY-CLOSED-TESTING
- **작성 일자**: 2026-09-17
- **적용 규정**: 아워골 최고 헌법 15대 조문 (AGENTS.md) & 문제해결 8원칙 (2사이클 PLAN)
- **대상 과제**: #TASK-GOOGLE-PLAY-CLOSED-TESTING (구글 플레이 콘솔 개발자 계정 승인 후 테스트 버전 출시 지원)
- **담당 축**: INFRA

---

## 1. 파악 (원칙 ①)
- 상민님께서 구글 플레이 콘솔 개발자 계정 승인을 완료한 상태.
- 목표: 아워골 앱(`https://ourgoal-app.vercel.app`)을 구글 플레이 콘솔 비공개 테스트 트랙에 업로드하고, 20인 14일 비공개 테스트를 즉시 시작할 수 있는 완벽한 지원 패키지 구축.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 웹앱 기반 TWA 아키텍처를 Google Play 표준 AAB 바이너리로 승격하고 도메인 암호화 무결성 서명 체계 구축.
- **[원인] (Technical Causes)**: 웹앱 단독으로는 구글 플레이 콘솔 업로드 규격을 충족하지 못하며, SHA-256 서명이 불일치할 경우 주소창 제거 불가.
- **[중심 배선] (Core Wire & Pipeline)**:
  1. **바이너리 빌드 배선**: `Bubblewrap` / `OpenJDK 17` -> TWA Android App Bundle (`app-release-bundle.aab`) 및 서명 키스토어 생성.
  2. **도메인 보안 검증 배선**: 키스토어의 `SHA-256` 지문을 `.well-known/assetlinks.json`에 동기화.
  3. **스토어 콘솔 등록 배선**: 스토어 등록 정보(이름, 설명, 512x512 아이콘, 1024x500 피처 그래픽, 스크린샷 팩) 생성 및 완비.
  4. **정책 심사 배선**: 10대 정책 설문(개인정보처리방침, 데이터 보안, 계정 삭제 등) 원패스 답변지 완비.
  5. **테스터 운영 배선**: 20인 14일 비공개 테스트 가이드 및 참여 초대 멘트 템플릿.
- **[핵심 안전장치] (Critical Safety & Persistence)**: Keystore 파일 및 비밀번호의 영구 격리 보존, 롤백 런북 구축.

---

## 3. 파일별 Before/After 및 변경 예산 (원칙 ③)
- **[NEW] `docs/specs/REQ-GOOGLE-PLAY-CLOSED-TESTING.md`**: 요구사항 정의서.
- **[NEW] `docs/specs/PLAN-GOOGLE-PLAY-CLOSED-TESTING.md`**: 작업계획서 본문.
- **[NEW] `.Codex/작업계획서/5792f927.md`**: 세션 작업계획서.
- **[MODIFY] `.well-known/assetlinks.json`**: 더미 지문을 실제 생성된 서명 키 SHA-256 지문으로 갱신.
- **[NEW] `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md`**: 상민님이 보면서 그대로 따라할 수 있는 초직관적 구글 플레이 콘솔 업로드 런북.
- **[NEW] `promo-assets/feature_graphic_1024x500.png`**: 구글 플레이 필수 1024x500 그래픽 이미지.
- **변경 예산**: 코드베이스의 기존 웹앱 로직 수정 0줄 (인프라 및 에셋, 가이드 문서 추가 중심).

---

## 4. 재검토 (원칙 ④)
- 키스토어 파일(`ourgoal-release-key.keystore`)은 유실 시 앱 업데이트가 불가능하므로 안전한 경로에 보관하고 SHA-256 및 비밀번호를 안전하게 문서화.
- 구글 플레이 정책 상 계정 삭제 URL이 필수이므로 아워골 인앱 탈퇴 로직 및 공식 웹사이트 탈퇴 안내 페이지 연계 확인.

---

## 5. 구현 상세 순서 (원칙 ⑤)
1. OpenJDK 17 설치 확인 및 환경변수 확인.
2. Keystore 생성 및 SHA-256 핑거프린트 추출.
3. Bubblewrap을 통한 TWA 패키징 및 AAB 빌드.
4. `.well-known/assetlinks.json` 갱신.
5. 구글 플레이 스토어 필수 피처 그래픽(1024x500) 및 스토어 등록용 고해상도 스크린샷 팩 준비.
6. `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md`에 스토어 등록정보 복붙 텍스트, 정책 설문 정답표, 비공개 테스트 트랙 생성 및 20인 테스터 운영법 집대성.
7. 5대 무결성 검증 통과 및 상민님께 실물 파일 경로와 함께 1단계~4단계 완료 보고.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **제1검증 (Zero Dead-Click)**: 기존 UI 버튼 동작 보존.
- **제2검증 (Zero UX Regression)**: PWA 매니페스트 및 서비스워커 정상 작동.
- **제3검증 (Zero Data Loss)**: 사용자 데이터 및 스키마 영향 없음.
- **제4검증 (Full State Propagation)**: 에셋 링크 동기화 검증.
- **제5검증 (테스트 100% 통과)**: `npm test` 및 `npm run prepare:google-play` 무결성 검증 100% PASS.
- **단일 실패점(SPOF) 재검증**: OpenJDK 환경변수 미인식 시 수동 경로 폴백 스크립트 장착 확인.

---

## 7. 체크리스트 (원칙 ⑦)
- [ ] OpenJDK 17 및 Android 도구 체인 준비
- [ ] 서명 키스토어 발급 및 SHA-256 추출
- [ ] Android App Bundle (.aab) 빌드 완료
- [ ] .well-known/assetlinks.json 실제 SHA-256 반영
- [ ] 1024x500 피처 그래픽 및 스토어 에셋 번들 완비
- [ ] 구글 플레이 콘솔 입력용 초직관적 런북(스토어 정보, 정책 설문, 테스터 모집 템플릿) 작성
- [ ] 5대 무결성 검증 통과 및 Tri-Sync 동기화

---

## 8. 블로커 대책 (원칙 ⑧)
- JDK 설치 후 프로세스 환경변수 갱신 필요 시 레지스트리/머신 PATH 자동 리로드.
- TWA 빌드 시 에러 발생할 경우 표준 TWA 템플릿 프로젝트를 통해 다이렉트 빌드 파이프라인 가동.
