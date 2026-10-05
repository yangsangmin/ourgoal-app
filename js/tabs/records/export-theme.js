/**
 * OurGoal Records Export Theme (기록 — 캘린더 구독·iCalendar·마크다운 내보내기·테마별 기록 내보내기 창)
 *
 * 캘린더 구독 서명 토큰 받기(fetchSignedCalendarToken) · 구독 URL·iCalendar·마크다운 내보내기 순수 함수(buildWebCalUrl · buildICS · buildMarkdownExport) · 테마별 기록 내보내기 창(openExportThemeModal) · 전체 체크인 내보내기(exportAllCheckins).
 * 토큰 캐시(_cachedSignedCalendarToken)·MOCK_GROUPS·내보내기 단추 등록 한 줄·window 노출 줄·shareContent 줄은 원래 자리에 있다. 순수 함수 세 개는 smoke-test FN_NAMES 함수 — smoke-test 가 인라인 합본에서 잘라 간다(#TASK-ES-465).
 * #TASK-ES-474(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 22234~22251 · 22252~22259 · 22260~22327 · 22328~22349 · 22350~22504 · 22505~22508줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 22234~22251줄(#TASK-ES-474 생성기 표지) ---- */
  async function fetchSignedCalendarToken() {
    if (L._cachedSignedCalendarToken) return L._cachedSignedCalendarToken;
    try {
      var sTok = await L.getSupabaseAuthToken();
      if (!sTok) return 'demo';
      var res = await fetch('/api/calendar?action=calendar_token', {
        headers: { 'Authorization': 'Bearer ' + sTok }
      });
      if (res.ok) {
        var data = await res.json();
        if (data && data.token) {
          L._cachedSignedCalendarToken = data.token;
          return data.token;
        }
      }
    } catch(e) {}
    return 'demo';
  }
  /* ---- 이전 전 index.html 22252~22259줄(#TASK-ES-474 생성기 표지) ---- */

  function buildWebCalUrl(userIdOrToken, origin){
    origin = origin || (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : 'https://ourgoal-app.vercel.app');
    var base = origin.replace(/^https?:\/\//, '');
    var cached = (typeof L._cachedSignedCalendarToken !== 'undefined') ? L._cachedSignedCalendarToken : null;
    var tok = userIdOrToken || cached || 'demo';
    return 'webcal://' + base + '/api/calendar?token=' + encodeURIComponent(tok);
  }
  /* ---- 이전 전 index.html 22260~22327줄(#TASK-ES-474 생성기 표지) ---- */

  function buildICS(records, goals){
    records = records || [];
    goals = goals || [];
    var goalMap = {};
    goals.forEach(function(g){ if(g && g.id) goalMap[g.id] = g; });

    function fmtICSDate(d){
      var dt = new Date(d);
      if(isNaN(dt.getTime())) dt = new Date();
      return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    function escapeICS(str){
      return String(str || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\r\n/g, '\\r\n');
    }

    function foldLine(line){
      if(line.length <= 75) return line;
      var parts = [];
      parts.push(line.slice(0, 75));
      var rest = line.slice(75);
      while(rest.length > 74){
        parts.push(' ' + rest.slice(0, 74));
        rest = rest.slice(74);
      }
      if(rest.length > 0) parts.push(' ' + rest);
      return parts.join('\r\r\n');
    }

    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OurGoal//KR//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:아워골 나의 목표 & 체크인 기록'
    ];

    records.forEach(function(r, idx){
      if(!r || !r.startAt) return;
      var st = fmtICSDate(r.startAt);
      var et = r.endAt ? fmtICSDate(r.endAt) : st;
      var g = r.goalId && goalMap[r.goalId] ? goalMap[r.goalId] : null;
      var gTitle = g ? g.title : (r.category && typeof L.TOPICS !== 'undefined' && L.TOPICS[r.category] ? L.TOPICS[r.category].label : '아워골 체크인');
      var themeLabel = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[r.theme]) ? L.RECORD_THEMES[r.theme].label : (r.theme || '일상');
      var summary = '[' + themeLabel + '] ' + gTitle + (r.text ? ' - ' + r.text : '');
      var desc = '목표: ' + gTitle + '\\r\n테마: ' + themeLabel + (r.subTheme ? ' (' + r.subTheme + ')' : '') + '\\r\n기록 내용: ' + (r.text || '') + '\\r\n아워골 앱에서 확인: https://ourgoal-app.vercel.app';
      var uid = (r.id || ('rec-' + idx)) + '@ourgoal-app.vercel.app';

      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + uid);
      lines.push('DTSTAMP:' + st);
      lines.push('DTSTART:' + st);
      lines.push('DTEND:' + et);
      lines.push(foldLine('SUMMARY:' + escapeICS(summary)));
      lines.push(foldLine('DESCRIPTION:' + escapeICS(desc)));
      lines.push('CATEGORIES:' + escapeICS(themeLabel));
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\r\n');
  }
  /* ---- 이전 전 index.html 22328~22349줄(#TASK-ES-474 생성기 표지) ---- */

  function buildMarkdownExport(recordsToExport, themeKey, includePrompt){
    var thObj = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[themeKey]) ? L.RECORD_THEMES[themeKey] : null;
    var themeTitle = thObj ? thObj.label : (themeKey === 'all' ? '전체 테마' : '기록');
    var promptHeader = includePrompt ? (L.getAIAnalysisPrompt(themeKey) + '\r\n\r\n---\r\n\r\n### [데이터셋: ' + themeTitle + ' 기록 목록]\r\n\r\n') : '';

    var lines = [promptHeader + '# 📊 아워골 ' + themeTitle + ' 기록 내보내기\r\n'];
    lines.push('- 추출 일시: ' + L.nowISO());
    lines.push('- 총 기록 수: ' + recordsToExport.length + '건\r\n');
    lines.push('| 날짜 | 시간 | 소요 | 테마 | 소주제 | 내용 |');
    lines.push('|---|---|---|---|---|---|');

    recordsToExport.slice().sort(function(a,b){ return new Date(a.startAt)-new Date(b.startAt); }).forEach(function(r){
      var mins = r.endAt ? (Math.round((new Date(r.endAt)-new Date(r.startAt))/60000) + '분') : (r.type==='note'?'메모':'진행중');
      var th = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[r.theme]) ? L.RECORD_THEMES[r.theme].label : (r.theme || '일상');
      var subTh = r.subTheme || '-';
      var safeText = (r.text || '').replace(/\|/g, '\\|').replace(/\r?\n|\r/g, ' ');
      lines.push('| ' + L.dateKey(r.startAt) + ' | ' + L.fmtTime(r.startAt) + ' | ' + mins + ' | ' + th + ' | ' + subTh + ' | ' + safeText + ' |');
    });

    return lines.join('\r\n');
  }
  /* ---- 이전 전 index.html 22350~22504줄(#TASK-ES-474 생성기 표지) ---- */

  function openExportThemeModal(){
    var currentFilter = (L.state && L.state.selectedRecordTheme && L.state.selectedRecordTheme !== 'all') ? L.state.selectedRecordTheme : 'all';
    var allRecs = (L.state && L.state.profile && L.state.profile.records) || [];

    var themeOptions = [
      { key: 'all', label: '전체 테마 (모든 기록)', icon: '✨', count: allRecs.length },
      { key: 'mind', label: '심리상태', icon: '🧠', count: allRecs.filter(function(r){ return r.theme==='mind'; }).length },
      { key: 'study', label: '공부기록', icon: '📚', count: allRecs.filter(function(r){ return r.theme==='study'; }).length },
      { key: 'business', label: '사업기록', icon: '💼', count: allRecs.filter(function(r){ return r.theme==='business'; }).length },
      { key: 'schedule', label: '약속기록', icon: '🤝', count: allRecs.filter(function(r){ return r.theme==='schedule'; }).length },
      { key: 'workout', label: '운동기록', icon: '💪', count: allRecs.filter(function(r){ return r.theme==='workout'; }).length },
      { key: 'daily', label: '일상/기타', icon: '🌱', count: allRecs.filter(function(r){ return (r.theme||'daily')==='daily'; }).length }
    ];

    var themeSelectHtml = themeOptions.map(function(opt){
      var sel = (currentFilter === opt.key);
      return '<option value="'+opt.key+'"'+(sel?' selected':'')+'>'+opt.icon+' '+opt.label+' ('+opt.count+'개)</option>';
    }).join('');

    L.openModal(
      '<h3>테마별 기록 DB 다운로드 & AI 분석 프롬프트</h3>' +
      '<p class="faint" style="font-size:.875rem;margin-bottom:14px;">기록 데이터를 테마별로 추출하고, Google Gemini에서 즉시 심층 피드백을 받을 수 있는 분석 프롬프트 번들을 생성합니다.</p>' +
      '<div class="field"><label>내보낼 테마 선택</label><select id="expThemeSel">'+themeSelectHtml+'</select></div>' +
      '<div class="field"><label>내보내기 형식</label>' +
        '<select id="expFmtSel">' +
          '<option value="csv">CSV (엑셀 / 구글 스프레드시트 호환)</option>' +
          '<option value="ics">iCalendar (.ics - 구글/애플 캘린더 연동)</option>' +
          '<option value="json">JSON (개발자 / DB 백업 원본)</option>' +
          '<option value="md">Markdown (노션 / 옵시디언 / 보고서용)</option>' +
        '</select>' +
      '</div>' +
      '<div class="field" style="margin-top:12px;">' +
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600;">' +
          '<input type="checkbox" id="expWithAIPrompt" checked> Google Gemini AI 분석 프롬프트 번들 포함' +
        '</label>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:4px;">선택한 테마의 특성에 맞춘 전문 AI 분석가 페르소나 지침이 데이터와 함께 번들링됩니다.</div>' +
      '</div>' +
      '<div class="webcal-feed-box" style="margin-top:14px;padding:12px;background:var(--surface-2);border:1px solid var(--rule);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
          '<span style="font-weight:700;font-size:0.85rem;color:var(--ink);">캘린더 실시간 구독 (WebCal Live Feed)</span>' +
          '<span style="font-size:0.68rem;padding:2px 6px;border-radius:8px;background:var(--accent);color:#fff;font-weight:700;">실시간 자동연동</span>' +
        '</div>' +
        '<p class="faint" style="font-size:0.75rem;margin:0 0 8px;">구글 캘린더, 애플 캘린더, 아웃룩의 [URL로 캘린더 추가]에 등록하면 내 마일스톤과 D-day가 실시간 동기화됩니다.</p>' +
        '<div style="display:flex;gap:6px;">' +
          '<input type="text" id="webcalFeedUrl" readonly style="flex:1;font-size:0.75rem;padding:6px 8px;border-radius:8px;background:var(--bg-input, rgba(0,0,0,0.05));border:1px solid var(--border);" />' +
          '<button class="btn btn-sm btn-secondary" id="btnCopyWebCalUrl" type="button" style="white-space:nowrap;font-size:0.75rem;padding:6px 12px;border-radius:8px;">구독 링크 복사</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:16px;flex-wrap:wrap;gap:8px;">' +
        '<button class="btn btn-ghost" id="mExpCancel" type="button">취소</button>' +
        '<button class="btn btn-secondary" id="mExpCopyPrompt" type="button">AI 프롬프트+데이터 복사</button>' +
        '<button class="btn btn-primary" id="mExpDownload" type="button">파일 다운로드</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#mExpCancel').addEventListener('click', L.closeModal);

        var webcalInput = sheet.querySelector('#webcalFeedUrl');
        var webcalBtn = sheet.querySelector('#btnCopyWebCalUrl');
        var calUrl = buildWebCalUrl((L.state.profile && L.state.profile.id) || 'demo');
        if(webcalInput) webcalInput.value = calUrl;
        fetchSignedCalendarToken().then(function(signedTok){
          if(signedTok && signedTok !== 'demo'){
            calUrl = buildWebCalUrl(signedTok);
            if(webcalInput) webcalInput.value = calUrl;
          }
        });
        if(webcalBtn){
          webcalBtn.addEventListener('click', function(){
            if(navigator.clipboard && navigator.clipboard.writeText){
              navigator.clipboard.writeText(calUrl).then(function(){
                L.triggerHaptic(20);
                L.toast('캘린더 실시간 구독 링크가 복사되었습니다! 캘린더 앱에 붙여넣으세요.');
              }).catch(function(){
                L.toast('복사에 실패했습니다. 링크를 직접 선택하여 복사해주세요.');
              });
            } else {
              L.toast('클립보드 미지원 환경입니다.');
            }
          });
        }

        function getTargetRecords(){
          var themeKey = sheet.querySelector('#expThemeSel').value;
          var targetRecs = allRecs;
          if(themeKey !== 'all'){
            targetRecs = allRecs.filter(function(r){ return (r.theme || 'daily') === themeKey; });
          }
          return { themeKey: themeKey, recs: targetRecs };
        }

        // 복사 버튼 (클립보드에 AI 프롬프트 + 마크다운 테이블 복사)
        sheet.querySelector('#mExpCopyPrompt').addEventListener('click', function(){
          var target = getTargetRecords();
          if(!target.recs.length){
            L.toast('해당 테마에 기록이 없습니다.');
            return;
          }
          var mdContent = buildMarkdownExport(target.recs, target.themeKey, true);
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(mdContent).then(function(){
              L.toast('AI 분석 프롬프트와 '+target.recs.length+'개 기록을 복사했어요! Google Gemini에 붙여넣으세요.');
              L.closeModal();
            }).catch(function(){
              L.toast('복사에 실패했습니다.');
            });
          } else {
            L.download('아워골_AI프롬프트_'+target.themeKey+'_'+L.dateKey(L.nowISO())+'.md', mdContent, 'text/markdown;charset=utf-8');
            L.toast('파일로 저장했습니다.');
            L.closeModal();
          }
        });

        // 다운로드 버튼
        sheet.querySelector('#mExpDownload').addEventListener('click', function(){
          var target = getTargetRecords();
          if(!target.recs.length){
            L.toast('해당 테마에 기록이 없습니다.');
            return;
          }
          var fmt = sheet.querySelector('#expFmtSel').value;
          var withPrompt = sheet.querySelector('#expWithAIPrompt').checked;
          var fnameBase = '아워골_기록_' + target.themeKey + '_' + L.dateKey(L.nowISO());

          if(fmt === 'ics'){
            var icsContent = buildICS(target.recs, L.state.profile.goals);
            L.download(fnameBase + '.ics', icsContent, 'text/calendar;charset=utf-8');
            L.toast('캘린더 연동 파일(.ics)을 다운로드했어요! 더블클릭하면 캘린더에 일정이 추가됩니다.');
          } else if(fmt === 'json'){
            var jsonPayload = {
              exportedAt: L.nowISO(),
              theme: target.themeKey,
              aiAnalysisPrompt: withPrompt ? L.getAIAnalysisPrompt(target.themeKey) : null,
              totalRecords: target.recs.length,
              records: target.recs
            };
            L.download(fnameBase + '.json', JSON.stringify(jsonPayload, null, 2), 'application/json');
          } else if(fmt === 'md'){
            L.download(fnameBase + '.md', buildMarkdownExport(target.recs, target.themeKey, withPrompt), 'text/markdown;charset=utf-8');
          } else {
            // CSV
            var csvStr = '\uFEFF' + L.buildCSV(target.recs);
            if(withPrompt){
              var promptComment = '# ' + L.getAIAnalysisPrompt(target.themeKey).replace(/\r\n/g, '\r\n# ') + '\r\n\r\n';
              csvStr = '\uFEFF' + promptComment + L.buildCSV(target.recs);
            }
            L.download(fnameBase + '.csv', csvStr, 'text/csv;charset=utf-8');
          }

          L.toast('테마 [' + target.themeKey + '] 기록 ' + target.recs.length + '개를 다운로드했어요');
          L.closeModal();
        });
      }
    );
  }
  /* ---- 이전 전 index.html 22505~22508줄(#TASK-ES-474 생성기 표지) ---- */

  function exportAllCheckins(){
    openExportThemeModal();
  }

  K.fetchSignedCalendarToken = fetchSignedCalendarToken;
  K.buildWebCalUrl = buildWebCalUrl;
  K.buildICS = buildICS;
  K.buildMarkdownExport = buildMarkdownExport;
  K.openExportThemeModal = openExportThemeModal;
  K.exportAllCheckins = exportAllCheckins;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
