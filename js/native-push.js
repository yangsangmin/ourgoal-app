/*
 * 아워골 — 네이티브 셸 푸시 스켈레톤 (OneSignal, #TASK-ES-204, INFRA)
 *
 * 상태: 스켈레톤(미검증). 실기기에서 수신을 확인하기 전까지 "동작한다"고 부르지 않는다(로드맵 T064).
 * - 브라우저(웹)에서는 아무것도 하지 않는다. 웹 푸시는 기존 VAPID 경로(index.html syncPushSubscription)가 담당한다.
 * - 네이티브 셸 + OneSignal Cordova 플러그인(window.plugins.OneSignal)이 있을 때만 초기화한다.
 * - App ID 는 비밀이 아니지만 코드에 박지 않는다: OURGOAL_CONFIG.ONESIGNAL_APP_ID 로만 받는다(없으면 null → 아무것도 안 함).
 * - 플러그인 설치(onesignal-cordova-plugin)는 맥에서 `npx cap sync ios` 와 함께 한다 — 여기서 설치하지 않은 이유는
 *   iOS 쪽 네이티브 의존성을 이 PC 에서 검증할 수 없기 때문이다(docs/specs/PLAN-ios-capacitor-shell.md).
 */
(function (global) {
  'use strict';

  function create(g) {
    var state = { started: false, reason: null };

    function appId() {
      var cfg = g && g.OURGOAL_CONFIG;
      var id = cfg && cfg.ONESIGNAL_APP_ID;
      return typeof id === 'string' && id.length > 0 ? id : null;
    }
    function oneSignal() {
      var p = g && g.plugins && g.plugins.OneSignal;
      return p && typeof p.initialize === 'function' ? p : null;
    }

    /** @returns {{started:boolean, reason:(string|null)}} 시작하지 않은 이유를 null 이 아니게 남긴다 */
    function init() {
      if (state.started) return state;
      if (!g.OurgoalNative || !g.OurgoalNative.isNative()) { state.reason = 'not-native'; return state; }
      var id = appId();
      if (!id) { state.reason = 'no-app-id'; return state; }
      var os = oneSignal();
      if (!os) { state.reason = 'plugin-missing'; return state; }
      try {
        os.initialize(id);
        state.started = true;
        state.reason = null;
      } catch (e) {
        state.reason = 'init-failed';
      }
      return state;
    }

    /** 사용자가 알림 켜기를 눌렀을 때만 부른다(자동 권한 요청 금지). 미시작이면 false. */
    function requestPermission() {
      var os = oneSignal();
      if (!state.started || !os || !os.Notifications || typeof os.Notifications.requestPermission !== 'function') {
        return Promise.resolve(false);
      }
      return Promise.resolve(os.Notifications.requestPermission(true)).then(function (r) { return !!r; }, function () { return false; });
    }

    return { init: init, requestPermission: requestPermission, status: function () { return state; } };
  }

  var api = create(global);
  global.OurgoalNativePush = api;
  // 웹·앱 어디서든 안전: 브라우저면 not-native, App ID/플러그인이 없으면 아무 일도 하지 않는다
  if (global.addEventListener) {
    global.addEventListener('load', function () { api.init(); });
    if (global.document && global.document.addEventListener) global.document.addEventListener('deviceready', function () { api.init(); });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create };
})(typeof window !== 'undefined' ? window : this);
