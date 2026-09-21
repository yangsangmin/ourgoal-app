// 네이티브 셸 게이트(js/native-platform.js)·푸시 스켈레톤(js/native-push.js) 단위 검증 — #TASK-ES-204
// 브라우저·기기 없이 가짜 window 로 판별 로직만 잰다. 실기기 동작은 이 검사가 보증하지 않는다.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const platformMod = require(path.join(root, 'js', 'native-platform.js'));
const pushMod = require(path.join(root, 'js', 'native-push.js'));

console.log('📱 [네이티브 셸 게이트 검증]');

function fakeWin({ native, plat, sw = true, pm = true, notif = true, plugin = false, appId } = {}) {
  const g = { navigator: {} };
  if (sw) g.navigator.serviceWorker = {};
  if (pm) g.PushManager = function () {};
  if (notif) g.Notification = function () {};
  if (native !== undefined) g.Capacitor = { isNativePlatform: () => native, getPlatform: () => plat || 'web' };
  if (appId) g.OURGOAL_CONFIG = { ONESIGNAL_APP_ID: appId };
  if (plugin) g.plugins = { OneSignal: { initialize: (id) => { g._initId = id; }, Notifications: { requestPermission: () => Promise.resolve(true) } } };
  return g;
}

// 1. 브라우저(Capacitor 없음): 기존 웹 동작이 그대로 살아 있어야 한다
let n = platformMod.create(fakeWin());
assert.strictEqual(n.isNative(), false, '브라우저는 네이티브가 아니다');
assert.strictEqual(n.platform(), 'web');
assert.strictEqual(n.canShowInstallPrompt(), true, '브라우저는 설치 안내 허용');
assert.strictEqual(n.canRegisterServiceWorker(), true, '브라우저는 서비스워커 등록 허용');
assert.strictEqual(n.canSubscribeWebPush(), true, '브라우저는 웹 푸시 허용');
assert.strictEqual(n.canUseWebNotification(), true);

// 2. 브라우저에서 Capacitor 객체가 있어도 isNativePlatform()=false 면 브라우저
n = platformMod.create(fakeWin({ native: false, plat: 'web' }));
assert.strictEqual(n.isNative(), false);
assert.strictEqual(n.canRegisterServiceWorker(), true);

// 3. iOS 네이티브 셸: 브라우저 전용 기능 전부 꺼진다
n = platformMod.create(fakeWin({ native: true, plat: 'ios' }));
assert.strictEqual(n.isNative(), true);
assert.strictEqual(n.isIosNative(), true);
assert.strictEqual(n.canShowInstallPrompt(), false, '앱 안에서는 "홈 화면에 추가" 안내 금지');
assert.strictEqual(n.canRegisterServiceWorker(), false);
assert.strictEqual(n.canSubscribeWebPush(), false);
assert.strictEqual(n.canUseWebNotification(), false);

// 4. 웹뷰 기능이 원래 없을 때도 던지지 않는다
n = platformMod.create({});
assert.strictEqual(n.isNative(), false);
assert.strictEqual(n.canRegisterServiceWorker(), false, 'navigator 가 없으면 등록 불가(예외 없이)');
n = platformMod.create({ Capacitor: { isNativePlatform() { throw new Error('boom'); } } });
assert.strictEqual(n.isNative(), false, '판별이 던져도 브라우저로 본다(기존 동작 유지)');

// 5. 푸시 스켈레톤: 못 시작하는 이유를 null 이 아닌 값으로 남긴다
let g = fakeWin();
g.OurgoalNative = platformMod.create(g);
let p = pushMod.create(g);
assert.strictEqual(p.init().started, false);
assert.strictEqual(p.status().reason, 'not-native', '브라우저에서는 시작하지 않는다');

g = fakeWin({ native: true, plat: 'ios' });
g.OurgoalNative = platformMod.create(g);
p = pushMod.create(g);
assert.strictEqual(p.init().reason, 'no-app-id', 'App ID 없으면 시작하지 않는다(코드에 박지 않는다)');

g = fakeWin({ native: true, plat: 'ios', appId: 'test-app-id' });
g.OurgoalNative = platformMod.create(g);
p = pushMod.create(g);
assert.strictEqual(p.init().reason, 'plugin-missing', '플러그인 없으면 시작하지 않는다');

g = fakeWin({ native: true, plat: 'ios', appId: 'test-app-id', plugin: true });
g.OurgoalNative = platformMod.create(g);
p = pushMod.create(g);
assert.strictEqual(p.init().started, true);
assert.strictEqual(g._initId, 'test-app-id');

// 6. 배선: index.html 이 두 모듈을 로드하고 게이트 3곳을 쓴다
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('src="js/native-platform.js'), 'index.html 이 native-platform.js 를 로드한다');
assert.ok(html.includes('src="js/native-push.js'), 'index.html 이 native-push.js 를 로드한다');
assert.ok(html.indexOf('<script src="js/native-platform.js') < html.indexOf('<script src="js/credits.js'), 'native-platform 은 다른 스크립트보다 먼저 로드된다');
assert.ok(/serviceWorker' in navigator && !\(window\.OurgoalNative && window\.OurgoalNative\.isNative\(\)\)/.test(html), '서비스워커 등록이 네이티브에서 게이트된다');
assert.ok(html.includes('dismissed || inNativeShell'), 'iOS 홈 화면 추가 배너가 네이티브에서 게이트된다');
assert.ok(html.includes('네이티브 셸 푸시는 OneSignal 경로'), '웹 푸시 구독이 네이티브에서 게이트된다');

// 7. Capacitor 설정: iOS 프로젝트가 같은 앱 ID 를 쓴다(안드로이드와 동일)
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
const pbx = fs.readFileSync(path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj'), 'utf8');
assert.ok(pbx.includes('PRODUCT_BUNDLE_IDENTIFIER = ' + cfg.appId + ';'), 'iOS 번들 ID 가 capacitor.config.json appId 와 같다');

console.log('  ✓ 네이티브 게이트·푸시 스켈레톤 검증 통과');
