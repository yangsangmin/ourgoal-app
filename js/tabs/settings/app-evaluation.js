/**
 * OurGoal App Evaluation (설정 — 아워골 평가해주기 90% 팝업)
 *
 * 홈 「🎯 오늘 목표」 창의 <아워골 평가해주기> 단추로 여는 평가 창 열기·닫기·초기화(openAppEvaluationModal·closeAppEvaluationModal·resetAppEvaluationForm)와 배경 누르기 닫기·제출 처리기.
 * 같은 묶음 끝의 홈 「새 목표」 단추 처리기(#homeAddGoal → promptNewGoal)도 로드 중 문이라 함께 감싸 옮겼다. 처리기 등록은 index.html 원래 자리에서 bind 함수를 불러 순서가 같다.
 * #TASK-ES-466(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 14009~14013 · 14014~14018 · 14031~14035 · 14036~14042 · 14046~14128 · 14129~14133줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 14009~14013줄(#TASK-ES-466 생성기 표지) ---- */
  function openAppEvaluationModal(){
    var m = document.getElementById('appEvaluationModal');
    if(!m) return;
    m.style.display = 'flex';
  }
  /* ---- 이전 전 index.html 14014~14018줄(#TASK-ES-466 생성기 표지) ---- */
  function closeAppEvaluationModal(){
    var m = document.getElementById('appEvaluationModal');
    if(!m) return;
    m.style.display = 'none';
  }

  /* ---- 이전 전 index.html 14031~14035줄(#TASK-ES-466 생성기 표지) ---- */
  function bindAppEvalBackdrop() { /* [#TASK-ES-466] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.modalEvalElem){
    L.modalEvalElem.addEventListener('click', function(e){
      if(e.target === L.modalEvalElem) closeAppEvaluationModal();
    });
  }
  } /* bindAppEvalBackdrop */
  /* ---- 이전 전 index.html 14036~14042줄(#TASK-ES-466 생성기 표지) ---- */
  function resetAppEvaluationForm(){
    if(document.getElementById('evalScoreInput')) document.getElementById('evalScoreInput').value = '';
    if(document.getElementById('evalProsInput')) document.getElementById('evalProsInput').value = '';
    if(document.getElementById('evalConsInput')) document.getElementById('evalConsInput').value = '';
    if(document.getElementById('evalImprovementsInput')) document.getElementById('evalImprovementsInput').value = '';
    if(document.getElementById('evalCeoMsgInput')) document.getElementById('evalCeoMsgInput').value = '';
  }

  /* ---- 이전 전 index.html 14046~14128줄(#TASK-ES-466 생성기 표지) ---- */
  function bindAppEvalSubmit() { /* [#TASK-ES-466] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnSubmitEval){
    L.btnSubmitEval.addEventListener('click', function(){
      var scoreVal = parseInt((document.getElementById('evalScoreInput') ? document.getElementById('evalScoreInput').value : ''), 10);
      var prosVal = (document.getElementById('evalProsInput') ? document.getElementById('evalProsInput').value : '').trim();
      var consVal = (document.getElementById('evalConsInput') ? document.getElementById('evalConsInput').value : '').trim();
      var impVal = (document.getElementById('evalImprovementsInput') ? document.getElementById('evalImprovementsInput').value : '').trim();
      var ceoVal = (document.getElementById('evalCeoMsgInput') ? document.getElementById('evalCeoMsgInput').value : '').trim();

      if(isNaN(scoreVal) && !prosVal && !consVal && !impVal && !ceoVal){
        L.toast('평가 항목을 최소 하나 이상 입력해주세요.');
        return;
      }
      if(!isNaN(scoreVal) && (scoreVal < 0 || scoreVal > 100)){
        L.toast('종합 점수는 0~100점 사이로 입력해주세요.');
        return;
      }

      if(!L.state.profile.settings) L.state.profile.settings = {};
      if(!Array.isArray(L.state.profile.settings.appEvaluations)) L.state.profile.settings.appEvaluations = [];
      var evalItem = {
        id: 'eval_' + Date.now(),
        score: isNaN(scoreVal) ? null : scoreVal,
        pros: prosVal,
        cons: consVal,
        improvements: impVal,
        ceoMsg: ceoVal,
        createdAt: new Date().toISOString()
      };
      L.state.profile.settings.appEvaluations.push(evalItem);
      L.saveProfile();

      // [#TASK-ES-268] Supabase app_evaluations 테이블 직접 적재
      if(typeof L.sb !== 'undefined' && L.sb && typeof L.sb.from === 'function'){
        try {
          L.sb.from('app_evaluations').insert({
            id: evalItem.id,
            user_id: (L.state.profile && L.state.profile.id) || null,
            user_name: (L.state.profile && (L.state.profile.displayName || L.state.profile.nickname || L.state.profile.name)) || '회원',
            score: evalItem.score,
            pros: evalItem.pros,
            cons: evalItem.cons,
            improvements: evalItem.improvements,
            ceo_msg: evalItem.ceoMsg,
            created_at: evalItem.createdAt
          }).then(function(){}, function(err){ console.warn('[sb app_evaluations insert err]', err); });
        } catch(sbErr) {
          console.warn('[sb app_evaluations error]', sbErr);
        }
      }

      L.btnSubmitEval.disabled = true;
      L.btnSubmitEval.textContent = '제출 중...';

      fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'app_evaluation',
          userId: L.state.profile.id,
          userName: (L.state.profile && (L.state.profile.displayName || L.state.profile.nickname || L.state.profile.name)) || '회원',
          evaluation: evalItem
        })
      })
      .then(function(res){ return res.json(); })
      .then(function(data){
        if(navigator.vibrate) try{ navigator.vibrate(12); }catch(e){}
        L.toast('소중한 평가가 접수되었습니다. 언제 얼마든지 다시 평가해주실 수 있습니다! ⭐'); // 소중한 평가가 접수되었습니다. 감사합니다! ⭐
        resetAppEvaluationForm();
        closeAppEvaluationModal();
      })
      .catch(function(err){
        console.warn('[AppEvaluation] 제출 통신 오류:', err);
        if(navigator.vibrate) try{ navigator.vibrate(12); }catch(e){}
        L.toast('소중한 평가가 안전하게 보관되었습니다. 언제 얼마든지 다시 평가해주실 수 있습니다! ⭐');
        resetAppEvaluationForm();
        closeAppEvaluationModal();
      })
      .finally(function(){
        L.btnSubmitEval.disabled = false;
        L.btnSubmitEval.textContent = '평가 제출하기';
      });
    });
  }
  } /* bindAppEvalSubmit */
  /* ---- 이전 전 index.html 14129~14133줄(#TASK-ES-466 생성기 표지) ---- */
  function bindHomeAddGoal() { /* [#TASK-ES-466] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  document.getElementById('homeAddGoal').addEventListener('click', function(e){
    if(L.isModalDismissCooldown()) return;
    L.promptNewGoal();
  });
  } /* bindHomeAddGoal */

  K.openAppEvaluationModal = openAppEvaluationModal;
  K.closeAppEvaluationModal = closeAppEvaluationModal;
  K.bindAppEvalBackdrop = bindAppEvalBackdrop;
  K.resetAppEvaluationForm = resetAppEvaluationForm;
  K.bindAppEvalSubmit = bindAppEvalSubmit;
  K.bindHomeAddGoal = bindHomeAddGoal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
