# 정식 theme packet 독립 소스 검토

정확99ef804e의 최초 의견은 FIRST.json이다. **FORMAL-R1: 초기 인사창의 발생을 확인하지 않고 hidden만 대기하는 시나리오 전제를 교정해야 한다.** 실제 실행·실패 재현은 하지 않았고 제품 결함이나 기존 PC 실패로 판정하지 않는다. root가 같은 source의 별도 교정1을 맡으며 이 검토는 제품/claims/scenario를 쓰지 않았다.

`enterApp`은 shell을 먼저 활성화하고 여러 await 뒤 인사창 timer를 예약한다. 반면 현재 각 formal scenario는 shell→notVisible만 있다. Court `pollExpect`는 처음 true면 반환하므로 아직 열리지 않은 modal을 통과할 수 있다. 기존 독립 PC는 `ourgoal_avatar_greeted_session` trigger를 기다린 다음 hidden을 기다렸다. 실제 정상 fresh guest의 visible→notVisible 전제가 더 정확하며, 단계를 추가하면 fix symptom도 기존 숫자를 고정하지 말고 placeholder 단언의 1-based 위치로 산출해야 한다. 실제 Court 결과는 null이다.

나머지 검토 범위와 근거는 SOURCE-REVIEW.json에서 산출했다.

- 승인 원파일의 현재 SHA가 지정7018과 일치한다. 마9 확정 문구와 후속 바9 재량의 근거를 인수했으며 규범·승인선을 바꾸지 않았다.
- formal claims와 scenario 수, 제품 coverage는 SOURCE-REVIEW.json.claimCount/scenarioCount/coveredProductCount에 있다. 실제 다섯 제품은 frozen57f Git bytes와 같고 누락된 제품 touches는 없다. 초기 HTML/네 테마, quickchip, guest-save와 두 unverified를 구분한다.
- theme/quickchip/guest-save의 symptom은 현재 placeholder attr 기대를 가리킨다. old baseline에서도 성공하는지, 해당 단계보다 먼저 modal action이 막히는지는 runtime 미측정이다. source에서 성공·NOFIX를 예언하지 않는다. Court의 nonvacuous 검사와 old failure step 비교는 그대로다.
- quickchip/guest-save는 신규 공식 실행 후보로 적혀 있고 새 실행 성공으로 표시하지 않았다. 원 source-conservation은 실제 runtime writer 실행 증명이 아니라 정확 바이트 보존 자료다. 최초 PC4테마·작성자64pin/독립31pin 중 ignored5는 기존 root sealed intake의 층으로 인수했으며 그 전체를 재검사했다고 쓰지 않았다.
- guest-save의 `captureSyncStatus[data-sync-state=local]`은 초기 markup에도 있어 그 단언 하나는 저장 증거가 아니다. 다만 현재 시나리오는 입력 비움과 확정 안내 및 비어 있던 status의 「기기에 보관」 문구도 요구한다. 주장 범위는 UI가 표시한 기기 상태이며 실제 DB/원격 반영·계정 ID 결박·reload 후 지속성·XP 원장 검증으로 승격하지 않는다. 실제 handler는 기기 저장 결과가 failed가 아닐 때만 해당 draft를 비우고 status를 칠한다. 정확 동작은 Court 미실행이다.
- guest-save는 후속 requestAIFeedback를 호출할 수 있다. packet은 static origin의 `/api/feedback` POST 가능성과 실제 backend 부재를 밝히고 API/nonGET0을 주장하지 않는다. 이번 reviewer의 실행0과 향후 Court 시나리오의 요청을 혼동하지 않는다. SQL3/첫지표/원 운영한건 예산 재사용은 없다.
- CSS의 visual-quality는 사람 눈 품질 주장으로, 신규 온보딩 첫 tutorial은 실제 신규가입/로그인 상태와 허용 fixture 한계를 근거로 needs-login으로 분리했다. PC에서 가능한 네 테마 조작을 needs-login으로 숨기지 않았다. computed pseudo 색·대표 PNG 대비가 전역 glyph최소값이나 공식 시각 품질 인증은 아니다.
- smoke-test diff는 정확 두 기존 check명의 세 텍스트 기대를 승인 literal로 맞춘 것이다. negative value-injection/caption과 기존 실행 단언을 제거하는 변경은 이 diff에 없다. helper의 기대를 exact 함수 source로, 저장 기대를 exact capture source로 좁힌 점도 공개했다. 과거 실패409/30→437/2→438/1과 test-only commit은 그대로다. 필수 검사 exit0은 기존 root metadata 인수이며 이번 suite 실행0이다.

모델은 자기 최신 turn_context, 선택 이유와 source pins는 SOURCE-REVIEW.json이다. 별도 worktree의 source-only report 작성만 수행했다. browser/test/suite/API/원격/제품/claims/운영 변경0, 지속 child/browser 시작0. normal docs commit의 기존 gate는 우회하지 않는다. 정식 Court·운영 사용·효과는 모두 미확인이다.
