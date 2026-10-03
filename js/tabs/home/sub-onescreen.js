/**
 * OurGoal Home One-Screen Sub-Block (HOME-01 홈 원스크린 콕핏)
 *
 * 375px 폰 첫 화면에 [상단 바(+ 새 목표)·인사] + [오늘 체크인 카드] + [3대 미니 나침반]만 남기고,
 * 동반자 레이스(#crewPacingWidget)와 오늘 목표 목록(.home-recent-title + #homePositionStrip + #homeGoalList)은
 * 지우지 않고 85vh 바텀시트(#homeDetailSheet) 안으로 노드째 옮긴다.
 * 노드와 ID 가 그대로 살아 있으므로 ID 로 찾는 기존 렌더러(renderHome, 동반자 집계, 홈 구성 숨김)가 그대로 동작한다.
 * 시트는 body 바로 아래에 둔다 — .screen 의 will-change:transform 이 position:fixed 의 기준 상자를 홈 영역으로 가두기 때문.
 * 닫기 4중: ✕ 버튼 · 배경 터치 · 손잡이 아래로 쓸기 · 기기 뒤로가기(+ Esc).
 */
(function(global) {
  'use strict';

  var doc = typeof document !== 'undefined' ? document : null;
  var SHEET_STATE_KEY = 'ourgoal_home_sheet';

  function haptic() {
    if (typeof global.triggerHaptic === 'function') global.triggerHaptic(12);
  }

  var OurgoalHomeOneScreen = {
    id: 'onescreen',
    containerId: 'homeCompassRow',
    _built: false,
    _openPanel: null,
    _historyPushed: false,

    panels: {
      quest: { title: '🎯 오늘 목표', panelId: 'homeSheetPanelQuest' },
      crew: { title: '🏃 동반자', panelId: 'homeSheetPanelCrew' }
    },

    /** 홈 마운트 때마다 호출돼도 한 번만 조립한다 */
    mount: function() {
      if (!doc) return;
      if (!this._built) this.build();
      this.refreshCounts();
    },

    build: function() {
      var home = doc.getElementById('screen-home');
      var checkin = doc.getElementById('captureCardBox');
      var crew = doc.getElementById('crewPacingWidget');
      var goalTitle = home ? home.querySelector('.home-recent-title') : null;
      var goalList = doc.getElementById('homeGoalList');
      if (!home || !checkin || !crew || !goalList) return;

      // 1. 3대 미니 나침반 — 체크인 카드 바로 아래
      var row = doc.createElement('div');
      row.id = 'homeCompassRow';
      row.className = 'home-compass-row';
      row.setAttribute('role', 'navigation');
      row.setAttribute('aria-label', '오늘의 나침반');
      row.innerHTML =
        '<button type="button" class="home-compass-btn" id="homeCompassQuest" data-sheet="quest" aria-haspopup="dialog">' +
          '<span class="home-compass-ico" aria-hidden="true">🎯</span>' +
          '<span class="home-compass-label">오늘 목표</span>' +
          '<span class="home-compass-sub" id="homeCompassQuestSub">목록 보기</span>' +
        '</button>' +
        '<button type="button" class="home-compass-btn" id="homeCompassCrew" data-sheet="crew" aria-haspopup="dialog">' +
          '<span class="home-compass-ico" aria-hidden="true">🏃</span>' +
          '<span class="home-compass-label">동반자</span>' +
          '<span class="home-compass-sub" id="homeCompassCrewSub">페이스 보기</span>' +
        '</button>' +
        '<button type="button" class="home-compass-btn" id="homeCompassReflect" data-tab-go="records">' +
          '<span class="home-compass-ico" aria-hidden="true">🌿</span>' +
          '<span class="home-compass-label">회고</span>' +
          '<span class="home-compass-sub">기록 돌아보기</span>' +
        '</button>';
      checkin.parentNode.insertBefore(row, checkin.nextSibling);

      // 2. 85vh 바텀시트 — body 에 두고, 홈 탭을 떠나면 wire() 의 관찰자가 닫는다
      var sheet = doc.createElement('div');
      sheet.id = 'homeDetailSheet';
      sheet.className = 'home-detail-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      sheet.innerHTML =
        '<div class="home-detail-backdrop" id="homeDetailBackdrop"></div>' +
        '<div class="home-detail-panel" id="homeDetailPanel" role="dialog" aria-modal="true" aria-labelledby="homeDetailTitle">' +
          '<div class="home-detail-handle" id="homeDetailHandle" aria-hidden="true"><span></span></div>' +
          '<div class="home-detail-head">' +
            '<h3 id="homeDetailTitle"></h3>' +
            '<button type="button" class="modal-sheet-close touch-target-44" id="homeDetailClose" aria-label="닫기" title="닫기">✕</button>' +
          '</div>' +
          '<p class="home-detail-hint">언제든 쓱 내리거나 바깥을 누르면 원래 홈으로 돌아와요 🌿</p>' +
          '<div class="home-detail-body" id="homeDetailBody">' +
            '<div class="home-sheet-panel" id="homeSheetPanelQuest" hidden></div>' +
            '<div class="home-sheet-panel" id="homeSheetPanelCrew" hidden></div>' +
            '<p class="home-sheet-empty faint" id="homeSheetEmpty" hidden>홈 구성에서 숨겨 둔 항목이에요. 설정 › 나만의 홈 구성에서 다시 켤 수 있어요.</p>' +
          '</div>' +
        '</div>';
      doc.body.appendChild(sheet);

      // 3. "새 목표"(#homeAddGoal)는 첫 화면 상단 바에 남긴다 — 목표 만들기는 시트를 열지 않고 바로 닿아야 한다
      var addGoal = doc.getElementById('homeAddGoal');
      var topRight = home.querySelector('.sanctuary-top-right');
      if (addGoal && topRight) {
        addGoal.classList.add('home-topbar-add');
        topRight.insertBefore(addGoal, topRight.firstChild);
      }

      // 4. 기존 노드를 지우지 않고 옮긴다(순서 유지: 미션 카드 -> 목표 타이틀 -> 칩 스트립 -> 목표 목록 -> 평가 배너)
      var questPanel = doc.getElementById('homeSheetPanelQuest');
      var missionCard = doc.getElementById('todayMissionCard');
      if (missionCard) questPanel.appendChild(missionCard);
      if (goalTitle) questPanel.appendChild(goalTitle);
      var strip = doc.getElementById('homePositionStrip');
      if (strip) questPanel.appendChild(strip);
      questPanel.appendChild(goalList);
      var evalBanner = doc.getElementById('homeEvalBanner');
      if (evalBanner) questPanel.appendChild(evalBanner);
      doc.getElementById('homeSheetPanelCrew').appendChild(crew);

      this.wire(row, sheet);
      this._built = true;
      home.classList.add('home-onescreen');
    },

    wire: function(row, sheet) {
      var self = this;

      row.addEventListener('click', function(e) {
        var btn = e.target.closest ? e.target.closest('.home-compass-btn') : null;
        if (!btn) return;
        haptic();
        if (btn.dataset.sheet) {
          self.open(btn.dataset.sheet);
        } else if (btn.dataset.tabGo && typeof global.setTab === 'function') {
          global.setTab(btn.dataset.tabGo);
        }
      });

      doc.getElementById('homeDetailClose').addEventListener('click', function() { haptic(); self.close(); });
      doc.getElementById('homeDetailBackdrop').addEventListener('click', function() { haptic(); self.close(); });

      // 시트 안 버튼이 체크인 입력으로 보내거나 다른 탭으로 보내면 시트를 먼저 닫는다
      doc.getElementById('homeDetailBody').addEventListener('click', function(e) {
        var t = e.target.closest ? e.target.closest('#btnCrewStartCheckin') : null;
        if (t) self.close();
      }, true);

      // 손잡이·머리 영역 아래로 쓸기(80px 이상) → 닫기
      var panel = doc.getElementById('homeDetailPanel');
      var startY = null;
      var dragZone = function(target) {
        return target.closest && (target.closest('#homeDetailHandle') || target.closest('.home-detail-head'));
      };
      panel.addEventListener('touchstart', function(e) {
        if (!dragZone(e.target)) { startY = null; return; }
        startY = e.touches[0].clientY;
        panel.style.transition = 'none';
      }, { passive: true });
      panel.addEventListener('touchmove', function(e) {
        if (startY === null) return;
        var dy = Math.max(0, e.touches[0].clientY - startY);
        panel.style.transform = 'translateY(' + dy + 'px)';
      }, { passive: true });
      panel.addEventListener('touchend', function(e) {
        if (startY === null) return;
        var dy = e.changedTouches[0].clientY - startY;
        startY = null;
        panel.style.transition = '';
        panel.style.transform = '';
        if (dy > 80) { haptic(); self.close(); }
      });

      doc.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && self._openPanel) self.close();
      });

      // 기기 뒤로가기: 시트가 넣은 기록이 빠질 때만 닫는다(그 위에 열린 모달의 뒤로가기는 모달 몫)
      global.addEventListener('popstate', function(e) {
        if (!self._openPanel) return;
        if (e.state && e.state[SHEET_STATE_KEY]) return;
        self._historyPushed = false;
        self.close(true);
      });

      // 홈 탭을 떠나면 닫는다
      var home = doc.getElementById('screen-home');
      if (typeof MutationObserver !== 'undefined') {
        new MutationObserver(function() {
          if (self._openPanel && !home.classList.contains('active')) self.close();
        }).observe(home, { attributes: true, attributeFilter: ['class'] });

        var list = doc.getElementById('homeGoalList');
        new MutationObserver(function() { self.refreshCounts(); }).observe(list, { childList: true });
      }
    },

    /** 나침반 보조 문구: 실제 목표 카드 수를 센다(없으면 안내 문구) */
    refreshCounts: function() {
      if (!doc) return;
      var sub = doc.getElementById('homeCompassQuestSub');
      var list = doc.getElementById('homeGoalList');
      if (!sub || !list) return;
      var n = list.querySelectorAll('.goal-card').length;
      sub.textContent = n > 0 ? n + '개 진행 중' : '목표 세우기';
    },

    open: function(key) {
      var cfg = this.panels[key];
      if (!cfg || !doc) return;
      var sheet = doc.getElementById('homeDetailSheet');
      var keys = Object.keys(this.panels);
      for (var i = 0; i < keys.length; i++) {
        doc.getElementById(this.panels[keys[i]].panelId).hidden = keys[i] !== key;
      }
      var panelEl = doc.getElementById(cfg.panelId);
      doc.getElementById('homeDetailTitle').textContent = cfg.title;
      sheet.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      doc.getElementById('homeSheetEmpty').hidden = panelEl.getBoundingClientRect().height > 1;
      doc.getElementById('homeDetailBody').scrollTop = 0;
      this._openPanel = key;
      try {
        if (!this._historyPushed && global.history && history.pushState) {
          var st = {};
          st[SHEET_STATE_KEY] = key;
          history.pushState(st, '');
          this._historyPushed = true;
        }
      } catch (e) {}
      var closeBtn = doc.getElementById('homeDetailClose');
      if (closeBtn && closeBtn.focus) closeBtn.focus({ preventScroll: true });
    },

    close: function(fromPopstate) {
      if (!doc || !this._openPanel) return;
      var sheet = doc.getElementById('homeDetailSheet');
      var opener = doc.querySelector('.home-compass-btn[data-sheet="' + this._openPanel + '"]');
      sheet.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      this._openPanel = null;
      if (this._historyPushed && !fromPopstate) {
        this._historyPushed = false;
        try { history.back(); } catch (e) {}
      }
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OurgoalHomeOneScreen;
  }
  global.OurgoalHomeOneScreen = OurgoalHomeOneScreen;

  // 첫 진입은 탭 전환 없이 홈이 바로 보이므로 레지스트리 마운트를 기다리지 않고 한 번 조립한다(mount 는 중복 호출 안전)
  if (doc) {
    var boot = function() { OurgoalHomeOneScreen.mount(); };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : this);
