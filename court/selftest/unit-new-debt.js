'use strict';
// 법정 자가시험 — 단위 시험(이번 변경이 새로 만든 정적 위반: 800줄 상한 · CSS 은폐 · 금지 낱말, court/lib/new-debt.js).
// 기준 커밋에 이미 있던 부채는 세지 않고, 새로 생긴 것만 돌려보내는지 합성 저장소로 확인한다. 브라우저는 쓰지 않는다(--unit-only 에 들어간다).
const newDebt = require('../lib/new-debt');
const vaultCheck = require('../vault-check');
const scenarioLib = require('../lib/scenario');
const judgeLib = require('../judge');
const { createLab } = require('./lab');

const nLines = (n, tag) => Array.from({ length: n }, (_, i) => '// ' + (tag || 'line') + ' ' + (i + 1)).join('\n') + '\n';

// judge.js 와 같은 방식으로 "배포되는 제품 파일"을 가른다(금고가 제품으로 분류한 것 중 법정 서버가 내주지 않는 경로를 뺀 것).
function runCheck(lab, base, head) {
  const vault = vaultCheck.loadVault();
  const cfg = scenarioLib.loadConfig();
  const v = vaultCheck.checkVault({ repo: lab.dir, base, head, vault });
  const product = new Set((v.productChanged || []).map(p => String(p).replace(/ \(.*\)$/, '')));
  const isTooling = p => (cfg.denyServePrefixes || []).some(pre => ('/' + p).toLowerCase().startsWith(String(pre).toLowerCase()));
  const changed = require('../lib/git').changedFiles(lab.dir, base, head);
  return newDebt.check({ repo: lab.dir, base, head, changed, isProduct: p => product.has(p) && !isTooling(p) }).violations;
}
const kinds = list => JSON.stringify(list.map(x => x.kind + ':' + x.file).sort());

