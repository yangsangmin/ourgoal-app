'use strict';
// 법정(court) — 실행마다 바뀌는 법정 호스트 이름.
// 앱을 127.0.0.1·localhost 로 열면 개발용 지름길로 빠지므로, 법정은 전용 호스트 이름을 127.0.0.1 에 매핑해서 연다(lib/chrome.js).
// 그 이름이 고정 상수면 제품 코드가 그 이름을 알아보고 법정 안에서만 다르게 동작할 수 있다. 그래서 실행마다 무작위로 고른다.
//  - 한 번의 judge 실행에서 기준 커밋과 작업 커밋은 같은 호스트를 쓴다(호스트 차이가 두 커밋의 결과 차이로 읽히면 안 된다).
//  - 호스트는 판정번호 계산에 넣지 않는다(판정번호는 같은 입력이면 같은 값이어야 한다). verdict.json 에는 증거 칸(tool.siteHost)에만 남긴다.
//  - 설정 파일의 고정 이름(config.json siteHost)은 더 쓰지 않는다. 고정 이름이 곧 지문이기 때문이다.
const crypto = require('node:crypto');

const HOST_PREFIX = 'court-';
const HOST_SUFFIX = '.test'; // 시험 전용 최상위 이름(RFC 6761) — 실제 인터넷 주소와 겹치지 않는다
const HOST_RE = /^court-[0-9a-f]{8}\.test$/;

function pickSiteHost(cfg) {
  void cfg; // 자리만 받아 둔다(호출하는 쪽의 모양을 고정하기 위해). 설정으로 호스트를 고정하는 길은 일부러 두지 않았다.
  return HOST_PREFIX + crypto.randomBytes(4).toString('hex') + HOST_SUFFIX;
}

function isCourtHost(host) { return typeof host === 'string' && HOST_RE.test(host); }

// 법정 서버(포트)와 호스트로 앱 주소를 만든다.
function siteUrlFor(host, port) { return 'http://' + host + ':' + port; }

// 넘겨받은 앱 주소에서 호스트를 얻는다. 탐침·실행기는 설정(cfg.siteHost)을 직접 읽지 말고 이것을 쓴다.
function hostOf(siteUrl) { try { return new URL(siteUrl).hostname; } catch (_) { return null; } }

module.exports = { pickSiteHost, isCourtHost, siteUrlFor, hostOf, HOST_PREFIX, HOST_SUFFIX };
