# 개요
정식 심사 준비용 후보만 작성했다. CANDIDATE-claims.json은 정식 claims.json이 아니다. root가 source-only 확장후보를 선택·통합한 뒤 법정에 제출해야 한다. 이번 작업에서 브라우저·guest 저장·API·수동 suite·Court 실행은 모두0이다. 제품·원독립검토·법정 파일 변경0.

# REQ/PLAN
base313ccae6e37bbce0f184f4e28c854e7c945ecc00, 기존 source57f, origin/main e176, WORKREF984. 원REQ는 reports/TASK-ES-K17-THEME-READABILITY-01a13674/implementation-1/REQ.md다. original SOURCE-PREFLIGHT의 canonical074는 시안/현재화면 차이대조, 077은 안내문구 네theme 가독성, 바9는 50% 고정을 풀되 글귀 유지다. 이번 후보는 077만 주장하며 추천칩/커닝페이퍼/컨디션 삭제 완료나 MASTER 작업을 포함하지 않는다. 승인 원문 결심 기록 SHA7018f6c1a6ee0cddefad9f67517e1f8d71502218dbf3730e47522d62f6d806d4 L94마9/L115바9.

# 핵심 변경사항
1. CANDIDATE-claims.json: 원PC selector를 바탕으로 한 네theme 행동후보와 CSS pseudo 시각품질 미검증 후보, exact 두 check title의 retire 사유.
2. CANDIDATE-runtime-claims.json: quickchip·guest 기기저장 행동후보 및 신규가입 tutorial의 needs-login 후보. 별도 검토 없이 자동 합치지 않는다.
3. scenarios/theme-*.json은 독립PC에서 수행한 정상동작을 닫힌 어휘로 번역했다. :placeholder-shown은 CSS 상태 selector로 count하며, pseudo style 수치가 아니다. 기존PC에서는 Playwright insertText+Control+A/Backspace였으나 Court key에는 Control+A가 없어 한글자 type+Backspace로 바꾼 후보다. 이 번역 자체는 실행하지 않았다.
4. scenarios/quickchip-source-candidate.json 및 guestsave-source-candidate.json은 전적으로 source 기반이며 원PC 미관측이다. 원관측 성공으로 표시하지 않는다.

# Claims
SCHEMA-ONLY.json 및 RUNTIME-SCHEMA-ONLY.json에서 현재 court/claims.js 및 court/lib/scenario.js의 순수 validator만 호출했다. 구조 오류/약점 목록은 비었지만 실행 결과나 법정 판정이 아니다. CANDIDATE 문서의 판정 필드는 없다.

