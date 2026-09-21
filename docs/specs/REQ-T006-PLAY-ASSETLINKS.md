# 요구사항 정의서 (REQ) — Play Console 폐쇄 테스트 준비: assetlinks 운영 배포·서명키 유출 차단·런북 보강

> **문서 ID**: REQ-T006-PLAY-ASSETLINKS
> **티켓 연계**: #T006 (아워골 일자별 실행 로드맵 T006, P0, D0~2 지인 배포)
> **작성 일시**: 2026-09-21
> **작성자**: Claude 세션 91258e2a (양비스 자동 소환, 세션 b483566a 이어받음)
> **규범 준수**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 제2조 2중 8원칙

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **로드맵 원문**: "Play Console 계정·폐쇄 테스트 트랙 준비" — 완료 기준 "옵트인 링크 1개, 테스터 16명 등록".
- **로드맵 세부 절차 원문(지시 항목)**:
  1. Google Play 개발자 계정 등록($25 결제·신분 확인).
  2. 웹앱을 Android 패키지(AAB)로 만들고 서명키를 보관한다.
  3. `/.well-known/assetlinks.json` 을 Vercel 에 배포한다(패키지명·SHA256).
  4. Play Console 앱 생성 → 폐쇄 테스트 트랙 → AAB 업로드 → 테스터 이메일 리스트(지인 16명) → 옵트인 링크 확보.
  5. 스토어 등록정보 임시(이름·짧은 설명·아이콘·스크린샷 2장).
- **착수 실측(2026-09-21 15:47 KST)**:
  1. AAB(`android-twa/app-release-bundle.aab`, 3.6MB, 09-17 생성)·서명키(`android-twa/ourgoal-release-key.keystore`)·런북(`docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md`)은 이미 있다.
  2. `keytool -printcert -jarfile` 로 잰 AAB 서명 인증서 SHA256 = `64:C7:32:00:24:A4:43:89:67:4C:D9:05:97:5F:59:ED:08:9E:63:66:C9:A3:1A:70:CF:D3:6B:FC:B9:9C:04:BB`. 로컬 `.well-known/assetlinks.json` 의 지문과 문자열이 같다.
  3. 운영 `https://ourgoal-app.vercel.app/.well-known/assetlinks.json` 은 **HTTP 404** 다. `.well-known/` 이 git 에 없어서 배포된 적이 없다.
  4. 서명키·AAB·APK 가 `.gitignore` 에 없다. `git add -A` 한 번이면 서명키가 공개 이력에 들어간다.
  5. 런북에 "Play 앱 서명" 절차가 없다. Play 가 업로드된 AAB 를 자기 키로 다시 서명하므로, 그 키의 지문이 assetlinks 에 없으면 스토어에서 받은 앱은 주소창이 보인다.
- **사용자 상황**: 지인 16명이 옵트인 링크로 설치했을 때 앱이 "브라우저 주소창이 달린 웹페이지"로 뜨면 첫인상에서 앱이 아니게 된다.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질**: 지인이 링크 하나로 **앱답게 뜨는** 아워골을 설치하는 것. 계정·트랙은 그 수단이다.
- **원인**: 09-17 에 AAB 와 assetlinks 를 로컬에서 만들고 끝냈다. 만든 것이 저장소에 들어가지 않아 운영에 나간 적이 없고, 서명키를 지키는 장치도 없다.
- **중심**: `[AAB 서명 지문] ↔ [운영 assetlinks.json 의 지문]` 이 일치해야 TWA 검증이 통과한다. 끊긴 곳은 "운영에 파일이 없음" 하나다.
- **핵심**: 세션이 할 수 있는 것(파일 배포·유출 차단·절차 문서)과 사람 손이 필요한 것(결제·신분 확인·콘솔 로그인·테스터 이메일)을 섞지 않고, 뒤의 것을 했다고 적지 않는 것.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **FR-01 assetlinks 배포**: `.well-known/assetlinks.json` 을 저장소에 넣는다. 패키지명 `com.yangbis.ourgoal`, 지문은 AAB 실측값.
- **FR-02 서명키 유출 차단**: `.gitignore` 에 `*.keystore`·`*.jks`·`*.aab`·`*.apk`·`*.idsig`·`android-twa/` 를 넣는다.
- **FR-03 런북 보강**: 계정 등록 `[손 필요]` 절차, Play 앱 서명 키 지문을 assetlinks 에 2번째 지문으로 더하는 절차, 테스터 인원 기준 확인 안내.
- **채택하지 않은 것**: `vercel.json` 의 headers 추가(금고 동결 칸이라 제품과 한 PR 에 못 넣는다. Vercel 은 `.json` 을 `application/json` 으로 내보내므로 필요 없다) · AAB 재생성(이미 있고 지문이 맞다) · 서명키를 저장소에 넣어 백업(공개 저장소 유출이다).

