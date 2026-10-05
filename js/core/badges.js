/**
 * OurGoal Badges (기관 — 뱃지 컬렉션·명예의 전당)
 *
 * 뱃지 판정 문맥(badgeContext) · 뱃지 목록(BADGES) · 명예의 전당 창(openHallOfFame).
 * 같은 묶음의 완료 마일스톤 합(totalCompletedMilestones)은 smoke 시험지 FN_NAMES 라 남겼다. 같은 묶음의 프로필 불러오기 쪽(defaultProfile·resolveUniqueDisplayName·formatDisplayNameWithTag·ensureUserRow·loadProfile)과 앱 상태(state)는 로그인 뒤에만 도는 경로라 게스트 화면 시나리오로 잴 수 없어 이번에 옮기지 않았다.
 * #TASK-ES-482(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 3475~3483 · 3484~3495 · 3496~3515줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 3475~3483줄(#TASK-ES-482 생성기 표지) ---- */
  function badgeContext(p){
    return {
      records: p.records.length,
      streak: L.computeStreakDays(),
      msDone: L.totalCompletedMilestones(p),
      level: L.levelForXP((p.settings.xp && p.settings.xp.total) || 0),
      archived: p.goals.filter(function(g){ return !!g.archivedAt; }).length
    };
  }
  /* ---- 이전 전 index.html 3484~3495줄(#TASK-ES-482 생성기 표지) ---- */
  var BADGES = [
    { id:'first_record', icon:'✍️', label:'첫 발걸음', desc:'기록을 1개 이상 남기면', check:function(ctx){ return ctx.records>=1; } },
    { id:'streak_3', icon:'🔥', label:'3일 연속', desc:'3일 연속으로 기록하면', check:function(ctx){ return ctx.streak>=3; } },
    { id:'streak_7', icon:'🔥🔥', label:'7일 연속', desc:'7일 연속으로 기록하면', check:function(ctx){ return ctx.streak>=7; } },
    { id:'streak_30', icon:'🔥🔥🔥', label:'30일 연속', desc:'30일 연속으로 기록하면', check:function(ctx){ return ctx.streak>=30; } },
    { id:'record_50', icon:'📚', label:'기록 마스터', desc:'기록을 50개 이상 남기면', check:function(ctx){ return ctx.records>=50; } },
    { id:'ms_5', icon:'🎯', label:'마일스톤 헌터', desc:'마일스톤을 5개 이상 완료하면', check:function(ctx){ return ctx.msDone>=5; } },
    { id:'ms_20', icon:'🏹', label:'마일스톤 정복자', desc:'마일스톤을 20개 이상 완료하면', check:function(ctx){ return ctx.msDone>=20; } },
    { id:'level_5', icon:'⭐', label:'레벨 5', desc:'레벨 5를 달성하면', check:function(ctx){ return ctx.level>=5; } },
    { id:'level_10', icon:'🌟', label:'레벨 10', desc:'레벨 10을 달성하면', check:function(ctx){ return ctx.level>=10; } },
    { id:'first_finish', icon:'🏆', label:'첫 완주', desc:'목표를 1개 이상 완주(보관)하면', check:function(ctx){ return ctx.archived>=1; } }
  ];
  /* ---- 이전 전 index.html 3496~3515줄(#TASK-ES-482 생성기 표지) ---- */
  function openHallOfFame(){
    var ctx = badgeContext(L.state.profile);
    var unlocked = BADGES.filter(function(b){ return b.check(ctx); });
    L.openModal(
      '<h3>명예의 전당</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;">'+unlocked.length+' / '+BADGES.length+'개 획득</p>' +
      '<div class="badge-grid">' +
        BADGES.map(function(b){
          var on = b.check(ctx);
          return '<div class="badge-tile'+(on?' on':'')+'">' +
            '<div class="badge-icon">'+(on?b.icon:'🔒')+'</div>' +
            '<div class="badge-label">'+L.escapeHtml(b.label)+'</div>' +
            '<div class="badge-desc">'+L.escapeHtml(b.desc)+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-primary" id="hofClose" type="button">닫기</button></div>',
      function(sheet){ sheet.querySelector('#hofClose').addEventListener('click', L.closeModal); }
    );
  }

  K.badgeContext = badgeContext;
  K.BADGES = BADGES;
  K.openHallOfFame = openHallOfFame;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
