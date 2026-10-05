'use strict';
// 인라인 세포화 구역 P2 첫 PR(#TASK-ES-438) — 기록 탭 쪽 묶음(지도 G130·G132·G133·G136·G138·G139·G140·G141·G142·G143)
const R = { kit: 'OurgoalRecordsKit', kitVar: '_recordsKit', beforeTag: '<script src="js/tabs/records/index.js"></script>' };
module.exports = {
  task: 'TASK-ES-438', n: 1,
  cells: [
    Object.assign({ key: 'cards', file: 'js/tabs/records/record-cards.js', title: 'OurGoal Record Cards (기록 탭 — 기록 카드 그리기)',
      desc: ['buildRecordCardHtml = 기록 한 건 카드 HTML. 기록 목록·타임라인·하루 상세가 부른다(카드 단추 연결 wireRecordCards 는 시험지 core-confirm-es376 이 index.html 글자로 읽어 남음 — 시험지 선행 뒤 옮김).'],
      groups: [{ id: 'G130', names: ['buildRecordCardHtml'] }] }, R),
    Object.assign({ key: 'heat', file: 'js/tabs/records/record-heatmap-report.js', title: 'OurGoal Record Heatmap & Report (기록 탭 — 히트맵·주간/월간 리포트 그림)',
      desc: ['renderRecordHeatmap = 기록 히트맵(칸 색 단계 heatmapLevel 은 시험지가 글자로 읽어 index.html 에 남음),', 'svgTrendChart·svgCategoryDonut·renderReportSummary = 주간/월간 리포트 SVG 추이·카테고리 도넛(filterRecordsByQuery 는 index.html 에 남음).'],
      groups: [{ id: 'G132', names: ['renderRecordHeatmap'] }, { id: 'G133', names: ['TOPIC_COLORS', 'svgTrendChart', 'svgCategoryDonut', 'renderReportSummary'] }] }, R),
    Object.assign({ key: 'assist', file: 'js/tabs/records/record-assistant.js', title: 'OurGoal Record Assistant (기록 탭 — 대화형 기록 비서)',
      desc: ['parseConversationalRecord = 한 줄 말을 기록 값으로 풀기, handleConversationalRecord·openConversationalRecordConfirmModal = 확인 창을 띄우고 저장.'],
      groups: [{ id: 'G136', names: ['parseConversationalRecord', 'handleConversationalRecord', 'openConversationalRecordConfirmModal'] }] }, R),
    Object.assign({ key: 'table', file: 'js/tabs/records/table-analytics-view.js', title: 'OurGoal Table Analytics View (기록 탭 — 표 기록 집계·일자별 추이 차트 그림)',
      desc: ['renderAnalyticsHtml = 전문 템플릿 자동 집계 결과 HTML(집계 computeTableAnalytics 는 index.html 에 남음), renderTrendSvgChart = 일자별 성장 추이 SVG(자료 computeTrendChartData 는 남음),', '(표 안 스톱워치 위젯 G140 은 시험지 stopwatch-lap-inputs·stopwatch-table-hint 가 index.html 글자로 읽어 남음 — 시험지 선행 뒤 옮김)'],
      groups: [{ id: 'G138', names: ['renderAnalyticsHtml'] }, { id: 'G139', names: ['renderTrendSvgChart'] }] }, R),
    Object.assign({ key: 'pro', file: 'js/tabs/records/pro-report-export.js', title: 'OurGoal Pro Report & Export (기록 탭 — 노션 푸시·AI 코칭 리포트·노션 표 내보내기)',
      desc: ['pushRecordToNotion = 기록을 노션 데이터베이스로 바로 보내기, openProCoachReportModal = AI 프로 코칭 리포트·처방 창, openProNotionExportModal = 노션 표 내보내기·클립보드 복사 창.'],
      groups: [{ id: 'G141', names: ['pushRecordToNotion'] }, { id: 'G142', names: ['openProCoachReportModal'] }, { id: 'G143', names: ['openProNotionExportModal'] }] }, R),
  ],
};
