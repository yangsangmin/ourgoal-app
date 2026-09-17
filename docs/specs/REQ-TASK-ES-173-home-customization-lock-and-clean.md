# 요구사항 정의서 (REQ) — 나만의 홈 구성 상단 고정 및 유령 항목 정리·정합성 고도화

> **문서 ID**: REQ-TASK-ES-173-home-customization-lock-and-clean  
> **티켓 연계**: #TASK-ES-173  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UX (체크인 루프 및 홈 화면 맞춤형 제어)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 1회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 원문 지시사항**:
  - *"1. 아바타(경험치)창과 오늘 기록하기 창은 상단 고정으로 하자. 나만의 홈 구성에서 표현은 하되 제일 상단에 편집할수 없게 만들어."*
  - *"2. 나머지는 니 권장안대로 진행해."*
- **표면적 현상**:
  - 나만의 홈 구성(`js/customize.js`)에서 '레벨 배지'를 끄면 아바타와 '내 아바타 바꾸기' 버튼까지 홈 화면에서 증발해버려 사용자가 혼란을 겪음.
  - '오늘 기록하기'는 아워골의 가장 핵심인 E1 체크인 루프임에도 불구하고, 나만의 홈 구성 설정 목록에 표시되지 않아 사용자가 직관적으로 홈 구성을 파악하기 어려움.
  - 이미 완전히 폐기되어 `display: none`으로 강제 봉인된 더미 위젯 `crewPacingWidget`('오늘 함께 기록한 사람')이 설정 창에 방치되어 있음.
  - 아워골에 실존하지 않는 가상 명칭인 '챌린지 룸 버튼 (소규모 챌린지 열기)'이 실제로는 '내 성장 확인하기' 버튼(기록 탭 이동)임에도 엉뚱한 라벨과 힌트로 등록되어 있음.
  - 14일간의 히트맵을 보여주는 카드가 '이번 주 히트맵 요약 (이번 주 기록 한눈에)'으로 잘못 표기되어 있음.
  - '⚡ 오늘의 3대 퀘스트' 카드가 과거의 '작은 도전 과제 바'라는 낡은 힌트 문구로 남아 있음.
  - `ui.css`에 이미 삭제된 `#quickRoutineRow` 셀렉터가 방치되어 있음.
- **기저 층위별 심층 분석**:
  - **1층 (기능적 은닉 위험 층위)**: 아바타와 경험치 배지(`levelBadgeRow`) 및 1줄 체크인 입력창(`captureCardBox`)은 아워골의 3대 본질 루프(E1)를 가동하는 핵심 기둥임에도, 사용자가 실수로 이를 숨겼을 경우 아바타 변경이나 당일 기록이 불가능한 상태에 빠질 수 있음.
  - **2층 (명칭 및 멘탈 모델 괴리 층위)**: 설정 창에 적힌 라벨과 힌트가 실제 앱 화면의 타이틀, 설명, 동작과 일치하지 않아 사용자가 기능을 예측할 수 없고 신뢰를 잃음.
  - **3층 (레거시 쓰레기 잔존 층위)**: 기능이 추가되거나 개편될 때 설정 파일(`customize.js`)과 스타일시트(`ui.css`)가 제때 동기화되지 않아 유령 코드가 축적됨.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 아워골 홈 화면의 본질은 **"매일 나의 페르소나 아바타와 마주하고, 부담 없이 즐겁게 딱 한 줄을 체크인하는 E1 실천 루프"**이다. 아바타(경험치)와 체크인 창은 어떤 경우에도 흔들리지 않는 최상단 고정 필수 기둥이어야 하며, 나만의 홈 구성 설정창은 실제 화면의 실체와 100% 투명하게 일치해야 한다.
- **[원인] (Root Causes)**:
  - **원인 1**: 초기 홈 커스텀 설계 시 `levelBadgeRow`를 일반 부가 위젯으로 분류하여 `CORE_IDS`에서 누락시킴으로써, 아바타 캐릭터가 통째로 숨겨지는 사이드이펙트 방치.
  - **원인 2**: `captureCardBox`는 코드 내부 `CORE_IDS`로 보호했으나, 설정 모달 UI에는 아예 노출하지 않아 사용자가 "이게 고정인지 숨길 수 있는지" 멘탈 모델 파악 불가.
  - **원인 3**: 홈 버튼 리팩토링 과정('내 성장 확인하기'로 전환, 퀘스트 3종 확장, 14일 히트맵 표출) 시 `customize.js` 화이트리스트 라벨을 업데이트하지 않고 방치.
- **[중심] (Core Bottleneck)**:
  - **"아바타(경험치)창과 오늘 기록하기 창을 나만의 홈 구성 최상단에 잠금(Disabled ON + 🔒 고정 배지)으로 명확히 표현"**하고, **"나머지 화이트리스트 항목들의 라벨·힌트·동작을 실제 UI와 1:1 전수 일치"**시키는 정합성 확립.
