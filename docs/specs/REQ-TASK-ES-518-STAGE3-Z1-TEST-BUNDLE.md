# REQ — #TASK-ES-518 시험지 선행: 인라인 3단계 Z1(로그인·계정) 이동 전 시험지 3개가 인라인 합본을 읽음

- 근거: 헌법 CELL_SPLIT 3(시험지 선행 — 기대값·단언·검사 수를 바꾸지 않고 읽는 범위만 넓힌다), 설계 `docs/architecture/INLINE-STAGE3-DESIGN.md` 6절(Z1 로그인·계정 — 시험지 선행 1), 합본 도구 `tests/helpers/inline-bundle.js`(#TASK-ES-441·#TASK-ES-465 — js/tabs 세포 + js/core 이전 세포). 작업참고 `C:/dev/agent-knowledge/WORK-REFERENCE.md` 기준 PR #802.
- 범위: 시험지 3개의 index.html 읽기 한 줄씩 → `require('./helpers/inline-bundle').withInlineCells(…)`. 제품 코드 0, 단언·기대값·검사 수 0 변경, retire 0.
- 작업 유형(SNOWBALL): (가) 표준 — L021(시험지 선행, #751·#780 과 같은 모양). 이탈 없음.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지
Z1 구역 묶음(Supabase · 뱃지 컬렉션의 프로필 불러오기 · 서버 관리자 API 복구 · 2계정 상호작용 테스트 · 소셜 로그인 · 새 비밀번호 입력 모달 · 회원 탈퇴 30일 유예 · 회원 탈퇴 전용 안내 모달)을 생성기(`gen-inline-hard.js`)로 세포에 옮긴 사본에서 tests 전부를 기준 사본과 맞대자, 기준에서 통과하던 시험지 3개가 실패했다: `tests/account-withdrawal-modal.test.js`(탈퇴 창 배선 글자) · `tests/google-session-guard.test.js`(initGoogleOneTap 등 함수 잘라 실행) · `tests/security-audit.test.js`(sync_records 의 Authorization 헤더 글자). 법정은 기준 커밋 시험지로 채점하므로 시험지를 먼저 병합해야 한다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- **본질**: 세 시험지가 「그 글자·함수가 index.html 에 있다」를 가정한다.
- **원인**: 세 시험지만 index.html 원문을 `fs.readFileSync` 로 읽는다(같은 구역의 record-ledger-sync·unique-display-name·sync-server-records-render-home 은 이미 합본을 읽어 이동 뒤에도 통과 — 실측).
- **중심**: 읽는 줄만 합본으로 바꾼다.
- **핵심**: 합본은 원문을 맨 앞에 두고 세포 글자의 `L.` 접두만 뗀다 — 아직 인라인에 있는 글자는 원래 자리에서 먼저 찾히고, 옮긴 함수는 이전 전 글자 그대로 찾힌다.

## 3. [원칙 ③] 해결방식
세 파일의 index.html 읽기 한 줄씩을 `withInlineCells(fs.readFileSync(…))` 로(같은 파일의 경로 변수·`--html` 인자 그대로), 주석으로 근거 표시.

## 4. [원칙 ④] 재검토 — 한계
- google-session-guard 의 `--root <다른 저장소>` 실행에서 합본은 이 저장소의 세포를 붙인다(direct-login-guard.test.js·account-switch-isolation.test.js 와 같은 기존 방식). 기본 실행(npm·법정)은 같은 저장소다.
- `scripts/inline-hard-test-probe.js` 의 근사가 놓치는 시험지가 있을 수 있어(L021·#780) 실측은 tests 전부·npm test 4개 스크립트의 종료 코드를 기준 사본과 맞대서 찾았다.

## 5. [원칙 ⑤] 절차
git archive 기준 사본 → 같은 사본에 Z1 묶음 7세포 이동(생성기, verify ok) → tests 전부 종료 코드 비교 → 깨진 3개만 읽는 줄 변경 → `real-move-test-stage3-z1.js` 로 기준·이동 제품 × 기준·새 시험지 4칸 측정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1 「합본이면 시험이 느슨해진다」 → 단언 문장·기대값·검사 수가 그대로이고, 세포 글자는 옮긴 원문 글자 그대로다(옮기기 PR 의 verify 가 토큰 동일을 잰다). 기준 제품에서 새 시험지 결과가 기준 시험지와 같다(종료 코드·출력 줄 수·첫 오류).
- 반론 2 「이동 PR 에서 같이 바꾸면 PR 하나로 끝난다」 → 법정은 기준 커밋 시험지로 채점해 이동 PR 이 「되던 시험이 깨짐」으로 돌려보내진다(L021). 선행 병합이 먼저다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자
`tests/account-withdrawal-modal.test.js` `html` · `tests/google-session-guard.test.js` `html`(`HTML_PATH`) · `tests/security-audit.test.js` Layer 5 `indexHtml`, 합본 `tests/helpers/inline-bundle.js` `withInlineCells`, 측정 `docs/design/harness/module-split/real-move-test-stage3-z1.js`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)
`reports/TASK-ES-518/real-move.json`: 세 시험지 모두 기준 시험지는 이동 제품에서 깨지고(종료 1), 새 시험지는 기준 제품·이동 제품 모두에서 기준 시험지·기준 제품과 같다(종료 0·줄 수·첫 오류 동일). 이동 사본의 tests 전부 비교에서 기준과 다른 것은 이 세 개뿐이었다(git archive 사본이라 기준·이동 모두 실패하는 git 이력 의존 시험지는 양쪽 같음).

[4단계: 심사 청구]
