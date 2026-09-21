# 아워골 홈 위젯 "오늘 목표" — 스켈레톤 (#TASK-ES-204)

**상태: 미검증.** Xcode 타깃에 아직 연결하지 않았다. Windows 에서는 Swift 를 컴파일할 수 없다.
이 폴더의 `OurgoalWidget.swift` 는 타깃 연결 전이라 `App.xcodeproj` 빌드에 들어가지 않는다(= 지금의 iOS 앱 빌드를 깨지 않는다).

## 맥에서 연결하는 절차 (로드맵 T064)

1. `npx cap sync ios` 후 `npx cap open ios` 로 Xcode 를 연다.
2. File ▸ New ▸ Target ▸ Widget Extension. 이름 `OurgoalWidget`, "Include Live Activity/Configuration Intent" 해제.
3. Xcode 가 만든 기본 Swift 파일을 지우고 이 폴더의 `OurgoalWidget.swift` 를 타깃에 추가한다.
4. App 타깃과 OurgoalWidget 타깃 둘 다 Signing & Capabilities ▸ **App Groups** ▸ `group.com.yangbis.ourgoal`.
   (App Group 은 Apple Developer 계정에서 등록한다 — 개발자 계정 로그인이 필요해 사람 손이 든다.)
5. 앱 → 위젯 값 전달(`UserDefaults(suiteName:)` 에 `todayGoal` JSON 쓰기 + `WidgetCenter.shared.reloadAllTimelines()`)은
   Capacitor 로컬 플러그인으로 만든다. 웹은 `window.Capacitor.Plugins` 로 호출한다. (T064 범위)

## 데이터 계약

`todayGoal` = `{"title":"…","done":2,"total":5}`. 값이 없거나 `total` 이 0 이면 위젯은 숫자를 지어내지 않고 안내 문구만 보인다.
