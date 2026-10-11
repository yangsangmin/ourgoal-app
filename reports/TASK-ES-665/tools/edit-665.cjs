'use strict';
// #TASK-ES-665 고치기 — index.html 의 상태 선언 아홉 문을 상태 이전(unstate)의 정지 조건에 걸리지 않는 꼴로 다듬는다. 사람이 정한 글자 바꾸기 네 군데를 그대로 적어 둔 것이다(생성기가 아니다).
// 하는 일(각 자리는 「이전 글자」가 index.html 에 꼭 한 번 있어야 하고, 아니면 멈춘다):
//   ㉠ `_subtabTplCat` · `_subtabTplQuery` 의 겹친 선언 가운데 뒤의 한 쌍(2줄)을 지운다 — 앞의 한 쌍과 초기값이 같고 그 사이에 실행되는 문이 그 이름에 값을 넣지 않는다(선언 둘뿐).
//   ㉡ `_subtabTplDomain` · `_subtabTplType` · `FEED_POSTS_CACHE` 선언 줄 끝의 주석을 윗줄로 뗀다(주석 글자 그대로, 3줄 늘어남).
//   ㉢ `var shareContent = …; window.shareContent = shareContent;` 한 줄을 두 줄로 나눈다(1줄 늘어남).
//   ㉣ ㉢ 바로 앞에 연달아 있는 빈 줄 다섯 가운데 둘을 지운다 — 줄 수를 맞추려는 것이다(−2 −2 +3 +1 = 0, index.html 순증가 0).
// 사용: node edit-665.cjs <트리> [--check]   (--check: 쓰지 않고 각 자리의 「이전 글자」가 한 번씩 있는지만 본다)
const fs = require('fs'), path = require('path');
const [TREE] = process.argv.slice(2), CHECK = process.argv.includes('--check');
const EDITS = [
  { id: '㉠㉡-subtabTpl', what: '겹친 선언 한 쌍 삭제 + 줄 끝 주석 둘을 윗줄로',
    before: [
      "  var _subtabTplDomain = 'personal'; // 'personal' | 'routine' | 'team'",
      "  var _subtabTplType = 'ai';         // 'ai' | 'real'",
      "  var _subtabTplCat = 'all';",
      "  var _subtabTplQuery = '';",
      '  bootGoalsAndTeamState();',
    ],
    after: [
      "  // 'personal' | 'routine' | 'team'",
      "  var _subtabTplDomain = 'personal';",
      "  // 'ai' | 'real'",
      "  var _subtabTplType = 'ai';",
      '  bootGoalsAndTeamState();',
    ], lastIsPrefix: true },
  { id: '㉢㉣-shareContent', what: '빈 줄 둘 삭제 + 한 줄을 두 줄로',
    before: ['', '', '', '', '',
      '  var shareContent = function(opts){ return window.OurgoalViralSharing ? window.OurgoalViralSharing.shareContent(opts) : Promise.resolve(); }; window.shareContent = shareContent;'],
    after: ['', '', '',
      '  var shareContent = function(opts){ return window.OurgoalViralSharing ? window.OurgoalViralSharing.shareContent(opts) : Promise.resolve(); };',
      '  window.shareContent = shareContent;'] },
  { id: '㉡-FEED_POSTS_CACHE', what: '줄 끝 주석을 윗줄로',
    before: ['  var FEED_POSTS_CACHE = null; // null=아직 안 불러옴, 로드 후 배열'],
    after: ['  // null=아직 안 불러옴, 로드 후 배열', '  var FEED_POSTS_CACHE = null;'] },
];
const f = path.join(TREE, 'index.html'), raw = fs.readFileSync(f, 'utf8'), eol = raw.includes('\r\n') ? '\r\n' : '\n';
let ls = raw.split('\n').map(l => l.replace(/\r$/, ''));
const report = [];
for (const e of EDITS) {
  const n = e.before.length, last = n - 1;
  const hit = [];
  for (let i = 0; i + n <= ls.length; i++) {
    let ok = true;
    for (let k = 0; k < n && ok; k++) ok = (e.lastIsPrefix && k === last) ? ls[i + k].startsWith(e.before[k]) : ls[i + k] === e.before[k];
    if (ok) hit.push(i);
  }
  if (hit.length !== 1) throw new Error('「이전 글자」가 ' + hit.length + '번 있다(꼭 한 번이어야 한다): ' + e.id);
  const i = hit[0];
  const after = e.after.slice();
  if (e.lastIsPrefix) after[after.length - 1] = ls[i + last]; // 마지막 줄은 닻이다 — 그 줄 전체를 그대로 둔다
  report.push({ id: e.id, what: e.what, line: i + 1, beforeLines: n, afterLines: after.length, delta: after.length - n });
  ls = ls.slice(0, i).concat(after, ls.slice(i + n));
}
const net = report.reduce((a, r) => a + r.delta, 0);
if (!CHECK) fs.writeFileSync(f, ls.join(eol), { encoding: 'utf8' });
console.log(JSON.stringify({ written: !CHECK, edits: report, netLineGrowth: net }));
