/* 아워골 최소 서비스워커: 홈 화면 설치 지원 + 오프라인 시 빈 화면 대신 안내 문구 노출 */
'use strict';
var CACHE_NAME = 'ourgoal-shell-v1';
var APP_SHELL = ['/'];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); }).catch(function(){})
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

var OFFLINE_HTML = '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
  '<title>아워골 - 오프라인</title><style>' +
  'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
  'background:#F4F5FB;color:#14162B;font-family:"Noto Sans KR",-apple-system,system-ui,sans-serif;' +
  'text-align:center;padding:24px;}' +
  '.box{max-width:320px;}.emoji{font-size:2.4rem;margin-bottom:12px;}' +
  'h1{font-size:1.05rem;margin:0 0 8px;}' +
  'p{font-size:.86rem;color:#5D6180;line-height:1.6;margin:0;}' +
  'button{margin-top:18px;border:none;border-radius:14px;padding:11px 20px;font-size:.86rem;' +
  'font-weight:700;color:#fff;background:linear-gradient(135deg,#FF4F64,#FF9F1C);cursor:pointer;}' +
  '</style></head><body><div class="box"><div class="emoji">📡</div>' +
  '<h1>인터넷 연결이 필요해요</h1>' +
  '<p>아워골은 온라인 상태에서만 이용할 수 있어요.<br>연결을 확인한 뒤 다시 시도해주세요.</p>' +
  '<button onclick="location.reload()">다시 시도</button></div></body></html>';

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.mode !== 'navigate') return;
  event.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        return cached || caches.match('/');
      }).then(function(cached){
        return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
      });
    })
  );
});
