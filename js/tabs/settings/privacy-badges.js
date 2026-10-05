/**
 * OurGoal Privacy Badges (설정 — 탭 머리 공개 범위 배지·공개 범위 고르기 창)
 *
 * 「최초 로그인 활용가이드」 묶음 중 공개 범위 책임: 공개 범위 글자(getPrivacyLabel — smoke-test FN_NAMES, 인라인 합본에서 찾는다)·목표/일정/기록 탭 머리 배지 그리기(updatePrivacyBadges — #goalsPrivacyBadge·#calPrivacyBadge·#recPrivacyBadge)·공개 범위 고르기 창(openPrivacyPickerModal).
 * #TASK-ES-523(인라인 3단계 Z4 이동 2차(활용가이드·공개 범위 배지·스톱워치 시간 글자)): index.html 인라인 IIFE 의 구간(이전 전 5000~5004 · 5005~5034 · 5035~5068줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 5000~5004줄(#TASK-ES-523 생성기 표지) ---- */
  function getPrivacyLabel(val){
    if(val === 'public') return '전체 공개';
    if(val === 'team') return '팀원';
    return '나만 보기';
  }
  /* ---- 이전 전 index.html 5005~5034줄(#TASK-ES-523 생성기 표지) ---- */
  function updatePrivacyBadges(){
    var s = (L.state.profile && L.state.profile.settings && L.state.profile.settings.privacy) || { goals:'private', calendar:'private', records:'private', stats:'private' };
    var gEl = document.getElementById('goalsPrivacyBadge');
    if(gEl){
      gEl.textContent = getPrivacyLabel(s.goals);
      gEl.onclick = async function(e){
        e.stopPropagation();
        var cur = s.goals || 'private';
        var next = (cur === 'private') ? 'team' : ((cur === 'team') ? 'public' : 'private');
        if(!L.state.profile.settings) L.state.profile.settings = {};
        if(!L.state.profile.settings.privacy) L.state.profile.settings.privacy = {};
        L.state.profile.settings.privacy.goals = next;
        s.goals = next;
        gEl.textContent = getPrivacyLabel(next);
        await L.saveProfile();
        var msg = (next === 'private') ? '🔒 나만 보기로 변경되었습니다' : ((next === 'team') ? '👥 팀원 공개로 변경되었습니다' : '🌐 전체 공개로 변경되었습니다');
        if(typeof L.toast === 'function') L.toast(msg);
      };
    }
    var cEl = document.getElementById('calPrivacyBadge');
    if(cEl){
      cEl.textContent = getPrivacyLabel(s.calendar);
      cEl.onclick = function(e){ e.stopPropagation(); openPrivacyPickerModal('calendar'); };
    }
    var rEl = document.getElementById('recPrivacyBadge');
    if(rEl){
      rEl.textContent = getPrivacyLabel(s.records);
      rEl.onclick = function(e){ e.stopPropagation(); openPrivacyPickerModal('records'); };
    }
  }
  /* ---- 이전 전 index.html 5035~5068줄(#TASK-ES-523 생성기 표지) ---- */
  function openPrivacyPickerModal(tabKey){
    var tabName = tabKey==='goals' ? '목표' : (tabKey==='calendar' ? '일정' : (tabKey==='records' ? '기록/통계' : '통계'));
    var s = L.state.profile.settings;
    if(!s.privacy) s.privacy = { goals:'private', calendar:'private', records:'private', stats:'private' };
    var cur = s.privacy[tabKey] || 'private';
    L.openModal(
      '<h3>' + tabName + ' 공개 범위 설정</h3>' +
      '<p class="faint" style="margin:-8px 0 16px;">다른 사용자 및 팀원에게 노출되는 범위를 선택하세요.</p>' +
      '<div class="ms-list">' +
        [['public','전체 공개','모든 사용자와 팀원이 볼 수 있습니다.'],
         ['team','팀원 공개','내가 가입한 팀/크루 팀원만 볼 수 있습니다.'],
         ['private','나만 보기 (비공개)','나 외에는 아무도 볼 수 없는 나만의 비밀 공간입니다.']].map(function(opt){
          var sel = opt[0] === cur;
          return '<div class="ms-row" data-privopt="'+opt[0]+'" style="cursor:pointer;padding:12px;background:'+(sel?'var(--card2)':'var(--card)')+';border:1px solid '+(sel?'var(--violet)':'var(--rule)')+';border-radius:12px;margin-bottom:8px;">' +
            '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">' + opt[1] + (sel ? ' <span style="color:var(--ink);font-size:.8125rem;">선택됨</span>' : '') + '</div>' +
            '<div class="faint" style="font-size:.8125rem;margin-top:2px;">' + opt[2] + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="privCloseBtn" type="button">닫기</button></div>',
      function(sheet){
        sheet.querySelector('#privCloseBtn').onclick = L.closeModal;
        sheet.querySelectorAll('[data-privopt]').forEach(function(row){
          row.onclick = async function(){
            s.privacy[tabKey] = row.dataset.privopt;
            await L.saveProfile();
            L.closeModal();
            updatePrivacyBadges();
            L.toast(tabName + ' 공개 범위를 ' + getPrivacyLabel(s.privacy[tabKey]) + '(으)로 변경했어요');
          };
        });
      }
    );
  }

  K.getPrivacyLabel = getPrivacyLabel;
  K.updatePrivacyBadges = updatePrivacyBadges;
  K.openPrivacyPickerModal = openPrivacyPickerModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
