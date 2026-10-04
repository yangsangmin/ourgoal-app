# 요구사항 정의서 (REQ) — #TASK-ES-341 홈 아바타 EXP 진행 바 실값화 · 하드코딩 이름 제거

> **문서 ID**: REQ-TASK-ES-341-HOME-EXP-NICKNAME  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-19, HOME-21  
> **작업 일시**: 2026-10-04  
> **작성자**: Claude Code 세션(워크트리 `C:/dev/wt/home-19-21`)

## 지시 원문 (오케스트레이터 세션이 전달한 상민님 확정 방향)

- **HOME-19 아바타 EXP·레벨**: `js/tabs/home/sub-onescreen.js` `refreshAvatar` 가 쓰이지 않는 `p.exp` 를 읽어 홈에 항상 "Lv.1 · 0 / 100 EXP" 가 나온다. 실제 경험치는 `state.profile.settings.xp.total`, 레벨 공식은 앱의 `levelForXP`. 상민님 확정 방향: 홈에는 레벨·EXP 숫자를 표시하지 않고 아바타 둘레(또는 아래)의 숫자 없는 진행 링/바만, EXP 를 얻는 순간 "+N EXP" 를 0.5초 띄웠다 사라지게. 레벨 숫자는 레벨업 팝업·아바타 설정창·내 프로필에서만. 이번 범위는 홈에서 숫자를 빼고 진행 비율을 실제 값으로 고치는 것까지(타인 화면 숨김은 범위 밖). 홈 아바타 탭 → 아바타 설정창 연결 확인.
- **HOME-21 하드코딩 '상민'**: 헤드라인·동반자 위젯·`/api/track` 요청 `displayName`/`nickname` 기본값·루틴 템플릿 author 를 확인해 사용자 표시·서버 전송용 기본값 '상민' 을 없앤다(닉네임 없으면 이름 없는 문장, 서버에는 빈 값). 헤드라인 '오늘 N회 기록' 이 체크인 기록에 `date` 필드가 없어(`buildCheckinRecord` 는 `startAt` 만) 안 나오는 문제를 `startAt` 에서 날짜를 구하는 방식으로 고친다(기존 `date` 필드 기록도 계속 셀 것).

---

## 1. [원칙 ①] 문제 정확히 파악

