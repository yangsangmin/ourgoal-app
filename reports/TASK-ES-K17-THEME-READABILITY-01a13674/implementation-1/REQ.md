# 원077 확정 안내 문구와 네 테마의 가독성

원문: C:\dev\vault\에이전트 토론장\결심 기록.md · SHA256 7018f6c1a6ee0cddefad9f67517e1f8d71502218dbf3730e47522d62f6d806d4

- D-2026-10-13-01 L94: - 마9 「추천 칩 기능, 버튼,  관련내용 모두 삭제해. 추천칩 없앨거야. 빈칸에 '기록하고 나의 역사데이터를 만들어요.' 라고만 회색 50% 투명율로 남기고. 빈칸 선택해서 입력 시작하면 안내글씨 사라지면서 본인의 글 작성할 수 있도록 해.」 — 홈 기록 창. 기능 삭제의 결심.
- D-2026-10-13-02 L115: - 바9 「커닝페이퍼도 지워. 안내글은 너가 알아서 각 테마에서 잘 보이게 디자인해. 50%도 아니어도 돼. 관련 레퍼런스 참고해서 알맞게 적용해.」 — 기능 삭제의 결심(커닝페이퍼 줄). D-2026-10-13-01 마9 의 「회색 50% 투명율」을 이 답이 푼다.

원02 L109·canonical66 바9/077/074 및 원시안의 별도 안내줄/입력칸 구분은 불변 ../SOURCE-PREFLIGHT.json.originalSelected/canonical에 결박한다. 공통 TASK-CC-CELL-UNWIRE-RUN-309dca5d, sourcebase e176. 작업참고 PR984/L137. 위 인용의 삭제결정은 보존하되 이번 구현은 placeholder/가독성만이다.

## 1. [원칙 ①] 파악
#captureInput 초기 HTML과 first-checkin-tutorial.js/checkin-capture.js/checkin-helpers.js의 placeholder 대입이 원확정문구와 달랐다. ui.css의 테마별 old색과 전역0.75 opacity도 겹쳤다. source5파일 exact 전후는 SOURCE-FREEZE.json이다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 빈 입력칸에서 확정 안내를 읽을 수 있게 하는 것이다. 원인은 초기값과 세 runtime writer가 다른 글을 내는 배선이다. 중심은 승인된 #captureInput::placeholder이고 핵심은 문구 일치와 실제 theme별 가독성이다. .capture-sub를 다시 보여 주거나 칩/컨디션을 지우지 않는다.
## 3. [원칙 ③] 해결방식
index.html placeholder와 세 JS 대입만 같은 literal로 바꾼다. ui.css 마지막 규칙에서 실제4theme focus-sanctuary/black/white/urban-city의 해당 pseudo color를 --ink-soft와 불투명 표시로 맞추며 다른 스타일/배경/글자크기/이벤트는 그대로다. 50%/80%를 가정하지 않고 computed값을 측정한다.
## 4. [원칙 ④] 재검토
applyQuickCunningText의 입력/선택/dispatch/focus/haptic/toast, renderFirstCheckinTutorialBanner의 흐름, bindCaptureSave의 자료/세대/락/XP/AI 순서를 유지한다. 075/076/079삭제·schema/DTO/기존값·MASTER/규범·새능력/세포로 확대하지 않는다. root만 공용metadata/등록원장/PR를 맡는다.
## 5. [원칙 ⑤] 절차
source핀과 원문 인수→승인된 fivefile만 최소diff→SOURCE-FREEZE 고정→관련 기존 onboarding-first-checkin 검사→정상 新guest preview/settings/theme/home 한회차→원FIRST/PNG·computed/clip 후처리→정상commit/봉인→root 별도독립QA 순서다.
## 6. [원칙 ⑥] 절차 재검증
반론1 칩의 동작을 없앤 변경이다: placeholder 글자 외 기존 value/dispatch/focus/선택/버튼 처리를 바꾸지 않았다. 반론2 guest overlay 성공을 실계정 E2E로 부른다: actual-1/FIRST는 주입 없는 신규 guest local source PC이며 SDK/API/DB/auth/nonGET/외부 전달은 차단했다. 저장후·칩 클릭을 재현하려고 submit하지 않고 source층으로 분리했다. 기존439의 old literal 기대는 바꾸거나 재실행하지 않는다.
## 7. [원칙 ⑦] 단계별 실행
SOURCE-FREEZE.json.products의5file 외 제품0, actual-1/FIRST.json의4theme 새회차만, PNG4 직접view·입력 한 글자/지우기·저장0을 확인한다. UI컴포넌트/리스너/핸들러/피드백의 기존 4위1체를 보존하고 새store/세포를 만들지 않는다. selected-existing-first.log 및 syntax 결과를 원그대로 보존한다.
## 8. [원칙 ⑧] 막히는 지점 예상
외부 Pretendard/font/SDK/auth script가 차단되었으며 실제 로컬 해석 서체의 정체는 미확인인 관측이다. 실공개 source/cache/font·운영/실계정/저장후·튜토리얼 특수상태·quickchip 실제클릭/use/effect/Court는 null이다. gradient/backdrop은 CSS만으로 단색 대비를 단정하지 않고 PNG 관측샘플과 대표값의 한계를 적는다. 실제source/최초실패를 덮거나 DOM주입/mock서버응답/기대완화로 성공시키지 않는다.
