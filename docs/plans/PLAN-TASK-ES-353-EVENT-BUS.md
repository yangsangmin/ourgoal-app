# PLAN — #TASK-ES-353 변경 이벤트 단일화·리스너 중복 방지 CORE-04 (문제해결 8원칙)

## 1. 목표 정의
변경 1회 → 탭마다 자기 영역 1회 렌더. 탭 재진입에도 구독 1개, 발행처 없는 구독 0, 미정의 `renderCalendar` 호출 0, 빈 소블록이면 폴백. HOME-18·GOALS-22 를 함께 끝낸다.

## 2. 현상 분석
기준 측정(`reports/TASK-ES-353/measure-base-origin-main.json`): 탭 4종 각 10회 왕복 뒤 구독 347개, 체크인 1회에 `renderRecordsScreen` 11·`renderCalendarScreen` 11·`renderGoalsScreen` 20·햅틱 52회, 발행 0 구독 이름 23종, `renderCalendar` 호출 53곳, 설정 탭 진입 시 `renderSettingsScreen` 0회.

## 3. 원인 추정
`EventBus.on` 중복 방지 없음 + 소블록 `mount→bindEvents` 반복, 발행처 없는 이름 구독, 전파기 직접 렌더 + `view:sync` 구독 렌더 중복, 소블록 `mount` 가 늘 `true`(폴백 차단), 렌더 안 햅틱(`applyTheme`·`setRecordsSegment`·`setRecordsSlide`).

## 4. 대안 탐색
- A. 소블록에서 `bindEvents` 1회 플래그만 — 중복은 막지만 같은 틱 중복 렌더(전파기+구독)와 유령 구독은 남음.
- B. 이벤트 이름을 영역별로 새로 만들고 발행처를 index.html 곳곳에 추가 — index.html 은 다른 두 세션이 작업 중, 충돌 위험.
- C. **버스에 소유자 키·dispose·렌더 합치기, 변경 이벤트는 기존 유일 발행처(`dispatchFullViewPropagation`)의 `view:sync` 1종으로 사전화(채택)** — index.html 변경 최소.

## 5. 실행 계획
- [x] 워크트리·작업번호(ES-353 원격·문서 미사용 확인)
- [x] 기준 측정 스크립트·결과
- [x] `js/core/event-bus.js` 소유자 키·`offOwner`·`subscriptions`·`requestRender`·`flushRenders`·`EVENTS`/`CHANGE_DICTIONARY`
- [x] 소블록 18개 dispose·그렸는가·`view:sync` 1종 구독, 메가블록 6개·`registry.js` 그렸는가 판정
- [x] index.html 최소 줄(`setTab` 폴백, `dispatchFullViewPropagation` 합치기·`renderCalendar` 삭제, `applyTheme`·`setRecordsSegment`·`setRecordsSlide` 햅틱)
- [x] `renderCalendar` → `renderCalendarScreen` 52곳
- [x] 후 측정·시나리오 로컬 예비 실행·`npm test`
- [x] REQ·PLAN·claims·TICKETS·dev_log

## 6. 절차 재검증 및 반론 격파
- 반론 1: "렌더 지연이 DOM 동기 의존 코드를 깨뜨린다." → 전파기가 끝에서 `flushRenders()` 를 동기 호출, 기존 시점 유지. SanctuaryV3 렌더는 합친 렌더 뒤로 옮겨 기존 순서(직접 렌더 → 성소 렌더) 유지.
- 반론 2: "메가블록이 false 를 돌려주면 기준 시험지가 깨진다." → `mount()` 반환 true 유지, `lastMountDrew`·레지스트리 래퍼로만 전달. 기준 시험 전부 로컬 통과.

## 7. 즉시 실행
세션이 구현·측정·문서·PR·법정 판정 기록까지 수행. 병합은 하지 않는다.

## 8. 성과 측정
- 구독 347 → 12, 체크인 1회 렌더(기록·캘린더·목표) 11·11·20 → 1·1·1, 햅틱 52 → 5, 할 일 체크 목표 렌더 6 → 1, 설정 진입 렌더 0 → 10/10, 유령 구독 23 → 0, renderCalendar 53 → 0, 콘솔 오류 0 → 0, `npm test` 0.
- 미측정(확인 못 함): 실계정·두 기기 동기화(HOME-18), 실제 폰 햅틱 체감, 통계 화면 반영 촬영.

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
- [x] [4단계: 심사 청구]