1. `OurgoalHomeOneScreen.refreshAvatar()` 가 `state.profile.exp` 를 읽는다. 이 칸은 아무 곳에서도 쓰이지 않아 항상 0 → 진행 바 0%, 글자 "Lv.1 · 0 / 100 EXP" 고정. 실제 경험치(`awardXP` 가 올리는 `settings.xp.total`)와 무관하다.
2. 홈 헤드라인(`renderHome` 의 `#homeHeadlineSentence`)·동반자 위젯(`renderCrewPacingWidget` → `applyCrewPacingUI`)이 닉네임이 없을 때 `'상민'` 으로 대체해 다른 사용자에게 "상민님," 을 보여 준다.
3. `/api/track` `sync_records` 요청 본문의 `displayName`·`nickname` 기본값이 `'상민'` 이라 닉네임 없는 사용자의 이름이 서버로 '상민' 으로 전송될 수 있다.
4. 헤드라인의 오늘 체크인 수가 `r.date === dateKey()` 로만 센다. 홈 체크인(`#captureSave`)·`buildCheckinRecord` 기록에는 `date` 가 없고 `startAt` 만 있어 "오늘 N회 기록" 문장이 나오지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 홈은 "내 성장" 을 정확히 비춰야 한다. 틀린 숫자(늘 0)와 남의 이름은 신뢰를 깎는다.
- **원인**: HOME-02(#TASK-ES-340) 구현이 존재하지 않는 `p.exp` 를 가정함 / 개발 중 쓰던 대체 이름이 기본값으로 남음 / 기록 스키마(`startAt`)와 집계 조건(`date`) 불일치.
- **중심**: `js/tabs/home/sub-onescreen.js`(`ensureHeroAvatarCard`, `refreshAvatar`), `index.html`(`awardXP`, `renderHome`, `renderCrewPacingWidget`, `applyCrewPacingUI`, `/api/track` 동기화), `ui.css`.
- **핵심**: 레벨 계산은 새로 만들지 않고 앱의 `levelProgress`/`levelForXP` 를 그대로 쓴다. 경험치가 바뀌는 단일 지점(`awardXP`)에서 홈에 알린다.

## 3. [원칙 ③] 해결 방식

- `#homeHeroExpText`("Lv.N · x / 100 EXP") 마크업을 빼고 `#homeHeroExpGain`(평소 빈 칸·투명)을 둔다.
- `#homeHeroExpBar` 에 `role="progressbar"`·`aria-valuenow`(0~100) — 화면에는 숫자 없음, 보조기기·법정은 값 확인 가능.
- `expProgressPct(profile)` = `levelProgress(settings.xp.total).pct` (없으면 같은 공식 `50*(L-1)*L` 로 계산).
- `awardXP` 끝에 `notifyXpGained(amount, total)` → `OurgoalHomeOneScreen.onXpGained` 가 바를 다시 그리고 "+N EXP" 를 0.5초 표시(같은 순간의 연속 보상은 합산). 직접 `xp.total += 5` 하던 웰컴 스탬프 경로도 같은 알림 호출.
- 닉네임 없으면 `nickLead=''`, 동반자 위젯은 이름 없는 문장, `/api/track` 기본값은 `''`(서버 `api/track.js` `handleSyncRecords` 는 빈 값을 허용하고 `username` 으로 대체 — 필수 아님).
- 헤드라인 집계: `r.date || dateKey(r.startAt)` 가 오늘이면 센다.

## 4. [원칙 ④] 재검토

- 레벨 숫자를 홈에서 빼는 것은 "기존 기능 삭제" 인가? → 숫자 글자는 지시(상민님 확정 방향)에 따른 표시 변경이며, 레벨 숫자는 아바타 설정창(`openAvatarModal`)·레벨업 배너(`showLevelUpBanner`)에 그대로 남는다. 기능 삭제 아님.
- `index.html` 루틴 템플릿 `rt_real_sangmin_445` 의 `author: '상민'` 은 사용자 기본값이 아니라 템플릿 작성자 표기(제목도 "상민 대표의 …")라 이번 변경에서 손대지 않는다. 바꾸려면 콘텐츠 결정이므로 보고만 한다.

## 5. [원칙 ⑤] 절차

1. `sub-onescreen.js` 마크업·`refreshAvatar`·`expProgressPct`·`onXpGained`
2. `index.html` `notifyXpGained` + `awardXP` 배선 + 웰컴 스탬프 경로
3. `index.html` 이름 기본값·헤드라인 집계
4. `ui.css` `.hero-avatar-exp-gain` 0.5초 애니메이션(`prefers-reduced-motion` 대응)
5. 주장 파일·시나리오·TICKETS·dev_log

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1**: "aria-valuenow 도 숫자이니 '숫자 없음' 위반" → 화면에 렌더되지 않는 접근성 속성이다. 시각 사용자에게 숫자는 보이지 않고, 화면 낭독 사용자에게 진행 정도를 알려 주는 것은 표준 progressbar 의무다.
- **반론 2**: "+N EXP 를 0.5초에 지우면 3개 보상이 연달아 올 때 마지막 것만 보인다" → `_gainSum` 으로 0.5초 안의 보상을 합산해 한 번에 보인다(첫 체크인 시 +10 +30 +10 → "+50 EXP").

## 7. [원칙 ⑦] 즉시 실행 — PLAN 참조

## 8. [원칙 ⑧] 성과 측정 · 막힐 지점

- 법정 시나리오 `home-exp-ring`: 게스트 첫 화면 `aria-valuenow="0"`·"Lv." 글자 없음 → 체크인 후 `aria-valuenow="50"`(settings.xp.total 50 = Lv1 구간 0~100 의 50%).
- 법정 시나리오 `home-headline-no-name`: 닉네임 없는 게스트 헤드라인이 "가슴 뛰는 첫 번째 목표를 시작해볼까요? 🌱" 와 정확히 같다(기준 커밋은 "상민님, …").
- 막힐 지점: 법정은 fixture 를 새로 넣을 수 없어(금고) 목표가 있는 상태의 "오늘 N회" 문장은 화면 시나리오로 재기 어렵다 → 코드 주장(static)으로 낸다.
