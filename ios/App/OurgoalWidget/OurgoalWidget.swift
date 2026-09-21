// 아워골 홈 위젯 "오늘 목표" — 스켈레톤 (#TASK-ES-204, INFRA)
//
// 상태: 미검증 스켈레톤. 아직 Xcode 프로젝트(App.xcodeproj)의 타깃에 연결하지 않았다.
// 이 PC(Windows)에서는 Swift 를 컴파일할 수 없어서 "빌드된다"고 주장하지 않는다. 연결·실기기 확인은 로드맵 T064.
// 연결 절차는 같은 폴더 README.md.
//
// 데이터 계약(앱 → 위젯): App Group 공유 UserDefaults 의 키 "todayGoal" 에 JSON 문자열
//   {"title":"...", "done":2, "total":5}
// 값이 없으면 실제 목표가 없다는 뜻이므로 숫자를 지어내지 않고 안내 문구만 보인다(가짜 진행률 금지).

import WidgetKit
import SwiftUI

private let appGroupId = "group.com.yangbis.ourgoal"
private let shareKey = "todayGoal"

struct TodayGoal: Decodable {
    let title: String
    let done: Int
    let total: Int
}

struct GoalEntry: TimelineEntry {
    let date: Date
    let goal: TodayGoal?   // nil = 공유된 값 없음
}

struct GoalProvider: TimelineProvider {
    func placeholder(in context: Context) -> GoalEntry {
        GoalEntry(date: Date(), goal: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (GoalEntry) -> Void) {
        completion(GoalEntry(date: Date(), goal: load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GoalEntry>) -> Void) {
        let entry = GoalEntry(date: Date(), goal: load())
        // 앱이 값을 갱신하면 WidgetCenter.reloadAllTimelines() 로 즉시 다시 그린다. 그 전엔 30분마다.
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(30 * 60))))
    }

    private func load() -> TodayGoal? {
        guard
            let raw = UserDefaults(suiteName: appGroupId)?.string(forKey: shareKey),
            let data = raw.data(using: .utf8),
            let goal = try? JSONDecoder().decode(TodayGoal.self, from: data),
            goal.total > 0
        else { return nil }
        return goal
    }
}

struct OurgoalWidgetView: View {
    let entry: GoalEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("오늘 목표").font(.caption).foregroundColor(.secondary)
            if let goal = entry.goal {
                Text(goal.title).font(.headline).lineLimit(2)
                Text("\(goal.done) / \(goal.total)").font(.title3).bold()
            } else {
                Text("앱을 열어 오늘 목표를 확인해요").font(.subheadline).lineLimit(3)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }
}

@main
struct OurgoalWidget: Widget {
    let kind = "OurgoalTodayGoalWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GoalProvider()) { entry in
            OurgoalWidgetView(entry: entry)
        }
        .configurationDisplayName("오늘 목표")
        .description("오늘의 목표와 진행 상황을 홈 화면에서 봐요.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
