/**
 * OurGoal Result Modal (목표 탭 — 목표·마일스톤·할 일 공용 결과 입력 모달)
 *
 * #TASK-ES-375 (목표 탭 세포 이전 2차): index.html 인라인 IIFE 의 openResultModal(이전 전 8583~8931줄)을 동작 그대로 옮겼다.
 * 목표 상세(js/tabs/goals/goal-detail-events.js)의 결과 버튼·마일스톤 행·할 일 결과·보관 전 결과 입력이 L.openResultModal 로 부른다
 * (index.html 이 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져오므로, 1차 이음매의 getter 가 그대로 이 함수를 돌려준다).
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 목표 키트 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 선례: 목표 탭 1차 #TASK-ES-370 · 일정 탭 #TASK-ES-360. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 목표 키트: 목표 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* 목표·마일스톤·할 일 공용 결과 입력 모달 */
  function openResultModal(kind, obj, onSaved, goal){
    var r = obj.result || {};
    var kindLabel = kind==='goal' ? '목표' : (kind==='ms' ? '마일스톤' : '할 일');
    var displayTitle = (obj && obj.title && obj.title !== '커리큘럼 정하기' && obj.title !== '커리큘럼') ? obj.title : '';

    var currentDb = r.dbProperties || (r.target || r.result ? {
      title: r.summary || (displayTitle || '실천 기록'),
      status: (L.resultPct(r) >= 100) ? '완료' : '진행중',
      progress: L.resultPct(r) || 100,
      metric: (r.result ? (r.result + (r.unit || '')) : '100%'),
      keyTakeaway: r.note || '',
      tags: ['실천'],
      date: L.isoDate(new Date())
    } : null);

    function renderNotionCardHtml(db){
      if(!db) return '';
      var stColor = db.status==='완료' ? 'var(--sage)' : (db.status==='진행중' ? 'var(--gold)' : 'var(--ink-soft)');
      var stBg = db.status==='완료' ? 'var(--sage-soft)' : (db.status==='진행중' ? 'var(--gold-soft)' : 'var(--rule)');
      return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<span style="font-size:.8125rem;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px;">' +
            '<span>Notion DB 변환 규격</span>' +
          '</span>' +
          '<span class="dday-pill" style="background:'+stBg+';color:'+stColor+';font-weight:700;font-size:.8125rem;">'+L.escapeHtml(db.status)+' ('+db.progress+'%)</span>' +
        '</div>' +
        '<table style="width:100%;font-size:.8125rem;border-collapse:collapse;line-height:1.6;">' +
          '<tr><td style="color:var(--ink-faint);width:76px;padding:2px 0;">항목명</td><td style="font-weight:700;color:var(--ink);">'+L.escapeHtml(db.title||'-')+'</td></tr>' +
          '<tr><td style="color:var(--ink-faint);padding:2px 0;">수치/실적</td><td>'+L.escapeHtml(db.metric||'-')+'</td></tr>' +
          '<tr><td style="color:var(--ink-faint);padding:2px 0;">핵심 성과</td><td>'+L.escapeHtml(db.keyTakeaway||'-')+'</td></tr>' +
          '<tr><td style="color:var(--ink-faint);padding:2px 0;">태그</td><td>'+(db.tags||[]).map(function(t){ return '<span class="chip" style="font-size:.6875rem;padding:2px 6px;margin-right:4px;">#'+L.escapeHtml(t)+'</span>'; }).join('')+'</td></tr>' +
          '<tr><td style="color:var(--ink-faint);padding:2px 0;">일자</td><td>'+L.escapeHtml(db.date||L.isoDate(new Date()))+'</td></tr>' +
        '</table>';
    }

    var previewInitialHtml = '<div id="rsNotionDbPreview" style="'+(currentDb?'':'display:none;')+'margin-bottom:12px;padding:12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;">' +
      (currentDb ? renderNotionCardHtml(currentDb) : '') +
    '</div>';

    L.openModal(
      '<h3>' + kindLabel + ' 결과 기록</h3>' +
      (displayTitle ? '<p class="muted" style="margin:-8px 0 12px;"><b style="color:var(--ink);font-size:.9375rem;">' + L.escapeHtml(displayTitle) + '</b></p>' : '<div style="height:6px;"></div>') +
      '<div id="ambientCheckinCard" style="margin-bottom:12px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--sage-line);border-radius:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<span style="font-size:.875rem;color:var(--sage);font-weight:700;display:flex;align-items:center;gap:4px;">' +
            '<span>제로-입력 선제 예측 체크인</span>' +
          '</span>' +
          '<span style="font-size:.7rem;background:var(--sage-soft);color:var(--sage);padding:2px 6px;border-radius:4px;font-weight:700;">1-Tap 승인</span>' +
        '</div>' +
        '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:8px;">' +
          '오늘 \'' + L.escapeHtml(displayTitle || (obj && obj.title) || '실천') + '\' 100% 완료하셨나요?' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" id="ambientCheckinConfirmBtn" type="button" style="width:100%;font-weight:700;background:var(--sage);border-color:var(--sage);padding:8px 12px;font-size:.875rem;display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span>1-Tap 즉시 승인 및 기록 저장</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-sm" id="ambientCheckinArchiveBtn" type="button" style="width:100%;font-weight:700;margin-top:6px;padding:8px 12px;font-size:.875rem;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--card);border:1px solid var(--sage-line);color:var(--sage);">' +
          '<span>1-Tap 즉시 승인 및 기록 저장 및 보관함으로 이동</span>' +
        '</button>' +
      '</div>' +
      '<div style="margin-bottom:12px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--rule);border-radius:12px;">' +
        '<div style="font-size:.875rem;color:var(--ink);font-weight:700;display:flex;align-items:center;gap:4px;margin-bottom:6px;">' +
          '<span>AI 비서로 결과 입력</span>' +
        '</div>' +
        '<div style="font-size:.8125rem;color:var(--ink-soft);line-height:1.45;margin-bottom:10px;">' +
          '오늘 한 일을 한 줄로 적어주시면 기록으로 알맞게 정리해드려요' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<textarea id="rsAiQuickInput" rows="2" placeholder="예: 오늘 20km 1시간 40분 완주했어 땀 많이 흘림 / 알고리즘 골드 2문제 풀고 오답노트 정리 완료 / 기본서 3단원 50페이지 다 읽음" style="width:100%;box-sizing:border-box;font-size:.875rem;padding:8px 10px;border-radius:8px;border:1px solid var(--rule);background:var(--card);color:var(--ink);resize:vertical;"></textarea>' +
          '<button class="btn btn-primary btn-sm" id="rsAiQuickApplyBtn" type="button" style="align-self:flex-end;font-size:.8125rem;font-weight:700;padding:6px 12px;white-space:nowrap;">' +
            'AI 자동 정리' +
          '</button>' +
        '</div>' +
      '</div>' +

      previewInitialHtml +

      '<div style="margin-bottom:14px;">' +
        '<div id="rsManualToggleBtn" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:8px 12px;background:var(--card);border:1px dashed var(--rule);border-radius:10px;">' +
          '<span style="font-size:.8125rem;font-weight:700;color:var(--ink-soft);display:flex;align-items:center;gap:6px;">' +
            '<span>수동입력하기</span>' +
          '</span>' +
          '<span id="rsManualToggleArrow" style="font-size:.8125rem;color:var(--ink-faint);">펼치기 ▾</span>' +
        '</div>' +
        '<div id="rsManualForm" style="display:none;margin-top:8px;padding:14px;background:#FFFFFF;border:1.5px solid var(--rule);border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,0.06);">' +
          '<div class="field" style="margin-bottom:8px;">' +
            '<label style="font-size:.8125rem;font-weight:700;">실천 내용 / 항목명</label>' +
            '<input id="rsManualTitle" type="text" value="' + L.escapeHtml((currentDb && currentDb.title) || '') + '" placeholder="예: 3강 수강 완료 및 개념 복습" style="font-size:.875rem;padding:6px 10px;">' +
          '</div>' +
          '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
            '<div class="field" style="flex:1;">' +
              '<label style="font-size:.8125rem;font-weight:700;">진행 상태</label>' +
              '<select id="rsManualStatus" style="font-size:.875rem;padding:6px 8px;">' +
                '<option value="완료"'+((!currentDb || currentDb.status==='완료')?' selected':'')+'>완료 (100%)</option>' +
                '<option value="진행중"'+(currentDb && currentDb.status==='진행중'?' selected':'')+'>진행중 (50%)</option>' +
                '<option value="대기"'+(currentDb && currentDb.status==='대기'?' selected':'')+'>계획/대기</option>' +
              '</select>' +
            '</div>' +
            '<div class="field" style="flex:1;">' +
              '<label style="font-size:.8125rem;font-weight:700;">달성률 (%)</label>' +
              '<input id="rsManualPct" type="number" min="0" max="100" value="' + (currentDb ? currentDb.progress : 100) + '" placeholder="100" style="font-size:.875rem;padding:6px 8px;">' +
            '</div>' +
          '</div>' +
          '<div class="field" style="margin-bottom:8px;">' +
            '<label style="font-size:.8125rem;font-weight:700;">달성 수치 / 소요 시간</label>' +
            '<input id="rsManualMetric" type="text" value="' + L.escapeHtml((currentDb && currentDb.metric) || '') + '" placeholder="예: 2시간, 5km, 30쪽" style="font-size:.875rem;padding:6px 10px;">' +
          '</div>' +
          '<div class="field" style="margin-bottom:0;">' +
            '<label style="font-size:.8125rem;font-weight:700;">성과 및 배운 점</label>' +
            '<input id="rsManualKeyTakeaway" type="text" value="' + L.escapeHtml((currentDb && currentDb.keyTakeaway) || '') + '" placeholder="예: 핵심 공식 암기 완료" style="font-size:.875rem;padding:6px 10px;">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="modal-actions" style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost" id="rsCancel" type="button" style="flex:1;min-width:60px;">취소</button>' +
        '<button class="btn btn-secondary" id="rsSave" type="button" style="flex:1;min-width:60px;">저장</button>' +
        '<button class="btn btn-primary" id="rsSaveAndArchive" type="button" style="flex:1.6;min-width:140px;background:var(--emerald);border-color:var(--emerald);">저장 및 보관함으로 이동</button>' +
        (currentDb ? '<button class="btn btn-ghost" id="rsJustArchive" type="button" style="color:var(--amber);border-color:var(--rule);">보관</button>' : '') +
      '</div>',
      function(sheet){
        var aiInput = sheet.querySelector('#rsAiQuickInput');
        var aiApplyBtn = sheet.querySelector('#rsAiQuickApplyBtn');
        var previewBox = sheet.querySelector('#rsNotionDbPreview');

        var manualToggleBtn = sheet.querySelector('#rsManualToggleBtn');
        var manualToggleArrow = sheet.querySelector('#rsManualToggleArrow');
        var manualForm = sheet.querySelector('#rsManualForm');

        var manualTitle = sheet.querySelector('#rsManualTitle');
        var manualStatus = sheet.querySelector('#rsManualStatus');
        var manualPct = sheet.querySelector('#rsManualPct');
        var manualMetric = sheet.querySelector('#rsManualMetric');
        var manualKeyTakeaway = sheet.querySelector('#rsManualKeyTakeaway');

        var activeDbRecord = currentDb;

        // 수동입력하기 토글
        var manualOpen = false;
        manualToggleBtn.addEventListener('click', function(){
          manualOpen = !manualOpen;
          manualForm.style.display = manualOpen ? 'block' : 'none';
          manualToggleArrow.textContent = manualOpen ? '접기 ▴' : '펼치기 ▾';
        });

        // AI 자동 정리
        function runAiConversion(){
          var text = aiInput.value.trim();
          if(!text){ L.toast('달성한 내용을 줄글로 적어주세요'); return; }
          var converted = L.convertTextToNotionDbRecord(text, kind, obj, goal);
          activeDbRecord = converted;
          previewBox.style.display = 'block';
          previewBox.innerHTML = renderNotionCardHtml(converted);

          // 수동 입력 폼에도 동기화
          manualTitle.value = converted.title;
          manualStatus.value = converted.status;
          manualPct.value = converted.progress;
          manualMetric.value = converted.metric;
          manualKeyTakeaway.value = converted.keyTakeaway;

          L.toast('기록 형식으로 변환 완료! ✨');
        }

        aiApplyBtn.addEventListener('click', runAiConversion);
        aiInput.addEventListener('keydown', function(e){
          if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
            e.preventDefault();
            runAiConversion();
          }
        });

        var ambientBtn = sheet.querySelector('#ambientCheckinConfirmBtn');
        if(ambientBtn){
          ambientBtn.addEventListener('click', function(){
            if(window._recordHesitation) window._recordHesitation('ambientCheckinConfirmBtn');
            L.triggerHaptic(30);
            var ambTitle = displayTitle || (obj && obj.title) || '실천 완료';
            var dateStr = L.isoDate(new Date());
            activeDbRecord = {
              title: ambTitle,
              status: '완료',
              progress: 100,
              metric: '100%',
              keyTakeaway: '선제 예측 1-Tap 승인 완료',
              tags: ['실천', '완료', '앰비언트'],
              date: dateStr,
              notionSchema: {
                'Name': { type: 'title', title: [{ type: 'text', text: { content: ambTitle } }] },
                'Status': { type: 'select', select: { name: '완료' } },
                'Progress': { type: 'number', number: 100 },
                'Metric': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: '100%' } }] },
                'KeyTakeaway': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: '선제 예측 1-Tap 승인 완료' } }] },
                'Tags': { type: 'multi_select', multi_select: [{ name: '실천' }, { name: '완료' }, { name: '앰비언트' }] },
                'Date': { type: 'date', date: { start: dateStr } }
              }
            };
            sheet.querySelector('#rsSave').click();
          });
        }

        sheet.querySelector('#rsCancel').addEventListener('click', L.closeModal);

        var runSaveAndArchive = false;

        var saveAndArchiveBtn = sheet.querySelector('#rsSaveAndArchive');
        if(saveAndArchiveBtn){
          saveAndArchiveBtn.addEventListener('click', function(){
            runSaveAndArchive = true;
            sheet.querySelector('#rsSave').click();
          });
        }

        var justArchiveBtn = sheet.querySelector('#rsJustArchive');
        if(justArchiveBtn){
          justArchiveBtn.addEventListener('click', async function(){
            if(goal){
              goal.archivedAt = L.nowISO();
              await L.saveProfile();
              L.toast('목표가 보관함으로 이동되었습니다 📦');
              L.closeModal();
              if(onSaved) onSaved();
              renderGoalDetail();
              renderHomeGoals();
            }
          });
        }

        var ambientArchiveBtn = sheet.querySelector('#ambientCheckinArchiveBtn');
        if(ambientArchiveBtn){
          ambientArchiveBtn.addEventListener('click', async function(){
            if(window._recordHesitation) window._recordHesitation('ambientCheckinArchiveBtn');
            L.triggerHaptic(30);
            var ambTitle = displayTitle || (obj && obj.title) || '실천 완료';
            var dateStr = L.isoDate(new Date());
            activeDbRecord = {
              title: ambTitle,
              status: '완료',
              progress: 100,
              metric: '100%',
              keyTakeaway: '선제 예측 1-Tap 승인 완료 및 보관',
              tags: ['실천', '완료', '앰비언트', '보관'],
              date: dateStr,
              notionSchema: {
                'Name': { type: 'title', title: [{ type: 'text', text: { content: ambTitle } }] },
                'Status': { type: 'select', select: { name: '완료' } },
                'Progress': { type: 'number', number: 100 },
                'Metric': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: '100%' } }] },
                'KeyTakeaway': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: '1-Tap 즉시 승인 및 보관' } }] },
                'Tags': { type: 'multi_select', multi_select: [{ name: '실천' }, { name: '완료' }, { name: '보관' }] },
                'Date': { type: 'date', date: { start: dateStr } }
              }
            };
            runSaveAndArchive = true;
            sheet.querySelector('#rsSave').click();
          });
        }

        sheet.querySelector('#rsSave').addEventListener('click', async function(){
          // 1. AI 텍스트가 입력되어 있으나 아직 변환 버튼을 누르지 않은 경우 즉시 변환
          var aiText = aiInput.value.trim();
          if(aiText && (!activeDbRecord || activeDbRecord.keyTakeaway !== aiText)){
            activeDbRecord = L.convertTextToNotionDbRecord(aiText, kind, obj, goal);
          }

          // 2. 수동입력 폼이 열려있거나 입력값이 있는 경우 수동 입력값 우선 반영
          if(manualTitle.value.trim()){
            var mTitle = manualTitle.value.trim();
            var mStatus = manualStatus.value;
            var mPct = parseInt(manualPct.value, 10);
            if(isNaN(mPct)) mPct = (mStatus === '완료' ? 100 : (mStatus === '진행중' ? 50 : 0));
            var mMetric = manualMetric.value.trim() || (mPct + '%');
            var mTakeaway = manualKeyTakeaway.value.trim() || mTitle;
            var dateStr = L.isoDate(new Date());

            var tags = activeDbRecord ? activeDbRecord.tags : ['실천'];
            if(mStatus === '완료' && tags.indexOf('완료') === -1) tags.push('완료');

            activeDbRecord = {
              title: mTitle,
              status: mStatus,
              progress: mPct,
              metric: mMetric,
              keyTakeaway: mTakeaway,
              tags: tags,
              date: dateStr,
              notionSchema: {
                'Name': { type: 'title', title: [{ type: 'text', text: { content: mTitle } }] },
                'Status': { type: 'select', select: { name: mStatus } },
                'Progress': { type: 'number', number: mPct },
                'Metric': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: mMetric } }] },
                'KeyTakeaway': { type: 'rich_text', rich_text: [{ type: 'text', text: { content: mTakeaway } }] },
                'Tags': { type: 'multi_select', multi_select: tags.map(function(t){ return { name: t }; }) },
                'Date': { type: 'date', date: { start: dateStr } }
              }
            };
          }

          if(!activeDbRecord){
            L.toast('달성한 내용을 적어주시거나 수동입력으로 저장해주세요.');
            return;
          }

          var wasDone = kind==='task' ? !!obj.done : obj.status==='done';
          var pct = activeDbRecord.progress;

          obj.result = {
            target: 100,
            result: pct,
            unit: '%',
            pct: pct,
            note: activeDbRecord.keyTakeaway || activeDbRecord.title,
            summary: activeDbRecord.title,
            dbProperties: {
              title: activeDbRecord.title,
              status: activeDbRecord.status,
              progress: pct,
              metric: activeDbRecord.metric,
              keyTakeaway: activeDbRecord.keyTakeaway,
              tags: activeDbRecord.tags,
              date: activeDbRecord.date
            },
            notionDb: activeDbRecord.notionSchema,
            recordedAt: L.nowISO()
          };

          if(kind==='task') obj.done = pct >= 100;
          if(kind==='ms') obj.status = pct >= 100 ? 'done' : (pct > 0 ? 'doing' : obj.status);

          var nowDone = kind==='task' ? !!obj.done : obj.status==='done';
          var celebrateMs = kind==='ms' && !wasDone && nowDone && !!goal;
          if(!wasDone && nowDone && !celebrateMs){
            if(navigator.vibrate) navigator.vibrate([12,40,24]);
            L.burstConfetti(window.innerWidth/2, window.innerHeight/2);
          }
          var msXpRes = null;
          if(kind==='ms' && !wasDone && obj.status==='done') msXpRes = L.awardXP(L.XP_RULES.milestoneDone, '마일스톤 완료');
          if(runSaveAndArchive && goal){
            goal.archivedAt = L.nowISO();
          }
          await L.saveProfile();
          L.closeModal();
          L.toast(runSaveAndArchive ? '결과 저장 및 보관함으로 이동 완료! 📦' : (pct >= 100 ? '완료로 정리해서 저장 완료!' : '달성률 ' + pct + '%로 정리해서 저장 완료!'));
          if(onSaved) onSaved();
          L.renderLevelBadge();
          if(msXpRes && msXpRes.leveledUp) L.showLevelUpBanner(L.levelForXP(msXpRes.total));
          if(celebrateMs) L.celebrateMilestoneDone(goal, obj);
        });
      }
    );
  }

  K.openResultModal = openResultModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
