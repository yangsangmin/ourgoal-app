/* ============================================================
 * 아워골(OurGoal) — 전역 알림 통합 엔진 (OurgoalNotifyEngine)
 * [#TASK-ES-152] 백그라운드·앱종료·미확인 전역 알림(DM 포함) 및 세부 제어 센터
 * ============================================================ */
(function(global){
  'use strict';

  var _audioCtx = null;

  function getAudioContext(){
    if(typeof window === 'undefined') return null;
    if(!_audioCtx && (window.AudioContext || window.webkitAudioContext)){
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      _audioCtx = new AudioCtx();
    }
    if(_audioCtx && _audioCtx.state === 'suspended'){
      _audioCtx.resume().catch(function(){});
    }
    return _audioCtx;
  }

  function unlockAudioContext(){
    var ctx = getAudioContext();
    if(ctx && ctx.state === 'suspended'){
      ctx.resume().catch(function(){});
    }
  }
  if(typeof window !== 'undefined'){
    ['click', 'touchstart', 'keydown'].forEach(function(evt){
      window.addEventListener(evt, unlockAudioContext, { once: true, passive: true });
    });
  }

  function playNotificationSound(){
    try {
      var ctx = getAudioContext();
      if(!ctx) return;
      var now = ctx.currentTime;
      var osc1 = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);

      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.15);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.38);
    } catch(e){}
  }

  function vibrate(pattern){
    try {
      if(typeof navigator !== 'undefined' && navigator.vibrate){
        navigator.vibrate(pattern || [100, 50, 100]);
      }
    } catch(e){}
  }

  function getNotifConfig(){
    var state = global.state || {};
    var settings = (state.profile && state.profile.settings) || {};
    if(!settings.notifications){
      settings.notifications = {
        feedbackMode: 'all',
        privacyLevel: 'detail',
        dmMessages: true,
        teamActivities: true,
        goalReminders: true,
        bgEnabled: true
      };
    }
    return settings.notifications;
  }

  function showFloatingBanner(opts){
    if(typeof document === 'undefined') return;
    var banner = document.getElementById('globalNotifyBanner');
    if(!banner){
      banner = document.createElement('div');
      banner.id = 'globalNotifyBanner';
      banner.className = 'notify-floating-banner';
      document.body.appendChild(banner);
    }

    var icon = opts.icon || (opts.type === 'dm' ? '💬' : (opts.type === 'team' ? '👥' : (opts.type === 'goal' ? '🎯' : '🔔')));
    var title = opts.title || '아워골 알림';
    var body = opts.body || '';

    banner.innerHTML =
      '<div class="notify-banner-icon">' + icon + '</div>' +
      '<div class="notify-banner-content">' +
        '<div class="notify-banner-title">' +
          '<span>' + escHtml(title) + '</span>' +
          '<button type="button" class="notify-banner-close" aria-label="닫기">×</button>' +
        '</div>' +
        '<div class="notify-banner-body">' + escHtml(body) + '</div>' +
      '</div>';

    var closeBtn = banner.querySelector('.notify-banner-close');
    if(closeBtn){
      closeBtn.onclick = function(e){
        e.stopPropagation();
        banner.classList.remove('visible');
      };
    }

    banner.onclick = function(){
      banner.classList.remove('visible');
      var state = global.state || {};
      if(opts.targetTab && typeof global.switchTab === 'function'){
        global.switchTab(opts.targetTab);
      }
      if(opts.type === 'dm' && opts.targetDmId && global.OurgoalComm){
        state.commSubTab = 'dm';
        state.dmActiveId = opts.targetDmId;
        if(typeof global.renderCommScreen === 'function') global.renderCommScreen();
      }
    };

    banner.classList.remove('visible');
    void banner.offsetWidth;
    banner.classList.add('visible');

    if(banner._timer) clearTimeout(banner._timer);
    banner._timer = setTimeout(function(){
      banner.classList.remove('visible');
    }, 4500);
  }

  function dispatchGlobalNotification(opts){
    opts = opts || {};
    var config = getNotifConfig();

    if(opts.type === 'dm' && config.dmMessages === false) return false;
    if(opts.type === 'team' && config.teamActivities === false) return false;
    if(opts.type === 'goal' && config.goalReminders === false) return false;

    var displayTitle = opts.title || '아워골 알림';
    var displayBody = opts.body || '';
    if(config.privacyLevel === 'summary'){
      if(opts.type === 'dm'){
        displayBody = (opts.senderName ? opts.senderName + '님의 ' : '') + '새로운 1:1 메시지가 도착했습니다.';
      } else if(opts.type === 'team'){
        displayBody = '새로운 팀 목표 소식이 도착했습니다.';
      } else {
        displayBody = '새로운 알림이 도착했습니다.';
      }
    }

    var state = global.state || {};
    var settings = (state.profile && state.profile.settings) || {};
    if(!settings.unreadNotifications) settings.unreadNotifications = [];
    settings.unreadNotifications.push({
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: opts.type || 'system',
      title: displayTitle,
      body: displayBody,
      targetTab: opts.targetTab || 'home',
      targetDmId: opts.targetDmId || null,
      createdAt: new Date().toISOString(),
      read: false
    });
    if(settings.unreadNotifications.length > 50){
      settings.unreadNotifications = settings.unreadNotifications.slice(-50);
    }
    if(state.profile && state.profile.id && typeof global.saveLocalSettings === 'function'){
      global.saveLocalSettings(state.profile.id, settings);
    }

    var mode = config.feedbackMode || 'all';
    if(mode === 'all' || mode === 'sound'){
      playNotificationSound();
    }
    if(mode === 'all' || mode === 'vibrate'){
      vibrate([100, 50, 100]);
    }

    showFloatingBanner({
      type: opts.type,
      title: displayTitle,
      body: displayBody,
      icon: opts.icon,
      targetTab: opts.targetTab,
      targetDmId: opts.targetDmId
    });

    // 상단바 알림 배지 실시간 동기화 호출
    if(typeof global.updateTopNotifBadge === 'function'){
      try { global.updateTopNotifBadge(); } catch(e){}
    }

    var isBackground = (typeof document !== 'undefined') && document.hidden;
    if(isBackground && config.bgEnabled !== false && typeof window !== 'undefined'){
      var notifOpts = {
        body: displayBody,
        icon: opts.iconUrl || '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: 'ourgoal-' + (opts.type || 'general'),
        data: {
          targetTab: opts.targetTab || 'home',
          targetDmId: opts.targetDmId || null
        }
      };
      // [#TASK-ES-168] 모바일(Chrome Android, PWA) 대응: ServiceWorker showNotification 우선 호출
      if('serviceWorker' in navigator && navigator.serviceWorker.ready){
        navigator.serviceWorker.ready.then(function(reg){
          if(reg && typeof reg.showNotification === 'function'){
            reg.showNotification(displayTitle, notifOpts).catch(function(){});
          }
        }).catch(function(){});
      } else if('Notification' in window && Notification.permission === 'granted'){
        try {
          var n = new Notification(displayTitle, notifOpts);
          n.onclick = function(){
            window.focus();
            if(opts.targetTab && typeof global.switchTab === 'function'){
              global.switchTab(opts.targetTab);
            }
            if(opts.type === 'dm' && opts.targetDmId && global.OurgoalComm){
              state.commSubTab = 'dm';
              state.dmActiveId = opts.targetDmId;
              if(typeof global.renderCommScreen === 'function') global.renderCommScreen();
            }
            n.close();
          };
        } catch(e){}
      }
    }

    return true;
  }

  async function requestPermission(){
    if(typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      var perm = await Notification.requestPermission();
      return perm;
    } catch(e){
      return 'denied';
    }
  }

  function getPermissionStatus(){
    if(typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  function getUnreadNotifications(){
    var state = global.state || {};
    var settings = (state.profile && state.profile.settings) || {};
    return settings.unreadNotifications || [];
  }

  function getUnreadCount(){
    var list = getUnreadNotifications();
    var count = 0;
    for(var i = 0; i < list.length; i++){
      if(!list[i].read) count++;
    }
    return count;
  }

  function markAllAsRead(){
    var state = global.state || {};
    var settings = (state.profile && state.profile.settings) || {};
    var list = settings.unreadNotifications || [];
    for(var i = 0; i < list.length; i++){
      list[i].read = true;
    }
    if(state.profile && state.profile.id && typeof global.saveLocalSettings === 'function'){
      global.saveLocalSettings(state.profile.id, settings);
    }
    if(typeof global.saveProfile === 'function'){
      global.saveProfile().catch(function(){});
    }
    if(typeof global.updateTopNotifBadge === 'function'){
      try { global.updateTopNotifBadge(); } catch(e){}
    }
    return true;
  }

  function escHtml(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var Engine = {
    init: function(){ getAudioContext(); },
    playNotificationSound: playNotificationSound,
    vibrate: vibrate,
    getNotifConfig: getNotifConfig,
    showFloatingBanner: showFloatingBanner,
    dispatchGlobalNotification: dispatchGlobalNotification,
    requestPermission: requestPermission,
    getPermissionStatus: getPermissionStatus,
    getUnreadNotifications: getUnreadNotifications,
    getUnreadCount: getUnreadCount,
    markAllAsRead: markAllAsRead
  };

  global.OurgoalNotifyEngine = Engine;

  if(typeof module !== 'undefined' && module.exports){
    module.exports = Engine;
  }
})(typeof window !== 'undefined' ? window : global);
