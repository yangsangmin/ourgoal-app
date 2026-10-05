'use strict';
// dom-compare-inline-p2.js 의 단계 묶음 — PR 마다 이번에 옮긴 선언이 불리는 곳을 차례로 누른다.
module.exports = ({ click, seedRecords, closeModal }) => {
  const ev = js => ({ evalFn: js });
  const S = {};
  const G = {};
  // 1 = #TASK-ES-438 기록 탭 묶음: 기록 카드(buildRecordCardHtml·wireRecordCards) · 히트맵(renderRecordHeatmap) · 리포트(renderReportSummary·svgTrendChart·svgCategoryDonut·TOPIC_COLORS)
  //     · 대화형 기록 비서(handleConversationalRecord·parseConversationalRecord·openConversationalRecordConfirmModal)
  //     · 전문 템플릿 기록 창(renderTrendSvgChart·renderStopwatchWidgetHtml·renderLapRowsHtml·STOPWATCH_STATE·renderAnalyticsHtml)
  //     · AI 코칭 리포트 창(openProCoachReportModal) · 노션 내보내기 창(openProNotionExportModal → 「노션으로 바로 보내기」 pushRecordToNotion)
  S['1'] = [
    ['enter', { enter: true }, 1500],
    ['seed', seedRecords('rec', [
      { d: 0, h: 9, min: 45, theme: 'study', text: '아침 영어 공부', category: 'study' },
      { d: 1, h: 20, min: 60, theme: 'workout', text: '헬스장 가슴운동', category: 'health' },
      { d: 2, h: 12, text: '점심 산책 메모' },
      { d: 4, h: 7, min: 30, theme: 'workout', text: '러닝 5km', category: 'health' },
      { d: 9, h: 22, min: 90, theme: 'study', text: '자격증 공부', category: 'study' },
      { d: 20, h: 18, min: 20, text: '독서 20분', category: 'hobby' },
    ])],
    ['rec-enter', { goTab: 'records' }],
    ['report-30', click('#reportPeriodToggle [data-period="30"]'), 400],
    ['report-7', click('#reportPeriodToggle [data-period="7"]'), 400],
    ['heat-cell', ev('(function(){ var c = Array.prototype.slice.call(document.querySelectorAll("#recordHeatmap .heatmap-cell[data-future=\\"0\\"]")).filter(function(x){ return Number(x.dataset.count) > 0; }); if(!c.length) return "none"; c[c.length-1].click(); return "clicked:" + c.length; })()'), 400],
    ['card-edit', click('.screen.active .rec-card [data-recedit]'), 600],
    ['card-edit-close', closeModal(), 400],
    ['card-theme', click('.screen.active .rec-card [data-rectheme]'), 600],
    ['card-theme-close', closeModal(), 400],
    ['agent-input', ev('(function(){ var c = document.getElementById("recAgentCard"); if(c) c.style.display = "block"; var i = document.getElementById("recAgentInput"); if(!i) return "missing"; i.value = "저녁에 헬스장에서 가슴운동 1시간"; return "typed"; })()')],
    ['agent-send', click('#recAgentSendBtn'), 800],
    ['agent-save', click('#recAiSaveBtn'), 1200],
    ['agent-input-2', ev('(function(){ var i = document.getElementById("recAgentInput"); if(!i) return "missing"; i.value = "오늘 아침 30분 독서"; return "typed"; })()')],
    ['agent-send-2', click('#recAgentSendBtn'), 800],
    ['agent-cancel', click('#recAiCancelBtn'), 600],
    ['pro-open', click('#recOpenProTemplateBtn'), 1000],
    ['sw-start', click('#swStartPauseBtn'), 1300],
    ['sw-lap', click('#swLapBtn'), 400],
    ['sw-pause', click('#swStartPauseBtn'), 400],
    ['sw-reset', click('#swResetBtn'), 400],
    ['coach-open', click('#proCoachBtn'), 1000],
    ['coach-close', click('#coachCloseBtn'), 600],
    ['pro-open-2', click('#recOpenProTemplateBtn'), 1000],
    ['notion-open', click('#proNotionExportBtn'), 1000],
    ['notion-push', click('#notionDirectPushBtn'), 1500],
    ['notion-close', click('#notionCloseBtn'), 600],
    // 노션 키를 두 앱에 같은 조작으로 넣고(앱 코드 그대로 — app-scope 통로의 state·saveProfile) 「즉시 전송」 → pushRecordToNotion 이 /api/notion-push 를 부른다(비교 서버는 {ok:true})
    ['notion-key', ev('(async function(){ var L = window.OurgoalAppScope.scope; L.state.profile.settings = L.state.profile.settings || {}; L.state.profile.settings.notionApiKey = "secret_compare"; L.state.profile.settings.notionDatabaseId = "db_compare"; await L.saveProfile(); return "key-set"; })()')],
    ['pro-open-3', click('#recOpenProTemplateBtn'), 1000],
    ['notion-open-2', click('#proNotionExportBtn'), 1000],
    ['notion-push-2', click('#notionDirectPushBtn'), 2000],
    ['notion-close-2', click('#notionCloseBtn'), 600],
    ['tab-roundtrip', { tabRoundTrip: true }],
  ];
  G['1'] = ['buildRecordCardHtml', 'wireRecordCards', 'renderRecordHeatmap', 'renderReportSummary', 'handleConversationalRecord', 'renderAnalyticsHtml', 'renderTrendSvgChart', 'playTimerBeep', 'renderStopwatchWidgetHtml', 'renderLapRowsHtml', 'pushRecordToNotion', 'openProCoachReportModal', 'openProNotionExportModal', 'formatStopwatchTime', 'STOPWATCH_STATE'];
  S.globals = G;
  return S;
};