- **[핵심] (Critical Anchor)**:
  - 사용자가 나만의 홈 구성을 열었을 때, 상단 2개 항목이 견고하게 고정되어 있음을 시각적으로 확인하고 안도감을 느낌.
  - 유령 요소(`crewPacingWidget`) 완전 제거 및 가짜 챌린지 룸 명칭을 "내 성장 확인하기"로 정상화하여 100% 무결점 UX 제공.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말 것 (Don'ts)
- 기존 유저가 저장해 둔 `homeLayout.hidden` 설정 데이터를 손상시키거나 강제로 초기화하지 않는다 (비파괴 합집합 원칙).
- `levelBadgeRow`나 `captureCardBox`를 숨김 목록에 넣을 수 있도록 스위치 토글을 허용하지 않는다 (잠금 강제).

### 3-2. 할 것 (Dos)
- **1) 최상단 고정 및 편집 잠금 (Fixed Core Items)**:
  - `OurgoalCustomize.open()` 팝업 목록의 가장 윗단에 2개의 고정 항목을 배치:
    1. **`levelBadgeRow`**: 라벨 `아바타 & 레벨 배지`, 힌트 `내 아바타, 레벨, 경험치 바 (상단 고정)`.
    2. **`captureCardBox`**: 라벨 `오늘 기록하기`, 힌트 `1줄 체크인 입력창 (상단 고정)`.
  - UI 표현: 스위치는 `on` 상태로 고정되고 비활성화(`disabled`/클릭 불가), 우측 또는 라벨 옆에 `🔒 필수 고정` 뱃지를 달아 시각적 인지 부여.
  - 클릭/터치 시 부드러운 피드백: "이 항목은 항상 홈 상단에 고정돼요" 안내 토스트 노출.
  - 코드 보호: `CORE_IDS`에 `levelBadgeRow`를 명시적으로 등록하고, `normalize()` 함수에서 `levelBadgeRow`와 `captureCardBox`가 `hidden` 배열에 절대 들어가지 못하도록 필터링. 기존 유저 데이터에 혹시라도 들어가 있다면 자동 제거하여 복구.
- **2) 유령 요소 완전 제거**:
  - `crewPacingWidget`을 `WHITELIST` 및 `MINIMAL_HIDDEN`에서 영구 삭제.
- **3) 라벨 및 힌트 1:1 정합화**:
  - `homeChallengeRoomBtn` ➔ 라벨: `내 성장 확인하기 버튼`, 힌트: `기록 탭으로 바로 이동하는 버튼`.
  - `homeGrassSummaryCard` ➔ 라벨: `최근 히트맵 요약`, 힌트: `최근 2주간의 기록을 한눈에`.
  - `dailyQuestBarWrap` ➔ 라벨: `오늘의 3대 퀘스트`, 힌트: `체크인·할일·몰입 퀘스트 및 EXP 보상 카드`.
  - `customFeedbackBtn` ➔ 라벨: `맞춤 피드백 설정 버튼`, 힌트: `AI 말투 커스텀 프롬프트 설정 버튼`.
  - `todayMissionCard` ➔ 라벨: `오늘의 카드`, 힌트: `뭘 할지 모르겠을 때 도움돼요(내 목표기반)`.
  - `mzShareBtn` ➔ 라벨: `내 성장 자랑하기 버튼`, 힌트: `인스타·카톡 공유용 고화질 카드`.
- **4) CSS 레거시 정리**:
  - `ui.css`의 `body[data-ux-mode="minimal"]` 셀렉터에서 죽은 식별자 `#quickRoutineRow` 및 `#crewPacingWidget` 제거.

### 3-3. 스토리지 원장화 3대 명세 의무 (헌법 제2조 제4항 준수)
1. **원격 DB 스키마 명세**:
   - 본 작업은 클라이언트 화면 구성 설정(`state.profile.settings.homeLayout`) 정비 작업으로 신규 DB 테이블 신설 없음.
   - 기존 Supabase `users.raw_user_meta_data.settings.homeLayout` JSON 필드와 100% 무손실 동기화 유지 (`saveProfile()` 호출).
2. **스마트 스토리지 분기 설계**:
   - 1계층: 원격 Supabase DB (`settings.homeLayout`).
   - 2계층: 로컬 스토리지 백업 (`ourgoal_profile_<uid>`).
   - 3계층: 런타임 메모리 상태 (`state.profile.settings.homeLayout`).
   - 비파괴 합집합: `normalize()` 시 기존 hidden 배열에서 고정 코어 ID(`levelBadgeRow`, `captureCardBox`) 및 삭제된 ID(`crewPacingWidget`)를 자동으로 정제하여 유저 설정 유실 0바이트 보장.
