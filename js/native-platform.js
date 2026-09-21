/*
 * 아워골 — 네이티브 셸(Capacitor iOS/Android) 판별과 브라우저 전용 기능 게이트 (#TASK-ES-204, INFRA)
 *
 * 왜 필요한가: 아이폰 앱은 Capacitor 가 웹앱(ourgoal-app.vercel.app)을 WKWebView 로 감싼다.
 * WKWebView 에는 서비스워커·웹 알림(Notification)·PWA 설치가 없고, 이미 "앱 안"이다.
 * 그래서 사파리용 "홈 화면에 추가" 안내와 서비스워커 등록은 앱 안에서 꺼야 한다.
 *
 * 판별은 Capacitor 가 웹뷰에 주입하는 window.Capacitor 로만 한다 — 번들러·npm 패키지 없이 동작한다.
 * 값을 못 알아내면 "브라우저"로 본다(기존 동작 유지). 그래서 이 파일이 없거나 실패해도 웹은 그대로다.
 */
(function (global) {
  'use strict';

  function create(g) {
    function cap() {
      var c = g && g.Capacitor;
      return c && typeof c === 'object' ? c : null;
    }
    function isNative() {
      var c = cap();
      try { return !!(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()); } catch (e) { return false; }
    }
    function platform() {
      var c = cap();
      try { return (c && typeof c.getPlatform === 'function' && c.getPlatform()) || 'web'; } catch (e) { return 'web'; }
    }
    function has(name, obj) { try { return !!obj && (name in obj); } catch (e) { return false; } }
    var nav = g && g.navigator;
    return {
      isNative: isNative,
      platform: platform,
      isIosNative: function () { return isNative() && platform() === 'ios'; },
      // 사파리 "홈 화면에 추가" 안내·Android 설치 배너: 앱 안에서는 보이지 않는다
      canShowInstallPrompt: function () { return !isNative(); },
      // 서비스워커 등록: 네이티브 셸에서는 등록하지 않는다(WKWebView 미지원·앱 자체가 캐시 주체)
      canRegisterServiceWorker: function () { return !isNative() && has('serviceWorker', nav); },
      // 웹 푸시 구독(PushManager): 네이티브 셸의 푸시는 OneSignal(js/native-push.js) 경로로 분리
      canSubscribeWebPush: function () { return !isNative() && has('serviceWorker', nav) && has('PushManager', g); },
      // 브라우저 Notification API
      canUseWebNotification: function () { return !isNative() && has('Notification', g); }
    };
  }

  var api = create(global);
  global.OurgoalNative = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create };
})(typeof window !== 'undefined' ? window : this);
