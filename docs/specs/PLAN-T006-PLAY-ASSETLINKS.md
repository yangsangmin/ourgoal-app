# 구현 계획서 (PLAN) — Play Console 폐쇄 테스트 준비: assetlinks 운영 배포·서명키 유출 차단·런북 보강

> **문서 ID**: PLAN-T006-PLAY-ASSETLINKS
> **티켓 연계**: #T006
> **선행 문서**: `docs/specs/REQ-T006-PLAY-ASSETLINKS.md`
> **작성 일시**: 2026-09-21
> **작성자**: Claude 세션 91258e2a
> **규범 준수**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 제2조 2중 8원칙

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- 아워골은 빌드 단계가 없는 정적 배포다. 저장소 루트의 파일이 그대로 `https://ourgoal-app.vercel.app/<경로>` 로 나간다.
- TWA(Trusted Web Activity)는 앱 실행 때 `https://<host>/.well-known/assetlinks.json` 을 받아 패키지명과 서명 인증서 지문을 대조한다. 일치하면 주소창 없이, 아니면 Custom Tabs(주소창 있음)로 뜬다.
- 변경 범위: 새 정적 파일 1개(`.well-known/assetlinks.json`), 무시 규칙(`.gitignore`), 문서(런북·REQ·PLAN·TICKETS·dev_log), 주장 파일(`reports/T006/claims.json`).
- 범위 밖: `index.html`·`js/**`·`api/**`·`sw.js`·`vercel.json`·`.vercelignore`·`court/**`.

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence & Core Wiring)
- **본질**: 스토어에서 받은 아워골이 주소창 없는 앱으로 뜨게 하는 검증 배선을 운영에 실제로 놓는 것.
- **원인**: "assetlinks.json → 운영 URL" 구간이 끊겨 있다. 파일이 git 에 없어 배포물에 들어간 적이 없다.
- **중심**: `서명키 → AAB 서명 인증서 SHA256 → assetlinks.json 의 sha256_cert_fingerprints → 운영 URL 200 → TWA 검증 통과`.
- **핵심**: 지문은 손으로 옮기지 않고 `keytool` 산출값과 파일 값을 스크립트로 대조한다. 앞으로 끊길 곳은 Play 앱 서명이다 — 업로드 뒤 Play 가 발급하는 앱 서명 키 지문이 배열에 하나 더 들어가야 한다.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
| 파일 | 변경 | 예산 |
| :--- | :--- | :--- |
| `.well-known/assetlinks.json` | 신규. 로컬에서 만든 파일 그대로 | 14줄 |
| `.gitignore` | 서명키·Android 산출물 무시 규칙 추가 | 10줄 이내 |
| `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md` | 0단계(계정 등록 `[손 필요]`)·3-A단계(Play 앱 서명 지문)·테스터 인원 안내 추가 | 60줄 이내 |
| `docs/specs/REQ-…`, `PLAN-…` | 신규 | — |
| `docs/rules/TICKETS.md` | #T006 1줄 | 1줄 |
| `dev_log.md` | 끝에 1건 추가 | 15줄 이내 |
| `reports/T006/claims.json` | 신규 주장 파일 | — |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Non-Destruction)
- 기존 경로와 겹치지 않는다: `vercel.json` rewrites 에 `/.well-known` 이 없고, 같은 이름의 파일도 없다.
- 서비스워커(`sw.js`)는 `/.well-known/*` 를 가로채지 않아도 된다. TWA 검증은 앱이 아니라 Android 가 직접 받는다.
- `.gitignore` 추가는 추적 중인 파일에 영향이 없다. 추가 전 `git ls-files` 로 해당 패턴 0건을 확인한다.
- `android/`(Capacitor)는 무시 대상에 넣지 않는다. 추적 중인 제품 코드다.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `keytool -printcert -jarfile android-twa/app-release-bundle.aab` → SHA256 기록.
2. 워크트리(`infra/t006-assetlinks-deploy`)를 `origin/main` 으로 올린다.
3. `.well-known/assetlinks.json` 복사 → 지문 문자열 대조.
4. `.gitignore` 추가 → `git check-ignore -v` 로 3종 확인.
5. 런북 보강 → REQ·PLAN·TICKETS·dev_log·주장 파일 작성.
6. `npm test` → 커밋(`[INFRA] #T006 …`) → 푸시 → 초안 PR.
7. 프리뷰 주소에서 `/.well-known/assetlinks.json` 을 잰다.
8. `node court/chat.js <PR번호>` 로 법정 판정을 읽는다. 통과면 병합 → 운영 주소 실측.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)
- **지문 일치**: 1번 산출값과 3번 파일 값이 같은 문자열인가(스크립트로 비교, 손으로 옮기지 않는다).
- **유출 차단**: `git check-ignore` 가 `ourgoal-release-key.keystore`·`app-release-bundle.aab`·`app-release-signed.apk` 를 전부 잡는가. `git status` 에 `android-twa/` 가 더는 안 보이는가.
- **운영 서빙**: 병합 뒤 `curl -s -o - -w "%{http_code} %{content_type}"` 가 200 과 json 을 내는가. 본문을 파싱한 `package_name`·지문이 1번 값과 같은가.
- **불파괴**: `npm test` 통과 수가 main 과 같은가. 운영 `/`·`/manifest.json` 이 200 인가.
- **정직성**: 옵트인 링크·테스터 16명·Play 서명 지문은 "확인 못 함"으로 주장 파일에 낸다.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)
- [ ] AAB 지문 실측 = assetlinks 지문
- [ ] `.gitignore` 3종 차단 실측
- [ ] 런북 0단계·3-A단계 추가
- [ ] `npm test` 수치 인용
- [ ] 초안 PR + 프리뷰 실측
- [ ] 법정 판정 확인 → 통과 시 병합 → 운영 200·본문 일치
- [ ] 로드맵 행에 실측·`[손 필요]` 기록(완료요청 켜지 않음)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)
- 프리뷰가 Vercel 로그인 보호로 401 이면 → 프리뷰 실측은 "측정불가"로 적고 병합 뒤 운영 실측으로 판정한다.
- 운영이 404 면 → PR 을 되돌리고(정적 파일 1개라 부작용 없음) 서빙 방식을 다시 정한다.
- 법정이 통과를 주지 않으면 → 병합하지 않는다. 돌려보냄이면 고쳐서 다시 심사받는다.
- 롤백: 이 PR 을 되돌리면 운영에서 파일이 사라지고 이전 상태(404)로 돌아간다. 아직 스토어에 올라간 앱이 없으므로 사용자 영향은 없다.