3. **4대 뷰 전파 배선도**:
   - 설정 변경 시 `OurgoalCustomize.apply(state.profile.settings)` 즉시 호출 ➔ 홈 화면(`renderHome`) 표시/숨김 실시간 반영.
   - 4대 뷰(`renderHome`, `renderRecordsScreen`, `renderStatsScreen`, `renderCalendar`) 무결성 보존.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **비판적 재검토**:
  - Q: 기존에 사용자가 `levelBadgeRow`를 숨겨놓았었다면 어떻게 되는가?
    - A: `CORE_IDS`에 등록되고 `normalize()`가 실행되면서 `hidden` 목록에서 즉시 제거되어, 홈 상단에 아바타와 레벨 배지가 안전하게 다시 표시됨. 이는 상민님의 "상단 고정으로 하자"는 절대 헌법 지시를 온전히 이행하는 올바른 복구 동작임.
  - Q: 상단 고정 2개 항목을 스위치 UI로 두면 유저가 끄려고 누르지 않을까?
    - A: 스위치를 visually disabled(opacity 0.65, cursor not-allowed) 처리하고 자물쇠 뱃지(🔒 고정)를 명시하여 끌 수 없음을 명확히 보여주며, 클릭 시 친절한 토스트로 이유를 설명함.
- **엣지 케이스 점검**:
  - 게스트 모드: 로컬스토리지에 저장된 설정에서도 동일하게 고정 보호 및 정제 동작.
  - 프리셋(미니멀/집중 모드): 미니멀 모드에서도 `levelBadgeRow`와 `captureCardBox`는 절대 숨겨지지 않음.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

- **순차 시퀀스**:
  1. `js/customize.js`:
     - `CORE_IDS`에 `levelBadgeRow` 추가.
     - `WHITELIST` 전면 개편: 상단 고정 2개(`levelBadgeRow`, `captureCardBox`)를 `fixed: true` 속성과 함께 1, 2순위로 배치.
     - 폐기된 `crewPacingWidget` 제거.
     - 6대 부가 위젯의 라벨 및 힌트 1:1 정합화.
     - `open()` 모달 렌더러에서 `fixed: true` 항목은 잠금 스위치(disabled, 🔒 고정 배지) 렌더링 및 클릭 가드 배선.
     - `normalize()` 함수에서 고정 코어 ID 자동 배제 및 불변 유지.
     - `MINIMAL_HIDDEN` 기본값 정비.
  2. `ui.css`:
     - 미니멀 모드 셀렉터 내 레거시 `#quickRoutineRow`, `#crewPacingWidget` 정리.
     - 고정 잠금 스위치(`.switch.locked`) 스타일 추가.
  3. `scripts/smoke-test.js`:
     - 나만의 홈 구성 상단 고정 2종 잠금 및 유령 요소 제거 전수 자동화 테스트 갱신 및 검증 추가.
  4. 5대 무결성 검증 (`node scripts/verify-integrity-gate.js`, `npm test`) 실행.
  5. 4단계 로컬 메인 병합 및 5A 프리뷰 배포.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **SPOF 점검**:
  - `customize.js` 변경 시 기존 스모크 테스트의 `WHITELIST_IDS`나 `OurgoalCustomize.apply` 테스트가 깨질 위험 점검 ➔ `smoke-test.js`의 단언문을 최신 규격과 대조하여 완벽히 일치시킴.
  - 구버전 캐시 사용자가 이전 설정을 로드할 때의 안전성 ➔ `normalize()`가 모든 버전의 `settings.homeLayout`을 안전하게 정규화하므로 에러 발생 가능성 0%.
- **재검증에 따른 절차 수정**:
  - `smoke-test.js`에 기존 `MINIMAL_HIDDEN` 및 `WHITELIST` 검증 코드가 있으므로, 코드 수정 전 반드시 테스트 단언문 위치를 파악하여 동시 업데이트하도록 절차에 명시함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

- **정량적 통과 기준**:
  - 1) `node scripts/verify-integrity-gate.js` 100% 통과 (0 error).
  - 2) `npm test` 전체 스모크 테스트 100% 통과 (0 failure).
  - 3) 나만의 홈 구성 모달에서 최상단 2개 항목(아바타&레벨, 오늘 기록하기)이 자물쇠 배지와 함께 잠금 상태로 표시되는가.
  - 4) 유령 식별자 `crewPacingWidget`이 모달 목록에서 100% 사라졌는가.
  - 5) '내 성장 확인하기', '최근 히트맵 요약', '오늘의 3대 퀘스트' 라벨이 실제 화면과 정확히 일치하는가.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커**:
  - 스모크 테스트 내 기존 하드코딩된 화이트리스트 목록 또는 줄 수 검증이 걸릴 경우.
- **재검증 트리거**:
  - `npm test` 실패 시 즉시 [원칙 ⑤]로 복귀하여 `smoke-test.js` 내의 기댓값을 신규 화이트리스트 구조와 일치시키고 재검증 수행.