### 3-1. 스토리지 원장화 명세
- 서명키 정본은 `C:\dev\ourgoal-app\android-twa\ourgoal-release-key.keystore` 로컬 파일 하나다. 저장소·노션·로그에 복제하지 않는다. 분실하면 업로드 키 재설정을 Play 지원에 요청해야 하므로 오프라인 백업은 상민님 몫으로 런북에 적는다.

### 3-2. 전수 인터랙션(Zero-Dead-Click) 명세표
| UI 요소 | 변경 | 비고 |
| :--- | :--- | :--- |
| 없음 | 없음 | 본 작업은 앱 화면을 바꾸지 않는다 |

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)
- Vercel 이 점(.)으로 시작하는 디렉터리를 정적 서빙하지 않을 수 있다 → PR 프리뷰 주소에서 먼저 200 을 재고, 안 되면 병합하지 않고 방식을 바꾼다.
- 로컬의 미추적 `.vercelignore` 에 `.well-known` 이 들어 있다 → git 연동 배포에는 영향이 없지만 `vercel` CLI 로 직접 배포하면 빠진다. 런북에 적는다. `.vercelignore` 는 금고 동결 파일이라 이 PR 에서 건드리지 않는다.
- 지문 1개만으로는 Play 가 재서명한 앱에서 검증이 실패한다 → 지금은 업로드 전이라 Play 서명 키가 없다. 런북에 "업로드 직후 할 일"로 남기고, 완료했다고 적지 않는다.
- `android-twa/` 를 통째로 무시하면 `twa-manifest.json` 도 저장소에 없다 → 그 파일에는 서명키의 로컬 절대경로가 들어 있고 bubblewrap 이 다시 만들 수 있다. 무시 쪽이 안전하다.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)
1. AAB 서명 지문을 재고 assetlinks 값과 대조한다.
2. 워크트리에 assetlinks·`.gitignore`·런북·REQ·PLAN·TICKETS·dev_log·주장 파일을 넣는다.
3. `git check-ignore` 로 서명키·AAB·APK 가 잡히는지 잰다.
4. `npm test` → 브랜치 푸시 → 초안 PR(4블록) → 프리뷰 주소에서 assetlinks 200 실측.
5. 법정 판정을 기다린다. 통과면 병합하고 운영 주소에서 200·본문 일치를 잰다.
6. 노션 로드맵 행에 실측과 `[손 필요]` 를 남긴다. 완료요청은 켜지 않는다.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- 2번이 기존 기능을 깨는가: 새 정적 파일 1개와 무시 규칙뿐이다. `index.html`·`api/*`·`sw.js`·`vercel.json` 은 0줄 변경이다.
- 3번의 무시 규칙이 이미 추적 중인 파일을 숨기는가: `git ls-files` 에 `.keystore`·`.aab`·`.apk`·`android-twa/` 가 0건임을 먼저 확인한다.
- 4번 프리뷰 실측이 단일 실패점인가: 프리뷰가 막혀 있어도(로그인 보호) 병합 뒤 운영 실측이 최종 판정이다. 운영이 404 면 되돌린다.
- 5번에서 법정이 통과를 주지 않으면 병합하지 않고 PR 을 열어 둔 채 보고한다.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)
- AAB 실측 지문과 assetlinks 지문이 문자열로 같다.
- `git check-ignore` 가 서명키·AAB·APK 3종을 전부 잡는다.
- 운영 `/.well-known/assetlinks.json` 이 HTTP 200 이고, 본문의 `package_name`·지문이 실측값과 같다.
- `npm test` 결과를 수치로 인용한다.
- 로드맵 완료 기준(옵트인 링크 1개·테스터 16명)은 이 작업으로 **충족되지 않는다**. 충족됐다고 적지 않는다.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- 개발자 계정 $25 결제·신분 확인·Play Console 로그인·테스터 16명 이메일은 세션이 할 수 없다 → `[손 필요]`.
- 운영이 병합 뒤에도 404 면 → 1~3 재검토(서버 함수 경유 등 다른 서빙 방식).
- AAB 를 다시 만들거나 서명키를 바꾸면 지문이 달라진다 → assetlinks 를 다시 재서 고친다.
- Play 앱 서명 키 지문을 더한 뒤에는 실제 폰에서 주소창이 사라졌는지 봐야 한다 → 진짜 폰 확인, `[손 필요]`.
