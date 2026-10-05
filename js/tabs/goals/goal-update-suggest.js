/**
 * OurGoal Goal Update Suggest (목표 — 기록 기반 목표·마일스톤·할 일 자동 업데이트 제안)
 *
 * 체크인 기록을 보고 AI(또는 로컬 규칙)가 낸 변경 제안을 거르고(sanitizeSuggestions·findSuggestionTarget) 설명하고(describeSuggestion) 반영하는(applySuggestion) 함수와 「진행 상황이 바뀐 것 같아요」 창(maybeShowGoalUpdateModal).
 * scripts/smoke-test.js 의 FN_NAMES 는 인라인 합본(js/tabs 세포 포함)에서 함수를 뽑으므로 이 세포에서 같은 함수를 찾는다.
 * #TASK-ES-483(인라인 어려움 구역 H1 3차): index.html 인라인 IIFE 의 구간(이전 전 7805~7817 · 7818~7837 · 7838~7848 · 7849~7869 · 7870~7939줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 7805~7817줄(#TASK-ES-483 생성기 표지) ---- */
  /* ============ 기록 기반 목표·마일스톤·할 일 자동 업데이트 제안 ============ */
  function findSuggestionTarget(goal, s){
    if(s.type==='milestone'){
      var m = goal.milestones.find(function(x){ return x.id===s.id; });
      return m ? { milestone:m } : null;
    }
    if(s.type==='task'){
      var found = null;
      goal.milestones.forEach(function(m){ (m.tasks||[]).forEach(function(t){ if(t.id===s.id) found = { milestone:m, task:t }; }); });
      return found;
    }
    return null;
  }
  /* ---- 이전 전 index.html 7818~7837줄(#TASK-ES-483 생성기 표지) ---- */
  function sanitizeSuggestions(goal, suggestions){
    var STATUS_VALUES = ['todo','doing','done'];
    return (suggestions||[]).filter(function(s){
      if(!s || !s.type || !s.id || !s.field) return false;
      var target = findSuggestionTarget(goal, s);
      if(!target) return false;
      if(s.field==='status') return s.type==='milestone' && STATUS_VALUES.indexOf(s.value)!==-1 && target.milestone.status!==s.value;
      if(s.field==='done') return s.type==='task' && (s.value===true||s.value===false) && !!target.task.done!==!!s.value;
      if(s.field==='result'){
        var obj = s.type==='task' ? target.task : target.milestone;
        return !!(obj.result && obj.result.target) && !isNaN(Number(s.value));
      }
      if(s.field==='note'){
        var noteObj = s.type==='task' ? target.task : target.milestone;
        var v = typeof s.value==='string' ? s.value.trim() : '';
        return !!v && (!noteObj.result || noteObj.result.note!==v);
      }
      return false;
    });
  }
  /* ---- 이전 전 index.html 7838~7848줄(#TASK-ES-483 생성기 표지) ---- */
  function describeSuggestion(goal, s){
    var target = findSuggestionTarget(goal, s);
    var name = s.type==='task' ? target.task.title : target.milestone.title;
    var icon = s.field==='note' ? '📝' : (s.type==='task' ? '✅' : '🎯');
    var label;
    if(s.field==='status') label = (s.type==='milestone'?'마일스톤':'')+' "'+name+'" → '+(s.value==='done'?'완료로':(s.value==='doing'?'진행중으로':'시작 전으로'))+' 변경';
    else if(s.field==='done') label = '할 일 "'+name+'" → '+(s.value?'완료 체크':'완료 해제');
    else if(s.field==='note') label = '"'+name+'" 결과 메모 → "'+s.value+'"';
    else label = '"'+name+'" 결과 수치 → '+s.value+'로 업데이트';
    return { icon:icon, label:label, reason:s.reason||'' };
  }
  /* ---- 이전 전 index.html 7849~7869줄(#TASK-ES-483 생성기 표지) ---- */
  function applySuggestion(goal, s){
    var target = findSuggestionTarget(goal, s);
    if(!target) return false;
    if(s.field==='status'){ target.milestone.status = s.value; return true; }
    if(s.field==='done'){ target.task.done = !!s.value; return true; }
    if(s.field==='result'){
      var obj = s.type==='task' ? target.task : target.milestone;
      obj.result.result = s.value;
      if(Number(s.value) >= Number(obj.result.target)){
        if(s.type==='task') obj.done = true; else obj.status = 'done';
      }
      return true;
    }
    if(s.field==='note'){
      var noteObj = s.type==='task' ? target.task : target.milestone;
      if(!noteObj.result) noteObj.result = { target:'', result:'', unit:'회', note:'' };
      noteObj.result.note = s.value;
      return true;
    }
    return false;
  }
  /* ---- 이전 전 index.html 7870~7939줄(#TASK-ES-483 생성기 표지) ---- */
  function maybeShowGoalUpdateModal(goal, fb){
    if(!goal || !fb || L.state.profile.settings.autoUpdateSuggest===false) return;
    var valid = sanitizeSuggestions(goal, fb.suggestions);
    if(!valid.length) return;
    L.openModal(
      '<h3>진행 상황이 바뀐 것 같아요</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;">방금 남긴 기록을 보고 AI가 발견한 변경사항이에요. 반영할 항목만 골라주세요.</p>' +
      '<div class="ms-list">' +
        valid.map(function(s, idx){
          var d = describeSuggestion(goal, s);
          return '<div class="ms-row" data-sugpick="'+idx+'" style="cursor:pointer;">' +
            '<div class="ms-main">' +
              '<div class="sel-check on" data-sugchk="'+idx+'"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:.875rem;font-weight:700;">'+d.icon+' '+L.escapeHtml(d.label)+'</div>' +
                (d.reason ? '<div class="faint" style="font-size:.8125rem;">'+L.escapeHtml(d.reason)+'</div>' : '') +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="sugSkipBtn" type="button">그냥 둘게요</button><button class="btn btn-primary" id="sugApplyBtn" type="button">선택 반영하기</button></div>',
      function(sheet){
        var checked = valid.map(function(){ return true; });
        sheet.querySelectorAll('[data-sugpick]').forEach(function(row){
          row.addEventListener('click', function(){
            var i = +row.dataset.sugpick;
            checked[i] = !checked[i];
            var chk = row.querySelector('[data-sugchk]');
            chk.classList.toggle('on', checked[i]);
            chk.textContent = checked[i] ? '✓' : '';
          });
        });
        sheet.querySelector('#sugSkipBtn').addEventListener('click', L.closeModal);
        sheet.querySelector('#sugApplyBtn').addEventListener('click', async function(){
          var applied = [];
          var newlyDoneMsCount = 0;
          var newlyDoneMs = [];
          valid.forEach(function(s, i){
            if(!checked[i]) return;
            var target = findSuggestionTarget(goal, s);
            var wasMsDone = s.type==='milestone' && target && target.milestone.status==='done';
            if(applySuggestion(goal, s)){
              applied.push(describeSuggestion(goal, s));
              if(s.type==='milestone' && target && !wasMsDone && target.milestone.status==='done'){
                newlyDoneMsCount++;
                newlyDoneMs.push(target.milestone);
              }
            }
          });
          if(!applied.length){ L.closeModal(); return; }
          var lastXpRes = null;
          for(var i=0;i<newlyDoneMsCount;i++) lastXpRes = L.awardXP(L.XP_RULES.milestoneDone, '마일스톤 완료');
          await L.saveProfile();
          L.closeModal();
          var becameDone = applied.some(function(a){ return a.label.indexOf('완료')!==-1; });
          if(becameDone && !newlyDoneMs.length){
            if(navigator.vibrate) navigator.vibrate([12,40,24]);
            var btnRect = document.getElementById('captureSave').getBoundingClientRect();
            L.burstConfetti(btnRect.left+btnRect.width/2, btnRect.top);
          }
          L.toast(applied.length+'개 항목을 목표에 반영했어요 🎯');
          L.renderAll();
          L.renderLevelBadge();
          if(lastXpRes && lastXpRes.leveledUp) L.showLevelUpBanner(L.levelForXP(lastXpRes.total));
          if(newlyDoneMs.length) L.celebrateMilestoneDone(goal, newlyDoneMs[0]);
        });
      }
    );
  }

  K.findSuggestionTarget = findSuggestionTarget;
  K.sanitizeSuggestions = sanitizeSuggestions;
  K.describeSuggestion = describeSuggestion;
  K.applySuggestion = applySuggestion;
  K.maybeShowGoalUpdateModal = maybeShowGoalUpdateModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
