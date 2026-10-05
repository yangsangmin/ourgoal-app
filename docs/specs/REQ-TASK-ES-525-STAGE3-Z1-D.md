# REQ — #TASK-ES-525 인라인 3단계 Z1(로그인·계정) 3차: 「소셜 로그인 (카카오 / 실제 구글 OAuth 연동)」 묶음을 세포로 이전(동작 그대로)

- 근거: 헌법 v2026.10.06-SNOWBALL(CELL_SPLIT · CELL_SPLIT_PROOF), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 3-4·6절(Z1), 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802(L016·L045·L046·L047·L042·L010·L009), 시험지 선행 PR #804(#TASK-ES-518 — `tests/google-session-guard.test.js` 가 합본에서 구글 로그인 함수를 잘라 실행).
- 작업 유형(SNOWBALL): (가) 표준 — 표준 이음매(L016). 이탈 1건(아래 4절 L042): 기록 네 가지 적음.

## 1. [원칙 ①] 문제 정확히 파악
인라인 묶음 「소셜 로그인」(306줄 — sha256Hex · parseJwtPayload · handleGoogleUserSuccess · getGoogleTokenClient · startGoogleLogin · initGoogleOneTap · startOAuthLogin, 카카오·구글 단추 처리기 등록 문 2개)이 index.html 에 남아 있다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 옮기기(동작 0 변경). 버그도 그대로.
- **원인**: 외부 OAuth(카카오 동의 화면·구글 GIS)로 넘어가는 경로라 법정 화면으로 잴 수 없어 남아 있었다.
- **중심**: 게스트로 법정이 잴 수 있는 몫(로드 때 단추 처리기 등록 — 로그인 화면이 같다)은 시나리오, 외부 페이지로 넘어가는 몫은 `external-page`, 구글 함수의 판별 규칙은 기존 부품 시험(google-session-guard — 법정이 기준·작업 양쪽에서 돌린다).
- **핵심**: 손으로 옮긴 글자 0, 상태 변수 `_googleTokenClient`·`_googleOneTapNonce` 는 원래 자리(L getter/setter, ⑨ 마지막 getter setter 0).

## 3. [원칙 ③] 해결방식
설정 `docs/design/harness/module-split/inline-stage3-z1-d.json`(자리 「HO 기관」) → `gen-inline-hard.js` → `js/tabs/settings/social-login.js`(347줄): 함수 7개 + `bindKakaoLoginButtons`·`bindGoogleLoginButtons`(감쌈).

## 4. [원칙 ④] 재검토 — 한계(정직하게)
- **이탈(L042 「화면에 안 보이는 기능은 옮기지 말고 결심으로」)** — ① 규칙: L042. ② 왜 맞지 않나(사실): 구글 로그인 단추(`#landGoogleBtn`·`#authGoogleBtn`)는 CSS 숨김 규칙에 갇힌 것이 아니라 #TASK-ES-108(카카오 단일화, 커밋 e80faaa0)이 마크업 `style="display:none;" aria-hidden="true"` 로 일부러 숨긴 상태이고, 같은 묶음의 카카오 시작(startOAuthLogin)은 보이는 단추·소통/백업 안내(peer-invite.js·guest-backup-nudge.js)가 부르는 살아 있는 기능이다. 묶음을 남기면 살아 있는 카카오 경로도 같이 남는다. ③ 대신 한 것: 묶음 전체를 글자 그대로 옮기고(숨김 해제·삭제 없음), 숨김 상태가 같다는 것을 시나리오(`#authGoogleBtn` 안 보임)로 낸다. 숨긴 구글 단추를 살릴지 지울지는 기존 결정(#TASK-ES-108)을 바꾸지 않는다. ④ 검증: 같은 수준 이상 — 토큰 동일·verify ⑧⑨, 구글 함수는 google-session-guard 부품 시험 6건이 합본에서 잘라 실행(법정이 기준·작업에서 돌림), 실계정 비교 0.
- 카카오 단추를 누르면 Supabase OAuth 로 카카오 동의 화면(외부)에 넘어간다 — 법정 실행기로 눌러 보면 앱 첫 화면 주소를 떠난다(로컬 실측, 기준·작업 같음). 결과 화면은 외부라 `external-page`.
- 구글 로그인 결과는 구글 GIS(외부)·구글 계정이 있어야 한다 — `external-page`.
- 실계정 비교는 로그인 상태에서 홈·소통·설정·로그아웃 뒤 로그인 화면(카카오 단추 수·숨긴 구글 단추)까지 — OAuth 로그인 자체는 외부라 재지 않았다.
- `sha256Hex` 는 이 묶음 안팎에서 부르는 곳이 없다(grep) — 고치지 않고 옮겼다(결함 목록: 쓰지 않는 함수).

