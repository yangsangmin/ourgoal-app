/**
 * OurGoal Record Cards (기록 탭 — 기록 카드 그리기)
 *
 * #TASK-ES-438 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G130.
 *   옮긴 선언(이전 전 줄): buildRecordCardHtml(25433~25497)
 * buildRecordCardHtml = 기록 한 건 카드 HTML. 기록 목록·타임라인·하루 상세가 부른다(카드 단추 연결 wireRecordCards 는 시험지 core-confirm-es376 이 index.html 글자로 읽어 남음 — 시험지 선행 뒤 옮김).
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ============ RENDER: RECORDS ============ */
  function buildRecordCardHtml(r){
    var isTpl = r.type==='template'; var isNote = r.type==='note';
    var rawText = r.text || r.content || '';
    var rawStart = r.startAt || r.start_at || r.createdAt || r.created_at || L.nowISO(); var rawEnd = r.endAt || r.end_at || null;
    var durMin = Number(r.durationMinutes || r.duration_minutes || 0); var isDoing = !isNote && !isTpl && !rawEnd && durMin <= 0;
    var durEl;
    if(isTpl){ durEl = '<span class="rec-dur" style="background:var(--surface-2);color:var(--ink);">표 속성</span>'; }
    else if(isNote){ durEl = '<span class="rec-dur note">메모</span>'; }
    else if(isDoing){ durEl = '<span class="rec-dur doing">진행 중</span>'; }
    else if(durMin > 0){ durEl = '<span class="rec-dur">'+L.fmtDuration(durMin * 60000)+'</span>'; }
    else if(rawEnd){ durEl = '<span class="rec-dur">'+L.fmtDuration(new Date(rawEnd)-new Date(rawStart))+'</span>'; } else { durEl = ''; }
    var timeStr = (isNote || isTpl) ? L.fmtTime(rawStart) : (L.fmtTime(rawStart) + ' – ' + (rawEnd?L.fmtTime(rawEnd):(durMin>0?L.fmtTime(new Date(new Date(rawStart).getTime()+durMin*60000)):'진행중')));
    var th = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[r.theme]) ? L.RECORD_THEMES[r.theme] : ((typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES.daily) ? L.RECORD_THEMES.daily : { label:'일상', icon:'', color:'#64748b', bgColor:'rgba(100,116,139,0.12)', borderColor:'rgba(100,116,139,0.35)' });
    var subThText = r.subTheme ? (' · ' + L.escapeHtml(r.subTheme)) : '';
    var chipStyle = 'background:'+th.bgColor+';color:'+th.color+';border:1px solid '+th.borderColor+';';
    var photoHtml = r.photo ? '<div style="margin-top:6px;"><img src="'+r.photo+'" style="max-height:140px;border-radius:8px;object-fit:cover;border:1px solid var(--rule);"></div>' : '';
    var tplBadgeHtml = isTpl ? ('<div style="margin-bottom:6px;"><span class="pro-tpl-badge">' + L.escapeHtml(r.templateTitle || '전문 템플릿') + ' (' + (r.rows ? r.rows.length : 0) + '개 항목) · 클릭하여 표 보기</span></div>') : '';
    var metricPills = '';
    if(r.metrics && typeof r.metrics === 'object'){
      var mKeys = Object.keys(r.metrics);
      if(mKeys.length > 0){
        metricPills = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:4px 0;">' +
          mKeys.map(function(k){
            var val = r.metrics[k];
            var label = (k === '1rm' ? '1RM ' : (k === 'volume' ? '볼륨 ' : k + ' '));
            var unit = (k === '1rm' || k === 'volume' || k === 'weight' ? 'kg' : '');
            return '<span style="font-size:10.5px;padding:2px 6px;border-radius:6px;background:rgba(99,102,241,0.12);color:var(--brand);font-weight:700;">' + label + val + unit + '</span>';
          }).join('') +
        '</div>';
      }
    }
    return '<div class="rec-card toss-feed-card'+(isDoing?' doing':'')+'" data-recid="'+r.id+'" style="border-left: 4px solid '+th.color+';'+(isTpl?'cursor:pointer;':'')+'">' +
      tplBadgeHtml +
      '<div class="rec-top"><div class="rec-text" style="white-space:pre-line;">'+L.escapeHtml(rawText)+'</div>' +
        '<div class="rec-icons"><button class="icon-btn" data-recedit="1" aria-label="기록 수정"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button><button class="icon-btn" data-recdel="1" aria-label="기록 삭제">×</button></div>' +
      '</div>' +
      metricPills +
      photoHtml +
      (function(){
        if(!r.feedback || (!r.feedback.comment && !r.feedback.verdict && typeof r.feedback !== 'string')) return '';
        var fbVerdict = typeof r.feedback === 'string' ? 'AI 코칭' : (r.feedback.verdict || 'AI 코칭');
        var fbComment = typeof r.feedback === 'string' ? r.feedback : (r.feedback.comment || '');
        var fbNext = (r.feedback && typeof r.feedback === 'object' && (r.feedback.next_action || r.feedback.nextAction)) || '';
        var fbMode = (r.feedback && typeof r.feedback === 'object' && r.feedback.feedbackMode) || '';
        var modeBadge = fbMode ? ('<span class="rec-ai-mode-tag">[' + (fbMode==='macro'?'정밀':(fbMode==='medium'?'중간':'기본')) + ']</span>') : '';
        return '<div class="rec-ai-feedback-box">' +
          '<div class="rec-ai-head">' +
            '<span class="rec-ai-icon">🤖</span>' +
            '<span class="rec-ai-verdict-badge">' + L.escapeHtml(fbVerdict) + '</span>' +
            modeBadge +
          '</div>' +
          '<div class="rec-ai-comment">' + L.escapeHtml(fbComment) + '</div>' +
          (fbNext ? ('<div class="rec-ai-next"><span class="rec-ai-next-label">🎯 추천 액션:</span> ' + L.escapeHtml(fbNext) + '</div>') : '') +
        '</div>';
      })() +
      '<div class="rec-bottom">' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<span class="rec-time">'+timeStr+'</span>' + durEl +
        '</div>' +
        '<span class="rec-theme-chip" data-rectheme="'+r.id+'" style="'+chipStyle+'" title="테마 변경 (클릭)">'+th.icon+' '+th.label+subThText+' ▾</span>' +
      '</div>' +
    '</div>';
  }

  K.buildRecordCardHtml = buildRecordCardHtml;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
