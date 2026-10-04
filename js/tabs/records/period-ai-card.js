/**
 * OurGoal Records: Period AI Feedback Card (기록 탭 기간별 기록 AI 피드백 카드)
 *
 * #TASK-ES-358 (기록 탭 세포 이전): index.html 인라인 IIFE 의 기간별 AI 피드백 카드 코드(이전 전 33109~33375줄)를 동작 그대로 옮겼다.
 *   initPeriodAiCard · generatePeriodAIFeedback · generateLocalPeriodFeedback · renderPeriodFeedbackResult
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * renderRecordsScreen(js/tabs/records/render.js)이 K.initPeriodAiCard 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 기록 키트: 기록 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ============ 기간별 기록 AI 피드백 카드 (Req 4) ============ */
  function initPeriodAiCard(records){
    var card = document.getElementById('periodAiCard');
    if(!card) return;
    var startInp = document.getElementById('periodStartDate');
    var endInp = document.getElementById('periodEndDate');
    var countBadge = document.getElementById('periodRecordCountBadge');
    var requestBtn = document.getElementById('periodAiRequestBtn');
    var resultSlot = document.getElementById('periodAiResultSlot');
    var presetRow = document.getElementById('periodPresetRow');
    if(!startInp || !endInp || !countBadge || !requestBtn || !resultSlot) return;

    var today = new Date();
    var todayStr = L.isoDate(today);

    function setDateRange(days, isMonth){
      if(isMonth){
        var y = today.getFullYear();
        var m = today.getMonth();
        startInp.value = y + '-' + L.pad(m+1) + '-01';
        endInp.value = todayStr;
      } else {
        var s = new Date(today);
        s.setDate(s.getDate() - (days - 1));
        startInp.value = L.isoDate(s);
        endInp.value = todayStr;
      }
      updateCount();
    }

    function getFilteredRecords(){
      var sVal = startInp.value;
      var eVal = endInp.value;
      if(!sVal || !eVal) return [];
      var sTime = new Date(sVal + 'T00:00:00').getTime();
      var eTime = new Date(eVal + 'T23:59:59').getTime();
      return (records || L.state.profile.records || []).filter(function(r){
        var t = new Date(r.startAt).getTime();
        return !isNaN(t) && t >= sTime && t <= eTime;
      });
    }

    function updateCount(){
      var recs = getFilteredRecords();
      countBadge.textContent = '기간 내 기록: ' + recs.length + '건';
    }

    if(!startInp.value || !endInp.value){
      setDateRange(7, false);
    } else {
      updateCount();
    }

    if(presetRow && !presetRow._bound){
      presetRow._bound = true;
      presetRow.querySelectorAll('button[data-perioddays]').forEach(function(btn){
        btn.onclick = function(){
          presetRow.querySelectorAll('button').forEach(function(b){
            b.classList.remove('active');
            b.style.border = '1px solid var(--rule)';
            b.style.background = 'var(--card2)';
            b.style.color = 'var(--ink)';
            b.style.fontWeight = 'normal';
          });
          btn.classList.add('active');
          btn.style.border = '1px solid var(--violet)';
          btn.style.background = 'var(--violet-soft)';
          btn.style.color = 'var(--violet)';
          btn.style.fontWeight = '700';

          var val = btn.dataset.perioddays;
          if(val === 'month'){
            setDateRange(0, true);
          } else {
            setDateRange(parseInt(val, 10), false);
          }
        };
      });
    }

    startInp.onchange = updateCount;
    endInp.onchange = updateCount;

    requestBtn.onclick = async function(){
      var filtered = getFilteredRecords();
      if(!filtered.length){
        L.toast('해당 기간에 등록된 기록이 없습니다. 기간을 변경해보세요.');
        return;
      }
      var sVal = startInp.value;
      var eVal = endInp.value;

      resultSlot.style.display = 'block';
      resultSlot.innerHTML = '<div class="fb-card mid" style="border-radius:12px;padding:16px;text-align:center;">' +
        '<div style="font-size:1.3rem;margin-bottom:6px;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 0 0-4 4v1a4 4 0 0 0-3 4 4 4 0 0 0 3 4v1a4 4 0 0 0 8 0v-1a4 4 0 0 0 3-4 4 4 0 0 0-3-4V7a4 4 0 0 0-4-4z"/></svg></div>' +
        '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">AI 코치가 ' + sVal + ' ~ ' + eVal + ' 기간의 기록(' + filtered.length + '건)을 종합 분석 중입니다…</div>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:4px;">실천 패턴, 주요 테마 분포, 누적 성장치를 분석하고 있습니다.</div>' +
      '</div>';

      try {
        var fb = await generatePeriodAIFeedback(sVal, eVal, filtered);
        renderPeriodFeedbackResult(resultSlot, fb, sVal, eVal, filtered);
      } catch(err) {
        console.warn('Period AI feedback failed:', err);
        var localFb = generateLocalPeriodFeedback(sVal, eVal, filtered);
        renderPeriodFeedbackResult(resultSlot, localFb, sVal, eVal, filtered);
      }
    };
  }

  async function generatePeriodAIFeedback(startDate, endDate, filteredRecs){
    var settings = L.state.profile.settings || {};
    var themeCounts = {};
    filteredRecs.forEach(function(r){
      var th = r.theme || 'daily';
      themeCounts[th] = (themeCounts[th] || 0) + 1;
    });

    var summaryLines = filteredRecs.slice(0, 15).map(function(r, idx){
      return (idx+1) + '. [' + L.dateKey(r.startAt) + '] (' + (r.theme||'일상') + ') ' + r.text.slice(0, 50);
    }).join('\r\n');

    var prompt = '당신은 목표 달성 및 라이프 코칭 수석 AI입니다. 아래 사용자의 특정 기간(' + startDate + ' ~ ' + endDate + ') 총 ' + filteredRecs.length + '건의 실천 기록을 종합 분석하여 건설적이고 따뜻한 코칭 리포트를 작성해주세요.\r\n\r\n' +
      '[기간 요약]\r\n- 기간: ' + startDate + ' ~ ' + endDate + '\r\n- 총 기록 수: ' + filteredRecs.length + '건\r\n- 테마 분포: ' + JSON.stringify(themeCounts) + '\r\n\r\n' +
      '[주요 기록 샘플]\r\n' + summaryLines + '\r\n\r\n' +
      '다음 JSON 형식으로만 답하세요. 마크다운이나 코드블록 없이 순수 JSON만 출력하세요:\r\n' +
      '{\r\n' +
      '  "verdict": "탁월한 실천력 또는 꾸준한 루틴 또는 도약 필요 중 하나",\r\n' +
      '  "comment": "이 기간 동안의 총평 및 격려 (2문장)",\r\n' +
      '  "strengths": ["잘한 점 1", "잘한 점 2"],\r\n' +
      '  "advice": ["개선 및 다음 기간 추천 액션 1", "추천 액션 2"]\r\n' +
      '}';

    var provider = settings.aiProvider || 'gemini';
    if(provider === 'gemini' && settings.geminiKey){
      var model = settings.geminiModel || 'gemini-2.5-flash';
      var res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': settings.geminiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if(!res.ok) throw new Error('Gemini error');
      var data = await res.json();
      var raw = ((data.candidates||[])[0]||{}).content && data.candidates[0].content.parts
        ? data.candidates[0].content.parts.map(function(p){ return p.text||''; }).join('\r\n') : '';
      var parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
      parsed.source = 'gemini';
      return parsed;
    }

    var serverRes = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalTitle: '기간 종합 분석 (' + startDate + ' ~ ' + endDate + ')',
        milestones: [],
        text: prompt,
        customPrompt: '주어진 프롬프트 형식의 JSON으로만 답하세요.',
        geminiKey: settings.geminiKey || ''
      })
    });
    if(!serverRes.ok) throw new Error('Server error');
    var sData = await serverRes.json();
    if(sData && sData.verdict && sData.comment){
      sData.source = 'ai';
      return sData;
    }
    return generateLocalPeriodFeedback(startDate, endDate, filteredRecs);
  }

  function generateLocalPeriodFeedback(startDate, endDate, filteredRecs){
    var count = filteredRecs.length;
    var themeCounts = {};
    var datesSet = new Set();
    filteredRecs.forEach(function(r){
      var th = r.theme || 'daily';
      themeCounts[th] = (themeCounts[th] || 0) + 1;
      datesSet.add(L.dateKey(r.startAt));
    });
    var activeDays = datesSet.size;
    var topTheme = Object.keys(themeCounts).sort(function(a,b){ return themeCounts[b] - themeCounts[a]; })[0] || 'daily';
    var thObj = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[topTheme]) ? L.RECORD_THEMES[topTheme] : { label: '일상', icon: '🌱' };

    var verdict = count >= 5 ? '탁월한 실천력' : (count >= 2 ? '꾸준한 루틴 형성' : '한 걸음의 시작');
    var comment = startDate + '부터 ' + endDate + '까지 총 ' + activeDays + '일 동안 ' + count + '건의 실천을 완수하셨습니다. 특히 [' + thObj.label + '] 영역에서의 꾸준한 실천이 성장의 단단한 발판이 되고 있습니다.';

    var strengths = [
      activeDays + '일간 목표를 잊지 않고 실천에 옮긴 꾸준한 실행력',
      '[' + thObj.label + '] 테마 중심의 몰입도 높은 집중 실천'
    ];

    var advice = [
      '활동일 외의 공백기를 최소화할 수 있도록 일일 초미니 루틴(5분)을 설계해보세요.',
      '달성한 실천 데이터를 바탕으로 다음 마일스톤 목표를 점검하고 업데이트해보세요.'
    ];

    return {
      verdict: verdict,
      comment: comment,
      strengths: strengths,
      advice: advice,
      source: 'local'
    };
  }

  function renderPeriodFeedbackResult(slot, fb, sVal, eVal, records){
    var vClass = L.verdictClass(fb.verdict);
    var thCounts = {};
    records.forEach(function(r){
      var th = r.theme || 'daily';
      thCounts[th] = (thCounts[th] || 0) + 1;
    });

    var chipsHtml = Object.keys(thCounts).map(function(k){
      var obj = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[k]) ? L.RECORD_THEMES[k] : { label: k, icon: '📝' };
      return '<span class="dday-pill" style="font-size:.8125rem;background:var(--card2);border:1px solid var(--rule);">' + obj.icon + ' ' + obj.label + ' ' + thCounts[k] + '건</span>';
    }).join(' ');

    var strengthsHtml = (fb.strengths && fb.strengths.length) ? (
      '<div style="margin-top:10px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:4px;">핵심 강점</div>' +
        '<ul style="margin:0;padding-left:18px;font-size:.8125rem;color:var(--ink-soft);line-height:1.5;">' +
          fb.strengths.map(function(s){ return '<li>' + L.escapeHtml(s) + '</li>'; }).join('') +
        '</ul>' +
      '</div>'
    ) : '';

    var adviceHtml = (fb.advice && fb.advice.length) ? (
      '<div style="margin-top:8px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:4px;">실천 가이드</div>' +
        '<ul style="margin:0;padding-left:18px;font-size:.8125rem;color:var(--ink-soft);line-height:1.5;">' +
          fb.advice.map(function(a){ return '<li>' + L.escapeHtml(a) + '</li>'; }).join('') +
        '</ul>' +
      '</div>'
    ) : '';

    slot.innerHTML =
      '<div class="fb-card ' + vClass + '" style="border-radius:16px;padding:16px;position:relative;">' +
        '<span class="fb-close" id="periodFbCloseBtn" style="cursor:pointer;position:absolute;top:10px;right:14px;font-size:1.2rem;">×</span>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
          '<span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 0 0-4 4v1a4 4 0 0 0-3 4 4 4 0 0 0 3 4v1a4 4 0 0 0 8 0v-1a4 4 0 0 0 3-4 4 4 0 0 0-3-4V7a4 4 0 0 0-4-4z"/></svg></span>' +
          '<b style="font-size:.875rem;color:var(--ink);">기간 종합 코칭 리포트</b>' +
          '<span class="dday-mini" style="background:var(--surface-2);color:var(--ink);font-weight:700;">' + sVal + ' ~ ' + eVal + '</span>' +
        '</div>' +
        '<div class="fb-verdict" style="font-size:1.0625rem;margin-bottom:6px;">' + L.escapeHtml(fb.verdict) + '</div>' +
        '<div class="fb-row" style="font-size:.8125rem;line-height:1.5;margin-bottom:10px;">' + L.escapeHtml(fb.comment) + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">' + chipsHtml + '</div>' +
        strengthsHtml +
        adviceHtml +
        '<div class="fb-source" style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span>' + (fb.source === 'gemini' || fb.source === 'ai' ? 'Gemini 3.1 수석 분석' : '스마트 로컬 분석') + '</span>' +
          '<button class="btn btn-ghost btn-sm" id="periodFbShareBtn" type="button" style="font-size:.8125rem;padding:4px 10px;">피드에 공유</button>' +
        '</div>' +
      '</div>';

    slot.querySelector('#periodFbCloseBtn').onclick = function(){
      slot.innerHTML = '';
      slot.style.display = 'none';
    };

    var shareBtn = slot.querySelector('#periodFbShareBtn');
    if(shareBtn){
      shareBtn.onclick = function(){
        L.openShareToFeedModal();
      };
    }
  }

  K.initPeriodAiCard = initPeriodAiCard;
  K.generatePeriodAIFeedback = generatePeriodAIFeedback;
  K.generateLocalPeriodFeedback = generateLocalPeriodFeedback;
  K.renderPeriodFeedbackResult = renderPeriodFeedbackResult;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