## 5. [원칙 ⑤] 절차
origin/main → 생성기 → verify(⑧⑨ — #811 판) → 단독 로드 → 신고서·설명 → module-guard → tests 전부 종료 코드 → 게스트 시나리오 로컬 → 실계정 기준1·작업·기준2 → main 합치기 → PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 「숨긴 기능은 L042 대로 옮기지 말아야 한다」 → 4절 이탈 기록. 이번 숨김은 결심 대기 중인 CSS 은폐가 아니라 이미 결정된 마크업 숨김이고, 옮기기는 그 결정을 바꾸지 않는다. 검증은 약해지지 않는다(부품 시험이 구글 함수를 법정에서 돈다).
- 반론 2 「외부 페이지라면 아무것도 재지 않은 것」 → 로드 때 등록 문이 돌아 로그인 화면이 같다는 것(시나리오), 구글 판별 규칙(부품 시험), 로그인 상태 화면(실계정)으로 나눠 잰다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
DOM `#landKakaoBtn` · `#authKakaoBtn` · `#landGoogleBtn` · `#authGoogleBtn` · `#landLoginLink` · `#loginSubmit` · `#logoutBtn` · `#authScreen`, 함수 `startOAuthLogin` · `startGoogleLogin` · `getGoogleTokenClient` · `initGoogleOneTap` · `handleGoogleUserSuccess` · `parseJwtPayload` · `sha256Hex` · `bindKakaoLoginButtons` · `bindGoogleLoginButtons`, 상태 `_googleTokenClient` · `_googleOneTapNonce`, 파일 `js/tabs/settings/social-login.js` · `index.html` · `docs/design/harness/module-split/inline-stage3-z1-d.json` · `real-account-stage3-z1-d-steps.json` · `tests/google-session-guard.test.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
| 항목 | 결과 (출처) |
| :-- | :-- |
| verify | ok · 토큰 동일 · 남은 글자 동일 · 이중 처리기 0 · 키트 순서 0 · 마지막 getter setter 빠짐 0 (`reports/TASK-ES-525/verify-inline-hard.json`) |
| 새 파일 줄 수 | 347 (800 이하) |
| 원본 단독 로드 | 회귀 0 · 새 파일·settings/index·app-scope 단독 로드 ok (`module-load-probe.json`) |
| tests 전후 | tests 전부 종료 코드 기준과 같음(git 이력 의존·기준 사본 시점 차이 제외). google-session-guard 6/6. 처음 측정한 main d49234e 에서는 verify-integrity-gate [검증 16/16] 「페이월 자리 안내 모달 잔존」이 main 자체로 실패했고(#818 이 #813 보다 먼저 병합된 순서 문제 — 오케스트레이터 공지), #813 병합 뒤 main 위 재생성판에서는 npm test 종료 0 |
| 게스트 시나리오 | 1개 기준·작업 통과 (`scenario-local.json`) |
| 실계정 조작 비교 | 테스트 계정 A 4단계 기준1 대 작업 0 · 기준1 대 기준2 0 · 30값 · pageerror 0 (`real-account-compare.json`) |
| 막힐 지점 | #811·#522 와 같은 자리(HO) — 병합 순서대로 생성기 재실행(L010) |

[4단계: 심사 청구]
