/**
 * OurGoal Result Input (목표 탭 — 게이지·결과 수치 입력·AI 결과 비서)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   gaugeSvg — 「Gauge SVG」(이전 전 8274~8287줄, 구획 주석 포함)
 *   hybridDashboardHtml — 「하이브리드 목표 대시보드」(이전 전 8335~8362줄, 구획 주석 포함)
 *   resultLineHtml — 「결과 기록 (체크박스 대신 수치 입력)」(이전 전 8374~8390줄)
 *   openAiResultAssistantModal — 「AI 결과 입력 비서 (Req 7)」(이전 전 8392~8504줄, 구획 주석 포함)
 * 목표 게이지 SVG, 하이브리드 대시보드·결과 한 줄 그리기, AI 결과 입력 비서 창.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ Gauge SVG ============ */
  function gaugeSvg(pct, size, color){
    size = size || 56;
    var r = size/2 - 6;
    var c = 2*Math.PI*r;
    var dash = (pct/100)*c;
    var cx = size/2, cy = size/2;
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">' +
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(20,22,43,.08)" stroke-width="6"/>' +
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="6" stroke-linecap="round" ' +
        'stroke-dasharray="'+dash.toFixed(1)+' '+(c-dash).toFixed(1)+'" transform="rotate(-90 '+cx+' '+cy+')"/>' +
      '<text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" font-size="'+(size*0.2)+'" font-weight="700" fill="'+color+'" font-family="Noto Sans KR, sans-serif">'+Math.round(pct)+'%</text>' +
    '</svg>';
  }

  /* ============ 하이브리드 목표 대시보드 (2개 이상 병행 시) ============ */
  function hybridDashboardHtml(goals){
    if(goals.length < 2) return '';
    var sumPct = 0, topics = {};
    goals.forEach(function(g){ sumPct += L.goalProgress(g); var major=(g.topic||'').split('/')[0]; if(major) topics[major]=true; });
    var avgPct = Math.round(sumPct/goals.length);
    var topicCount = Math.max(1, Object.keys(topics).length);
    var rows = goals.slice().sort(function(a,b){ return L.goalProgress(b)-L.goalProgress(a); }).map(function(g){
      var pct = L.goalProgress(g);
      var color = pct>=67 ? '#1FC98E' : (pct>=34 ? '#FF9F1C' : '#FF4F64');
      var dd = g.dueDate ? L.dDay(g.dueDate) : '';
      var ddNum = /^D-(\d+)$/.exec(dd);
      var urgent = ddNum && Number(ddNum[1])<=7 && pct<50;
      var icon = g.topic ? L.topicLabel(g.topic).split(' ')[0] : '🎯';
      return '<div class="hybrid-row" data-detail="'+g.id+'" style="cursor:pointer;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.8125rem;font-weight:700;margin-bottom:4px;">' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+icon+' '+L.escapeHtml(g.title)+'</span>' +
          '<span style="flex:0 0 auto;color:'+color+';">'+pct+'%'+(urgent?' ⚠️':'')+'</span>' +
        '</div>' +
        '<div class="group-bar"><span style="width:'+pct+'%;background:'+color+';"></span></div>' +
        (dd ? '<div class="faint" style="font-size:.6875rem;margin-top:3px;">'+dd+(urgent?' · 진행이 더뎌요, 서둘러보세요':'')+'</div>' : '') +
      '</div>';
    }).join('');
    return '<div class="card" id="hybridDash" style="margin-bottom:14px;">' +
      '<div class="card-title-row" style="margin-bottom:10px;"><h3 style="margin:0;font-size:.9375rem;">목표 현황판</h3><span class="faint" style="font-size:.6875rem;">동시에 굴리는 목표 한눈에</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;">'+rows+'</div>' +
    '</div>';
  }

  /* [#TASK-ES-370] resultBadgeHtml → js/tabs/goals/goal-detail.js 로 옮김(목표 탭 세포) */
  function resultLineHtml(r){
    var pct = L.resultPct(r);
    if(!r || (!r.target && !r.result && !r.note && !r.dbProperties && !r.summary)) return '';
    var bar = pct!==null ? '<div class="mini-bar"><span style="width:'+Math.min(100,pct)+'%;background:'+(pct>=100?'var(--sage)':'var(--gold)')+';"></span></div>' : '';
    var txt = [];
    if(r.dbProperties){
      if(r.dbProperties.status) txt.push(L.escapeHtml(r.dbProperties.status));
      if(r.dbProperties.metric) txt.push(L.escapeHtml(r.dbProperties.metric));
      if(r.dbProperties.keyTakeaway) txt.push(L.escapeHtml(r.dbProperties.keyTakeaway));
    } else {
      if(r.target || r.result) txt.push('실제 '+(r.result||0)+' / 목표 '+(r.target||'-')+' '+(r.unit||''));
      if(r.note) txt.push(L.escapeHtml(r.note));
    }
    if(r.summary && !r.dbProperties) txt.push(L.escapeHtml(r.summary));
    return '<div class="faint" style="font-size:.8125rem;margin-top:4px;">'+txt.join(' · ')+'</div>'+bar;
  }

  /* ============ AI 결과 입력 비서 (Req 7) ============ */
  function openAiResultAssistantModal(kind, obj, goal, onSaved){
    var kindLabel = kind==='goal' ? '목표' : (kind==='ms' ? '마일스톤' : '할 일');
    var existingResult = obj.result || { target:'', result:'', unit:'회', note:'' };

    L.openModal(
      '<h3>AI ' + kindLabel + ' 결과 입력</h3>' +
      '<p class="muted" style="margin:-8px 0 10px;"><b style="color:var(--ink);">' + L.escapeHtml(obj.title) + '</b></p>' +
      '<p class="faint" style="margin:0 0 14px;font-size:.8125rem;">수치를 복잡하게 입력할 필요 없이, 오늘 달성한 내용을 한 줄로 편하게 적어주시면 AI가 알아서 기록해드려요!</p>' +
      '<div class="field">' +
        '<label>오늘 달성한 내용 말씀해주세요</label>' +
        '<textarea id="aiResInput" rows="3" style="width:100%;box-sizing:border-box;border-radius:12px;padding:10px;font-size:.875rem;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);resize:vertical;" placeholder="예: 오늘 20km 1시간 40분 만에 완주했어 땀 많이 흘림&#10;예: 목표 50개 중 42개 성공&#10;예: 오늘 100% 다 끝냈어!"></textarea>' +
      '</div>' +
      '<div id="aiResPreviewBox" style="display:none;margin-bottom:14px;padding:12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;"></div>' +
      '<div class="modal-actions" style="gap:8px;">' +
        '<button class="btn btn-ghost" id="aiResCancel" type="button">취소</button>' +
        '<button class="btn btn-primary" id="aiResApply" type="button">AI 분석 & 반영</button>' +
      '</div>',
      function(sheet){
        var input = sheet.querySelector('#aiResInput');
        var previewBox = sheet.querySelector('#aiResPreviewBox');
        var applyBtn = sheet.querySelector('#aiResApply');
        sheet.querySelector('#aiResCancel').onclick = L.closeModal;

        var draftResult = null;
        applyBtn.onclick = async function(){
          var text = input.value.trim();
          if(!text){ L.toast('달성한 내용을 입력해주세요'); return; }

          if(!draftResult){
            var targetNum = existingResult.target || 10;
            var resultNum = 0;
            var unit = existingResult.unit || '회';
            var note = text;

            if(/(?:km|킬로|킬로미터)/i.test(text)) unit = 'km';
            else if(/(?:분|min|시간|h)/i.test(text)) unit = '분';
            else if(/(?:쪽|페이지|page|p)/i.test(text)) unit = '쪽';
            else if(/(?:개|개수)/i.test(text)) unit = '개';
            else if(/(?:잔|컵)/i.test(text)) unit = '잔';
            else if(/(?:%|퍼센트)/i.test(text)) unit = '%';

            var pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
            if(pctMatch){
              targetNum = 100;
              resultNum = Math.min(999, Math.round(parseFloat(pctMatch[1])));
              unit = '%';
            } else {
              var fractionMatch = text.match(/(\d+)\s*(?:개|km|회|쪽)?\s*(?:목표\s*)?(?:중|에서)\s*(\d+)/);
              if(fractionMatch){
                targetNum = parseInt(fractionMatch[1], 10);
                resultNum = parseInt(fractionMatch[2], 10);
              } else {
                var singleNum = text.match(/(\d+(?:\.\d+)?)\s*(?:회|km|분|쪽|개|잔|시간)?/);
                if(singleNum){
                  resultNum = parseFloat(singleNum[1]);
                  if(/시간/.test(text)) resultNum = Math.round(resultNum * 60);
                  if(!targetNum || targetNum < resultNum) targetNum = resultNum;
                } else if(/(?:다 했|완료|끝|성공|완주)/.test(text)){
                  resultNum = targetNum || 10;
                  targetNum = resultNum;
                } else {
                  resultNum = 1; targetNum = 1;
                }
              }
            }

            var pct = Math.round((resultNum / (targetNum || 1)) * 100);
            draftResult = {
              target: targetNum,
              result: resultNum,
              unit: unit,
              note: note,
              recordedAt: L.nowISO()
            };

            previewBox.style.display = 'block';
            previewBox.innerHTML =
              '<div style="font-weight:700;font-size:.875rem;color:var(--ink);margin-bottom:6px;">AI가 추출한 결과</div>' +
              '<div style="font-size:.875rem;color:var(--ink);line-height:1.6;">' +
                '• 달성 결과: <b>' + resultNum + ' ' + unit + '</b> / 목표 ' + targetNum + ' ' + unit + '<br>' +
                '• 달성률: <b style="color:' + (pct>=100 ? 'var(--sage)' : 'var(--gold)') + ';">' + pct + '%</b>' + (pct>=100 ? ' 🎉 (완료!)' : '') + '<br>' +
                '• 메모: ' + L.escapeHtml(note) +
              '</div>';

            applyBtn.textContent = '이대로 결과 기록하기';
            applyBtn.className = 'btn btn-primary';
          } else {
            var wasDone = kind==='task' ? !!obj.done : obj.status==='done';
            obj.result = draftResult;
            var pct = L.resultPct(obj.result);
            if(kind==='task') obj.done = pct!==null ? pct>=100 : !!obj.result.result;
            if(kind==='ms' && pct!==null) obj.status = pct>=100 ? 'done' : (pct>0 ? 'doing' : obj.status);
            var nowDone = kind==='task' ? !!obj.done : obj.status==='done';
            var celebrateMs = kind==='ms' && !wasDone && nowDone && !!goal;
            if(!wasDone && nowDone && !celebrateMs){
              if(navigator.vibrate) navigator.vibrate([12,40,24]);
              L.burstConfetti(window.innerWidth/2, window.innerHeight/2);
            }
            var msXpRes = null;
            if(kind==='ms' && !wasDone && obj.status==='done') msXpRes = L.awardXP(L.XP_RULES.milestoneDone, '마일스톤 완료');
            await L.saveProfile();
            L.closeModal();
            L.toast(pct!==null ? '달성률 ' + pct + '%로 기록했어요' : '결과를 기록했어요');
            if(onSaved) onSaved();
            L.renderLevelBadge();
            if(msXpRes && msXpRes.leveledUp) L.showLevelUpBanner(L.levelForXP(msXpRes.total));
            if(celebrateMs) L.celebrateMilestoneDone(goal, obj);
          }
        };
      }
    );
  }

  K.gaugeSvg = gaugeSvg;
  K.hybridDashboardHtml = hybridDashboardHtml;
  K.resultLineHtml = resultLineHtml;
  K.openAiResultAssistantModal = openAiResultAssistantModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