const TESTS = [
  {
    id: 'U-new-debt-pure', title: '새로 생긴 정적 위반(순수 함수): 줄 수 세기, 800줄 상한의 네 경우, 추가된 줄의 번호, 은폐·금지 낱말 찾기',
    run(t) {
      t.eq(newDebt.countLines(null), null, '없는 파일은 null'); t.eq(newDebt.countLines(''), 0, '빈 파일 0줄');
      t.eq(newDebt.countLines('a\nb\n'), 2, '끝 줄바꿈은 줄을 늘리지 않는다'); t.eq(newDebt.countLines('a\nb'), 2, '끝 줄바꿈이 없어도 2줄'); t.eq(newDebt.countLines('a\r\nb\r\n'), 2, 'CRLF 도 같다');
      const L = newDebt.lineLimitViolation;
      t.eq(L(null, 801), 'new-file', '기준에 없던 파일이 801줄'); t.eq(L(null, 800), null, '새 파일 800줄은 상한 안');
      t.eq(L(700, 801), 'crossed', '700 → 801 은 새로 넘김'); t.eq(L(900, 950), 'grew', '이미 넘던 900 → 950 은 더 길어짐');
      t.eq(L(900, 900), null, '이미 넘던 파일이 같으면 위반 아님'); t.eq(L(900, 850), null, '이미 넘던 파일이 줄면 위반 아님'); t.eq(L(900, null), null, '지운 파일은 위반 아님');
      const diff = ['diff --git a/x.css b/x.css', '--- a/x.css', '+++ b/x.css', '@@ -3,0 +4,2 @@', '+.a { display: none !important; }', '+.b { color: red; }', '@@ -10 +12 @@', '-.old { display:none!important }', '+.new { position: absolute; left: -9999px; }'].join('\n');
      const added = newDebt.addedLinesWithNumbers(diff);
      t.eq(JSON.stringify(added.map(a => a.n)), '[4,5,12]', '추가된 줄 번호(작업 커밋 기준)');
      t.ok(!added.some(a => /old/.test(a.text)), '지운 줄은 추가된 줄이 아니다');
      const hits = newDebt.scanAdded(added);
      t.eq(JSON.stringify(hits.map(h => h.kind + '@' + h.n)), '["css@4","css@12"]', 'CSS 은폐 두 줄(display:none !important · left:-9999px)');
      t.eq(newDebt.scanAdded([{ n: 1, text: '.a{DISPLAY:NONE !IMPORTANT}' }]).length, 1, 'CSS 는 대소문자를 가리지 않는다');
      t.eq(newDebt.scanAdded([{ n: 1, text: '.a{display:none}' }]).length, 0, '!important 없는 display:none 은 은폐가 아니다');
      const banned = ['fake_', 'mock_streak', 'dummy_count', 'hard_coded_stat', 'force_pay', 'paywall_block', 'lock_feature', 'ad_force', 'burnout_care', 'give_up', 'rest_mode', 'skip_today'];
      for (const w of banned) t.eq(newDebt.scanAdded([{ n: 7, text: 'const ' + w + 'x = 1;' }]).filter(h => h.kind === 'banned').length, 1, '금지 낱말 ' + w);
      t.eq(newDebt.BANNED.length, 12, '금지 목록은 헌법 anti_pattern_blacklist 의 12개');
      t.eq(newDebt.scanAdded([{ n: 1, text: 'const giveUp = 1; // fakeData' }]).length, 0, '목록과 글자가 다른 낱말(giveUp·fakeData)은 잡지 않는다');
    },
  },
  {
    id: 'U-new-debt-repo', title: '새로 생긴 정적 위반(합성 저장소): 기존 부채만 있는 변경은 0건, 새 은폐 줄·새 800줄 초과 파일·새 금지 낱말은 잡는다',
    run(t) {
      const lab = createLab({ variant: 'standard' });
      try {
        // 기준: 이미 900줄인 부품과, 이미 은폐 줄·금지 낱말이 있는 제품 파일(기존 부채)
        const debtBase = lab.commit('nd/debt-base', {
          'js/legacy.js': nLines(900, 'legacy'),
          'ui.css': '.old-hide { display: none !important; }\n.keep { color: red; }\n',
          'js/old-word.js': 'const fake_total = 1;\n',
        }, '기존 부채가 있는 기준');
        // ① 기존 부채만 있고 새 위반이 없는 변경: 이미 넘던 파일을 줄이고, 은폐 줄이 있는 파일의 다른 줄을 고치고, 금지 낱말이 있는 파일을 옮긴다
        const honest = lab.commit('nd/honest', [
          { 'js/legacy.js': nLines(880, 'legacy'), 'ui.css': '.old-hide { display: none !important; }\n.keep { color: blue; }\n' },
          { 'js/old-word.js': null, 'js/moved-word.js': 'const fake_total = 1;\n' },
        ], '기존 부채만 있는 변경', debtBase);
        let v = runCheck(lab, debtBase, honest);
        t.eq(v.length, 0, '① 기존 부채만 있는 변경의 새 위반 수: ' + kinds(v));
        // 은폐 줄을 지우는 변경도 위반이 아니다
        const removeHide = lab.commit('nd/remove-hide', { 'ui.css': '.keep { color: red; }\n' }, '은폐 줄 삭제', debtBase);
        t.eq(runCheck(lab, debtBase, removeHide).length, 0, '은폐 줄을 지운 변경은 0건');
        // 기존 은폐 줄·금지 낱말 줄의 다른 부분만 고침(선택자 추가·값 변경) — 그 줄이 +줄로 나와도 패턴 수가 늘지 않았으므로 위반 아님
        const editSame = lab.commit('nd/edit-same-line', {
          'ui.css': '.old-hide, .also-hide { display: none !important; }\n.keep { color: red; }\n',
          'js/old-word.js': 'const fake_total = 2;\n',
        }, '기존 은폐 줄의 다른 부분만 수정', debtBase);
        t.eq(runCheck(lab, debtBase, editSame).length, 0, '기존 은폐 줄·금지 낱말 줄의 다른 부분만 고친 변경은 0건: ' + kinds(runCheck(lab, debtBase, editSame)));
        // 같은 줄을 고치면서 패턴을 하나 더 넣으면 늘어난 것이므로 잡는다
        const editMore = lab.commit('nd/edit-more', { 'ui.css': '.old-hide { display: none !important; } .b { display:none!important }\n.keep { color: red; }\n' }, '기존 줄에 은폐 하나 더', debtBase);
        t.eq(kinds(runCheck(lab, debtBase, editMore)), '["css:ui.css"]', '기존 줄에 은폐를 하나 더 넣으면 잡힌다');
        // ② 새 display:none !important 한 줄
        const hide = lab.commit('nd/new-hide', { 'ui.css': old => old + '.new-hide { display:none !important }\n' }, '새 은폐 줄', debtBase);
        v = runCheck(lab, debtBase, hide);
        t.eq(kinds(v), '["css:ui.css"]', '② 새 은폐 줄은 CSS 은폐로 잡힌다');
        t.ok(v[0] && /ui\.css:3 \[display:none !important\]/.test(v[0].text), '사유에 파일:줄·패턴이 나온다: ' + (v[0] && v[0].text));
        // ③ 800줄 넘는 새 js 파일 · 800줄 이하였다가 넘은 파일 · 이미 넘던 파일이 더 길어짐
        const big = lab.commit('nd/new-big', { 'js/big.js': nLines(801, 'big') }, '새 801줄 파일', debtBase);
        v = runCheck(lab, debtBase, big);
        t.eq(kinds(v), '["lines:js/big.js"]', '③ 800줄 넘는 새 js 파일');
        t.ok(v[0] && /기준 커밋에 없던 파일이 801줄/.test(v[0].text), '사유에 줄 수가 나온다: ' + (v[0] && v[0].text));
        const at800 = lab.commit('nd/new-800', { 'js/edge.js': nLines(800, 'edge') }, '새 800줄 파일', debtBase);
        t.eq(runCheck(lab, debtBase, at800).length, 0, '새 파일 800줄은 상한 안');
        const crossed = lab.commit('nd/crossed', { 'js/mod.js': old => old + nLines(810, 'pad') }, '800줄을 새로 넘김', debtBase);
        t.eq(kinds(runCheck(lab, debtBase, crossed)), '["lines:js/mod.js"]', '800줄 이하였던 파일이 넘으면 잡힌다');
        const grew = lab.commit('nd/grew', { 'js/legacy.js': nLines(901, 'legacy') }, '이미 넘던 파일이 길어짐', debtBase);
        t.eq(kinds(runCheck(lab, debtBase, grew)), '["lines:js/legacy.js"]', '이미 넘던 파일이 더 길어지면 잡힌다');
        const outside = lab.commit('nd/outside', { 'scripts/tool-big.js': nLines(900, 'tool'), 'docs/note.md': '.x{display:none !important} give_up\n' }, '제품 밖 파일', debtBase);
        t.eq(runCheck(lab, debtBase, outside).length, 0, '제품이 아닌 파일(scripts/·docs/)은 보지 않는다');
        // 새 금지 낱말
        const word = lab.commit('nd/word', { 'js/app.js': old => old + '\nconst give_up_count = 0;\n' }, '새 금지 낱말', debtBase);
        v = runCheck(lab, debtBase, word);
        t.eq(kinds(v), '["banned:js/app.js"]', '추가된 줄의 금지 낱말');
        t.ok(v[0] && /\/give_up\//.test(v[0].text), '사유에 패턴이 나온다: ' + (v[0] && v[0].text));
      } finally { lab.dispose(); }
    },
  },
  {
    id: 'U-new-debt-judge', title: '새로 생긴 정적 위반(법정 배선): 빠른 점검에서 새 은폐 줄은 돌려보냄이고, 기존 부채만 있는 변경에는 이 사유가 나오지 않는다',
    async run(t) {
      const lab = createLab({ variant: 'standard' });
      try {
        const debtBase = lab.commit('nd/j-base', { 'ui.css': '.old-hide { display: none !important; }\n' }, '기존 부채', lab.baseSha);
        lab.git(['update-ref', 'refs/remotes/origin/main', debtBase]);
        const titles = ['CSS 은폐 줄이 새로 추가됨', '800줄 상한을 새로 넘김', '금지 낱말이 새로 추가됨'];
        const bad = lab.commit('nd/j-bad', { 'ui.css': old => old + '.x { display: none !important; }\n' }, '새 은폐 줄', debtBase);
        let v = await judgeLib.judge({ repo: lab.dir, head: bad, base: null, quick: true });
        t.eq(v.verdict, '돌려보냄', '새 은폐 줄을 더한 변경의 판정');
        t.ok(v.findings.some(f => f.severity === 'reject' && f.title === titles[0]), '돌려보낸 사유에 “' + titles[0] + '”: ' + JSON.stringify(v.findings.map(f => f.title)));
        const ok = lab.commit('nd/j-ok', { 'ui.css': old => old + '.y { color: red; }\n' }, '기존 부채만', debtBase);
        v = await judgeLib.judge({ repo: lab.dir, head: ok, base: null, quick: true });
        t.ok(!v.findings.some(f => titles.includes(f.title)), '기존 부채만 있는 변경에는 새 정적 위반 사유가 없다: ' + JSON.stringify(v.findings.map(f => f.title)));
      } finally { lab.dispose(); }
    },
  },
];

module.exports = { TESTS };