Court scenario.js L16~40: type/key/attr/count/visible은 닫힌 어휘다. fill은 날짜·숫자 등 input 전용이어서 textarea에는 쓸 수 없다. key는 Enter/Escape/Tab/Backspace뿐이다. L229 attr는 getAttribute, L232 style은 getComputedStyle(el)만 사용하고 pseudo 인자가 없다. 따라서 안내 literal은 attr, 입력/삭제 상태변화는 count(#captureInput:placeholder-shown), 실제 읽기 좋음은 tool-cannot-measure/visual-quality로 분리했다. 행동 결과를 visual-quality에 숨기지 않는다. 기존 독립PC raw/PNG/색/폭 자료는 er17theme 보고서에 그대로 있으며 원FIRST/31pin 봉인 변경0.

## Runtime writer별 실제 조건
- **Quickchip**: index.html L65 preview 버튼은 landGuestBtn.click()을 호출한다. inapp-landing.js L163~174는 빈 defaultProfile을 만들며, default-profile.js L27~28 goals/records=[]다. home-cockpit.js L93~152가 fallback 두 버튼과 click→active-cunning→L.applyQuickCunningText를 연결한다. 후보는 `#quickCheckinChips .btn-quick-chip[data-cunningtext="👟 30분 유산소 운동 완주! 땀 흘리며 스트레스 해소 완료 🔥"]`를 지정하고 보이는 label도 textEquals로 확인한다. native CSS selector이므로 Playwright의 :has-text를 넣지 않았다. 클릭 전 notHasClass, 클릭 뒤 hasClass, 그 뒤 exact placeholder가 symptom10이다. base에서는 old 동적 예시, head에서는 확정 문구이므로 단순 처음부터 참인 attr만으로 행동을 주장하는 NOFIX 함정을 피하도록 구성했다. 실제 양쪽 실행은 null.
- **저장 뒤 writer**: checkin-capture.js L145~169 device save 성공 뒤 sameDraft 조건에서 입력을 비우고 literal을 재대입한다. 후보는 신규 guest 한글자 type→captureSave click→placeholder-shown1→승인literal symptom10→captureSyncStatus data-sync-state=local/기기보관문구를 확인한다. native PATCH/원격성공/사용자 원장 저장 주장은 없다. 기기 상태만이며 새 원격 예산을 쓰거나 원SQL 시험 한건을 재사용하는 것이 아니다.
- **저장 부수효과 경계**: home-cockpit.js L187~218가 storage.device.save를 호출하고 device-save.js L136은 guest를 session/send 이전 guest-not-sent로 반환한다. 이것이 저장 전체의 무부수효과를 뜻하지는 않는다. checkin-capture.js는 후속 XP/축하/AI 요청/Notion 호출도 가진다. default settings는 notionSync=false/key빈칸이며 notion-sync.js L21에서 반환한다. ai-feedback-providers.js L34의 `/api/feedback` POST는 실행될 수 있다. Court static-server는 method를 거절하지 않지만 파일만 제공하고 backend handler를 실행하지 않는다. 해당 확장자 없는 API 경로는 static404이며 real remote API가 아니다. 그러므로 이 후보의 후속 실행을 **API/nonGET 요청0**이라고 적으면 틀린다. Chrome DNS 제한·새 ephemeral profile·정상 guest·credential 없는 기본설정과 정적서버가 전제이며 실제외부효과 검증은 null이다. Court의 기존 Supabase SDK 고정 stub도 independentPC의 SDK부재와 다르다.
- **첫 tutorial**: first-checkin-tutorial.js L22는 firstCheckinPending && records.length===0에서만 writer를 실행한다. onboarding.js L212가 pending을 세우고 L244 이후 렌더한다. startOnboarding 호출은 device-session.js L134의 signup 성공 세션 또는 session-entry.js L62의 _isNewSignup 로그인 세션에서 확인했다. 현재 fixture는 guest-fresh.json의 empty localStorage 하나뿐이다. 정상 guest 재온보딩 입구는 발견하지 못했다. source 기반 needs-login 후보로 두며 실제 인증/가입/fixture추가/프로필주입0. 파일에 고정 문구가 있는 사실과 writer 실행은 구분한다.

## 시험지 정합과 승인선
기준 시험지(baseTests)가 제품head를 채점하며 수정된 smoke 파일은 그 채점의 대체품이 아니다(court README5절, judge.js L446~532). TEST-AND-SOURCE-PINS의 정적 check447/447, assert4117/4117은 런타임439와 별개다. 변경은 세 string-pin expectations지만 소속 check title은 두 개다. 모든 check 이름과 negative value-injection 단언은 유지했고 제품 함수를 실행하던 단언을 지운 변경은 없다. helper extractFunction은 문자열 추출이며 제품함수 실행이 아니다. CANDIDATE retire 사유는 승인 literal, old→new, 좁아진 source 범위, 별도root2276/701d commit, 원실패 보존을 담았다. Court가 최종 text/실행형을 판정한다. AL5 일반 hook 분류를 PR981 승인 재사용이나 새로운 규범 승인으로 해석하지 않았다. court/금고/규범/검사명/검사수 변경0.

SOURCE-ONLY-GAPS.json은 원PC만으로는 세writer coverage가 닫히지 않는다는 원상태다. runtime 후보를 추가해도 **실행 성공은 아직 null**이다. 법정에 source codeContains를 ui-behavior 완료로 제출하거나 touches를 넓혀 실제 실행을 가장하지 않는다. root가 정식후보선택·최종파일배치·PR/CI/Court를 담당한다.

# 법정 판정서
null. 이 작업의 산출은 심사 후보와 source근거다. 원독립PC 범위 밖 추가 사용자동작·운영사용·효과는 측정하지 않았다. common309d 연계는 root단독/pending이며 원필수검사6개 exit0 proof theme-integration-required-checks.json은 root 측정으로만 인수한다.
