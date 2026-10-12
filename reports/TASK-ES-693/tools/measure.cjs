#!/usr/bin/env node
'use strict';
// #TASK-ES-693 — 지시(DIR-005)에 적는 숫자·줄 번호를 지금 코드에서 잰다(작업자 측정 도구, 판정 아님). 읽기만 한다.
// 사용: node reports/TASK-ES-693/tools/measure.cjs   → reports/TASK-ES-693/measure.json
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const html = rd('index.html'), css = rd('ui.css');
const HL = html.split('\n');

// 요소 하나의 줄 범위(같은 이름의 태그 깊이를 센다)
function range(id) {
  const at = html.indexOf('id="' + id + '"'); if (at < 0) return null;
  const open = html.lastIndexOf('<', at); const tag = (/^<([a-zA-Z0-9]+)/.exec(html.slice(open)) || [])[1]; if (!tag) return null;
  const re = new RegExp('<' + tag + '(?=[\\s>])|</' + tag + '>', 'g'); re.lastIndex = open; let d = 0, m;
  while ((m = re.exec(html))) { if (m[0][1] === '/') d--; else d++; if (d === 0) { const end = m.index + m[0].length; const s = lineOf(html, open), e = lineOf(html, end); return { tag, startLine: s, endLine: e, lines: e - s + 1 }; } }
  return null;
}
const seg = r => r ? HL.slice(r.startLine - 1, r.endLine).join('\n') : '';
const cap = range('captureCardBox'), wire = range('ogTaskWireSlot'), home = range('tab-home') || range('homeTab') || null;
const capSeg = seg(cap);
const textAt = t => { const i = HL.findIndex(l => l.indexOf(t) >= 0); return { text: t, line: i >= 0 ? i + 1 : null, insideCaptureCard: !!(cap && i >= 0 && i + 1 >= cap.startLine && i + 1 <= cap.endLine) }; };
const indexHtml = {
  lines: HL.length - (html.endsWith('\n') ? 1 : 0),
  captureCardBox: cap && Object.assign({}, cap, { ids: (capSeg.match(/id="[^"]+"/g) || []).map(s => s.slice(4, -1)), buttons: (capSeg.match(/<button\b/g) || []).length, inputs: (capSeg.match(/<(input|textarea|select)\b/g) || []).length, inlineStyleAttrs: (capSeg.match(/\sstyle="/g) || []).length, classNames: [...new Set((capSeg.match(/class="[^"]*"/g) || []).join(' ').replace(/class="/g, ' ').replace(/"/g, ' ').split(/\s+/).filter(Boolean))].length }),
  ogTaskWireSlot: wire, homeTab: home,
  texts: ['오늘의 1순위 실천 콕핏', '오늘 실천 완료 ✨ (+10 EXP)', '아워골 평가해주기'].map(textAt),
};

// 저장 처리기와 저장 함수
const capJs = 'js/tabs/records/checkin-capture.js', cockpit = 'js/core/home-cockpit.js';
const capSrc = rd(capJs), cockSrc = rd(cockpit); const CL = capSrc.split('\n'), KL = cockSrc.split('\n');
const linesWith = (L, re) => L.map((l, i) => re.test(l) ? i + 1 : 0).filter(Boolean);
const spLine = KL.findIndex(l => /(async\s+)?function\s+saveProfile\s*\(/.test(l)) + 1;
let spEnd = null; if (spLine) { let d = 0, started = false; for (let i = spLine - 1; i < KL.length; i++) { for (const ch of KL[i]) { if (ch === '{') { d++; started = true; } else if (ch === '}') d--; } if (started && d === 0) { spEnd = i + 1; break; } } }
const spBody = spLine && spEnd ? KL.slice(spLine - 1, spEnd) : [];
const save = {
  handlerFile: capJs,
  inputClearedLines: linesWith(CL, /\.value\s*=\s*''/).slice(0, 12), inputClearedText: linesWith(CL, /\.value\s*=\s*''/).slice(0, 12).map(n => CL[n - 1].trim().slice(0, 90)),
  saveProfileCallLines: linesWith(CL, /saveProfile\s*\(/), saveProfileCallText: linesWith(CL, /saveProfile\s*\(/).map(n => CL[n - 1].trim().slice(0, 90)),
  toastLines: linesWith(CL, /toast\s*\(/).slice(0, 12),
  confettiLines: linesWith(CL, /confetti/i).slice(0, 8), flashLines: linesWith(CL, /flash|pulse|highlight/i).slice(0, 8),
  tryLines: linesWith(CL, /\btry\s*\{/).length, catchLines: linesWith(CL, /\bcatch\s*\(/).length,
  saveFnFile: cockpit, saveProfile: { startLine: spLine || null, endLine: spEnd, lines: spLine && spEnd ? spEnd - spLine + 1 : null,
    warnLines: spBody.map((l, i) => /console\.warn\(/.test(l) ? spLine + i : 0).filter(Boolean), warnText: spBody.filter(l => /console\.warn\(/.test(l)).map(l => l.trim().slice(0, 110)),
    throwLines: spBody.map((l, i) => /\bthrow\b/.test(l) ? spLine + i : 0).filter(Boolean),
    localStorageSetLines: spBody.map((l, i) => /localStorage\.setItem\(|saveLocalSettings\(|writeOwnCopy\(/.test(l) ? spLine + i : 0).filter(Boolean),
    catchLines: spBody.map((l, i) => /\bcatch\s*\(/.test(l) ? spLine + i : 0).filter(Boolean) },
};

// 저장 실패 조사(볼트 회의 02 의 근거 문서 — 사본 reports/TASK-ES-693/save-failure-investigation.md)가 가리킨 줄을 지금 코드에서 다시 읽는다(줄 번호 대조만 — 함수 재현은 다시 돌리지 않았다)
const plJs = 'js/core/profile-load.js', PL = rd(plJs).split('\n'), vuJs = 'js/core/virtual-user-helpers.js', VL = rd(vuJs).split('\n'), bootJs = 'js/app/boot.js', BL = rd(bootJs).split('\n');
const spAbs = re => spBody.map((l, i) => re.test(l) ? spLine + i : 0).filter(Boolean);
const syncFn = (() => { const s = VL.findIndex(l => /syncOnline\s*:\s*async function/.test(l)); if (s < 0) return null; let d = 0, started = false; for (let i = s; i < VL.length; i++) { for (const ch of VL[i]) { if (ch === '{') { d++; started = true; } else if (ch === '}') d--; } if (started && d === 0) return [s + 1, i + 1]; } return null; })();
const saveFailure = {
  note: '줄 번호 대조(코드 읽기). 「함수 재현」 결과는 조사 담당의 것이며 이 도구는 다시 돌리지 않았다',
  serverWaitLines: { users: spAbs(/await L\.sb\.from\('users'\)\.upsert\(userUpsertObj\)/)[0] || null, goals: spAbs(/await L\.sb\.from\('goals'\)\.upsert\(/)[0] || null, checkins: spAbs(/await window\.OurgoalRecordLedger\.upsertCheckinRows\(/)[0] || null },
  deviceWriteLines: { goalsBackup: spAbs(/setItem\('ourgoal_goals_backup_'/)[0] || null, fullCopy: spAbs(/setItem\('ourgoal_guest_profile'/)[0] || null, recordsBackup: spAbs(/setItem\('ourgoal_records_backup_'/)[0] || null },
  checkinsResultUsed: spBody.some(l => /=\s*await window\.OurgoalRecordLedger\.upsertCheckinRows\(/.test(l)),
  goalsResultUsed: spBody.some(l => /=\s*await L\.sb\.from\('goals'\)\.upsert\(/.test(l)),
  profileLoad: { file: plJs, backupOverwrittenByServerLine: PL.findIndex(l => /else if\(records && records\.length > 0\)/.test(l)) + 2, overwriteText: (PL[PL.findIndex(l => /else if\(records && records\.length > 0\)/.test(l)) + 1] || '').trim().slice(0, 110) },
  offlineQueue: { file: vuJs, syncOnlineLines: syncFn, enqueueInHandlerLines: linesWith(CL, /OfflineSyncManager\.enqueue\(/), onlyWhenOfflineLine: linesWith(CL, /!navigator\.onLine/)[0] || null },
  serverClient: { file: bootJs, createLine: BL.findIndex(l => /supabase\.createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\)/.test(l)) + 1, hasOptionsArgument: BL.some(l => /createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\s*,/.test(l)) },
  toastHasFailureBranch: CL.slice(36, 222).some(l => /실패|못했|다시 시도/.test(l)),
};

// 꾸밈 파일
const CSSL = css.split('\n');
const defs = {}, uses = {};
css.replace(/(^|[;{\s])(--[a-zA-Z0-9_-]+)\s*:/g, (m, a, n) => { defs[n] = (defs[n] || 0) + 1; return m; });
css.replace(/var\(\s*(--[a-zA-Z0-9_-]+)/g, (m, n) => { uses[n] = (uses[n] || 0) + 1; return m; });
const five = ['--primary', '--primary-hover', '--border-subtle', '--surface-1', '--card-bg'];
const themes = ['focus-sanctuary', 'white', 'black', 'urban-city', 'dark', 'sunset-beach', 'glowing-space', 'deep-sea'];
const count = re => (css.match(re) || []).length;
// 다른 파일에서의 정의·사용(다섯 변수)
const grepCount = (re, files) => files.reduce((n, f) => n + ((fs.existsSync(path.join(ROOT, f)) ? rd(f) : '').match(re) || []).length, 0);
const jsFiles = cp.execFileSync('git', ['-C', ROOT, 'ls-files', 'js', 'ui.js', 'index.html'], { encoding: 'utf8' }).split('\n').filter(f => /\.(js|html)$/.test(f));
const uiCss = {
  lines: CSSL.length - (css.endsWith('\n') ? 1 : 0), important: count(/!important/g), mediaRules: count(/@media/g), keyframes: count(/@keyframes/g),
  variableNamesDefined: Object.keys(defs).length, variableDefinitions: Object.values(defs).reduce((a, b) => a + b, 0), variableUses: Object.values(uses).reduce((a, b) => a + b, 0),
  usedButNeverDefined: Object.keys(uses).filter(n => !defs[n]).map(n => ({ name: n, uses: uses[n] })).sort((a, b) => b.uses - a.uses).slice(0, 20),
  fiveVariables: five.map(n => ({ name: n, definedInUiCss: defs[n] || 0, usedInUiCss: uses[n] || 0, definedElsewhere: grepCount(new RegExp('(^|[;{\\s"\'])' + n + '\\s*:', 'gm'), jsFiles), setByScript: grepCount(new RegExp('setProperty\\(\\s*[\'"]' + n + '[\'"]', 'g'), jsFiles) })),
  themeSelectors: themes.map(t => ({ theme: t, count: count(new RegExp('\\[data-theme=["\']?' + t + '["\']?\\]', 'g')) })),
  bottomNav: { appShellRuleLine: CSSL.findIndex(l => l.indexOf('#appShell .bottomnav {') === 0) + 1, appShellRuleText: (() => { const i = CSSL.findIndex(l => l.indexOf('#appShell .bottomnav {') === 0); return i >= 0 ? CSSL.slice(i, i + 2).join(' ').replace(/\s+/g, ' ').trim().slice(0, 120) : null; })(), whiteThemeRuleLine: CSSL.findIndex(l => l.indexOf('html[data-theme="white"] .bottomnav {') === 0) + 1 },
  cssFiles: cp.execFileSync('git', ['-C', ROOT, 'ls-files', '*.css'], { encoding: 'utf8' }).split('\n').filter(Boolean),
  linkTags: (html.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g) || []).map(s => (/href=["']([^"']+)["']/.exec(s) || [])[1]),
};
// 켤 때 받아들이는 테마 목록(저장된 테마를 입히는 구역 함수)
const early = rd('js/core/boot-early-state.js'); const tl = (/\[([^\]]*'focus-sanctuary'[^\]]*)\]\.indexOf\(/.exec(early) || [])[1];
const acceptedThemes = tl ? tl.split(',').map(s => s.trim().replace(/'/g, '')) : null;

// 추천 칩을 눌렀을 때의 지금 동작(입력 칸 맨 앞에 「#이름 」을 넣는다)
const chipJs = 'js/tabs/home/sub-onescreen.js', chipSrc = rd(chipJs), XL = chipSrc.split('\n');
const chipStart = XL.findIndex(l => /wireSmartRecommendChips\s*:\s*function/.test(l)) + 1;
let chipEnd = null; if (chipStart) { let d = 0, started = false; for (let i = chipStart - 1; i < XL.length; i++) { for (const ch of XL[i]) { if (ch === '{') { d++; started = true; } else if (ch === '}') d--; } if (started && d === 0) { chipEnd = i + 1; break; } } }
const chip = { file: chipJs, startLine: chipStart || null, endLine: chipEnd, prefixLine: XL.findIndex(l => /tagPrefix\s*=\s*'#'\s*\+/.test(l)) + 1, insertLine: XL.findIndex(l => /inp\.value\s*=\s*tagPrefix\s*\+/.test(l)) + 1, // 빠른 칩 자리(#quickCheckinChips · .quick-checkin-chips)를 이름으로 가리키는 js 파일(글자 찾기 — 글자로 안 보이는 연결은 못 잡는다)
  quickChipsById: jsFiles.filter(f => /\.js$/.test(f) && rd(f).indexOf('quickCheckinChips') >= 0), quickChipsByClass: jsFiles.filter(f => /\.js$/.test(f) && rd(f).indexOf('quick-checkin-chips') >= 0) };
// 넘겨받은 꾸러미(저장소에 넣은 사본)에서 세는 값
const PK = 'docs/design/home-pilot-2026-10';
const gene = JSON.parse(rd(PK + '/02-유전자-값.json'))['값'];
const spec = rd(PK + '/03-오늘-기록하기-창-명세.md').replace(/\r\n/g, '\n');
const section = (title, next) => { const a = spec.indexOf(title); const b = next ? spec.indexOf(next, a + 1) : -1; return a < 0 ? '' : spec.slice(a, b < 0 ? undefined : b); };
const tableRows = t => t.split('\n').filter(l => l.indexOf('|') === 0 && !/^\|\s*-/.test(l)).length - 1; // 머리 줄 하나를 뺀다
const pkg = { dir: PK, files: cp.execFileSync('git', ['-C', ROOT, 'ls-files', '--others', '--cached', '--exclude-standard', '--', PK], { encoding: 'utf8' }).split('\n').filter(Boolean).length,
  gene: { cells: gene.length, themes: [...new Set(gene.map(g => g.theme))].length, variables: [...new Set(gene.map(g => g.name))].length, changed: gene.filter(g => g.changed).length, same: gene.filter(g => !g.changed).length },
  spec: { changedTextPlaces: tableRows(section('**바뀌는 문구(뼈대에 적힌 것만)**', '**그대로 두는 것**')), notInPilot: tableRows(section('## 4. 시안에는 있지만', '## 5. 상태별로')), stateScenes: (section('## 5. 상태별로', '## 6. 이 명세가').match(/^\d+\. /gm) || []).length, unknowns: (section('## 6. 이 명세가 모르는 것', null).match(/^- /gm) || []).length } };

// 시범 구획의 글이 어디에 적혀 있는가 — 뼈대(index.html) · 제품 코드(js) · 시험(scripts · tests · court). 글자 찾기다(조립해서 만드는 글은 조각으로만 잡힌다).
const ls = a => cp.execFileSync('git', ['-C', ROOT, 'ls-files', '--'].concat(a), { encoding: 'utf8' }).split('\n').filter(Boolean);
const prodJs = ls(['js', 'ui.js', 'sw.js']).filter(f => /\.js$/.test(f));
const testFiles = ls(['scripts', 'tests', 'court']).filter(f => /\.(js|cjs|mjs|json)$/.test(f));
const hits = (files, t) => { const o = []; files.forEach(f => { const s = rd(f); if (s.indexOf(t) < 0) return; s.split('\n').forEach((l, i) => { if (l.indexOf(t) >= 0) o.push(f + ':' + (i + 1)); }); }); return o; };
const where = t => { const hl = HL.map((l, i) => l.indexOf(t) >= 0 ? i + 1 : 0).filter(Boolean); return { text: t, indexHtml: hl, indexHtmlInsideCard: hl.filter(n => cap && n >= cap.startLine && n <= cap.endLine).length, js: hits(prodJs, t), tests: hits(testFiles, t) }; };
const now13 = ['오늘의 1순위 실천 콕핏', '다정한 1:1 러닝메이트', '오늘 마음을 단단히 먹은 일 한 줄을 자유롭게 적어보세요', '추천 칩:', '🏃 운동', '📚 독서', '🧘 멘탈', '에너지 &amp; 몰입도 기록 (선택)', '접기/펼치기', '신체 컨디션 (에너지)', '정신 몰입도 (집중도)', '오늘 실천 완료 ✨ (+10 EXP)', 'AI 피드백 모드 설정', '설정 열기', 'AI 피드백 모드 선택', '기본 (3문장)', '중간 (궤적분석)', '정밀 (일정추천)', '나만의 AI 말투 &amp; 피드백 설정', '설정하기 ›'];
const titleLines = HL.map((l, i) => l.indexOf('오늘의 1순위 실천 콕핏') >= 0 ? { line: i + 1, visible: /sanctuary-title-text/.test(l), attribute: /data-widget-label="오늘의 1순위 실천 콕핏"/.test(l) } : null).filter(Boolean);
const pilotText = {
  note: '글자 찾기. indexHtml 은 줄 번호, js · tests 는 파일:줄. tests 는 scripts · tests · court 아래의 js · json',
  saveButton: where('오늘 실천 완료 ✨ (+10 EXP)'),
  saveButtonLoose: where('오늘 실천 완료'), // 단추 글이 아닌 같은 말머리(피드 공유 문구 등)까지
  saving: where('기록 중…'),
  toastBase: where('오늘의 실천이 안전하게 기록되었어요'), toastPhoto: where('사진과 함께 안전하게 기록했어요'), toastFreeze: where('스트릭 프리즈를 1개 획득했어요'), toastSuffix: where("' ✨ (+10 EXP)'"),
  placeholderAfterSave: where('예: 오늘 실천한 멋진 일을 한 줄로 적어보세요'),
  restoreButtonHtmlLines: linesWith(CL, /origSaveBtnHtml/), // 누르기 전 단추 안의 글을 담아 두었다가 끝나면 되돌리는 줄
  toastCallLine: linesWith(CL, /L\.toast\(checkinToastMsg/)[0] || null, toastBuildLines: (() => { const a = CL.findIndex(l => /var checkinToastMsg\s*=/.test(l)); const b = CL.findIndex((l, i) => i > a && /;\s*$/.test(l)); return a >= 0 ? [a + 1, b + 1] : null; })(),
  titleLines,
  styleWritesInHandler: linesWith(CL, /\.style\.[a-zA-Z]+\s*=/), // 저장 처리기가 요소에 꾸밈을 직접 적는 줄(뼈대의 inline 꾸밈과 같이 꾸밈 파일의 규칙을 이긴다)
  now: now13.map(where).map(w => ({ text: w.text, indexHtml: w.indexHtml, insideCard: w.indexHtmlInsideCard, js: w.js.length, tests: w.tests.length, jsAt: w.js.slice(0, 6), testsAt: w.tests.slice(0, 6) })),
};
// 바뀌는 글을 글자로 확인하는 시험 줄(주석 줄은 뺀다)
const isComment = ref => { const i = ref.lastIndexOf(':'); const l = (rd(ref.slice(0, i)).split('\n')[Number(ref.slice(i + 1)) - 1] || '').trim(); return l.indexOf('//') === 0 || l.indexOf('*') === 0 || l.indexOf('/*') === 0; };
pilotText.nowInTests = now13.map(where).reduce((o, w) => { w.tests.forEach(r => { (isComment(r) ? o.commentLines : o.codeLines).push(r); }); return o; }, { codeLines: [], commentLines: [] });
// 제품 코드가 시범 구획의 요소에 꾸밈을 직접 적는 자리(색 · 굵기 · 크기 — 보이기/숨기기는 뺀다). 꾸밈 파일의 새 규칙은 이 자리를 `!important` 없이 이기지 못한다.
// 글자 찾기로 아는 세 군데만 잰다. 전부라는 보장은 없다(변수를 거쳐 적는 자리는 못 잡는다).
const fnRange = (L, re) => { const s = L.findIndex(l => re.test(l)); if (s < 0) return null; let d = 0, started = false; for (let i = s; i < L.length; i++) { for (const ch of L[i]) { if (ch === '{') { d++; started = true; } else if (ch === '}') d--; } if (started && d === 0) return [s + 1, i + 1]; } return null; };
const aiJs = 'js/tabs/records/ai-feedback.js', AL = rd(aiJs).split('\n');
const tierFn = fnRange(AL, /function\s+initFeedbackTierBar\s*\(/), chipFn = fnRange(KL, /function\s+renderQuickCheckinGuideChips\s*\(/);
const inRange = (L, r, re) => r ? L.map((l, i) => (i + 1 >= r[0] && i + 1 <= r[1] && re.test(l)) ? i + 1 : 0).filter(Boolean) : [];
const LOOK = /\.style\.(background|color|fontWeight|boxShadow|borderColor|border|fontSize|padding|borderRadius)\s*=/;
const scriptStyle = { note: '보이기/숨기기(display)는 세지 않았다',
  tierButtons: { file: aiJs, fn: 'initFeedbackTierBar', fnLines: tierFn, lines: inRange(AL, tierFn, LOOK) },
  quickChips: { file: cockpit, fn: 'renderQuickCheckinGuideChips', fnLines: chipFn, inlineStyleInMarkupLines: inRange(KL, chipFn, /class="btn-quick-chip"[^>]*style="/), lines: inRange(KL, chipFn, LOOK), sameFileAsSaveProfile: true },
  saveHandler: { file: capJs, lines: linesWith(CL, LOOK) } };
scriptStyle.files = [scriptStyle.tierButtons, scriptStyle.quickChips, scriptStyle.saveHandler].filter(x => (x.lines || x.inlineStyleInMarkupLines || []).length).map(x => x.file);
scriptStyle.places = scriptStyle.tierButtons.lines.length + scriptStyle.quickChips.inlineStyleInMarkupLines.length + scriptStyle.quickChips.lines.length + scriptStyle.saveHandler.lines.length;
// 시범 구획의 이름표·클래스를 글자로 가리키는 시험 파일(뼈대를 고치면 같이 봐야 하는 시험)
const capClasses = ['toss-checkin-clean-box', 'capture-title', 'capture-sub', 'capture-ta-wrap', 'smart-recommend-chips', 'btn-smart-chip', 'dimension-accordion', 'checkin-dimension-sliders', 'capture-row', 'toss-checkin-save-btn', 'checkin-more-options', 'ai-mode-setting-card', 'feedback-tier-bar', 'tier-btn', 'ai-mode-desc-card'];
const capIdsAll = (indexHtml.captureCardBox && indexHtml.captureCardBox.ids) || [];
const testRefs = {}; testFiles.forEach(f => { const s = rd(f); const n = capIdsAll.concat(capClasses).filter(k => s.indexOf(k) >= 0); if (n.length) testRefs[f] = n; });
const pilotTests = { note: '이름표 29개와 클래스 ' + capClasses.length + '개 가운데 하나라도 글자로 든 시험 파일', files: Object.keys(testRefs).length, byFile: Object.keys(testRefs).sort().map(f => ({ file: f, names: testRefs[f].length, first: testRefs[f].slice(0, 8) })) };
// 유전자 값 표의 변수 18개가 쓰이는 자리 수(꾸밈 파일 · 뼈대 · 제품 코드) — 공용 값이 닿는 넓이
const geneNames = [...new Set(gene.map(g => g.name))];
const usesIn = (s, n) => (s.match(new RegExp('var\\(\\s*' + n.replace(/[-]/g, '\\-') + '(?![a-zA-Z0-9_-])', 'g')) || []).length;
const prodJsSrc = prodJs.map(rd).join('\n');
const geneReach = { note: 'var(--이름) 꼴로 쓰는 자리 수. 다른 변수를 거쳐 닿는 자리는 세지 않는다', variables: geneNames.map(n => ({ name: n, changedThemes: gene.filter(g => g.name === n && g.changed).length, uiCss: usesIn(css, n), indexHtml: usesIn(html, n), js: usesIn(prodJsSrc, n) })) };
geneReach.changedVariables = geneReach.variables.filter(v => v.changedThemes > 0).length;
geneReach.usesOfChanged = geneReach.variables.filter(v => v.changedThemes > 0).reduce((a, v) => ({ uiCss: a.uiCss + v.uiCss, indexHtml: a.indexHtml + v.indexHtml, js: a.js + v.js }), { uiCss: 0, indexHtml: 0, js: 0 });

const head = cp.execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const base = (() => { try { return cp.execFileSync('git', ['-C', ROOT, 'merge-base', 'HEAD', 'origin/main'], { encoding: 'utf8' }).trim(); } catch (e) { return null; } })();
const out = { tool: 'reports/TASK-ES-693/tools/measure.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), head: head.slice(0, 8), mainBase: base && base.slice(0, 8), indexHtml, save, saveFailure, uiCss, acceptedThemes, chip, pkg, pilotText, scriptStyle, pilotTests, geneReach };
fs.writeFileSync(path.join(ROOT, 'reports', 'TASK-ES-693', 'measure.json'), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ cap: cap && [cap.startLine, cap.endLine, cap.lines], capIds: indexHtml.captureCardBox && indexHtml.captureCardBox.ids.length, buttons: indexHtml.captureCardBox && indexHtml.captureCardBox.buttons, inputs: indexHtml.captureCardBox && indexHtml.captureCardBox.inputs, wire: wire && [wire.startLine, wire.endLine, wire.lines], home: home && [home.startLine, home.endLine, home.lines], texts: indexHtml.texts, save: { clear: save.inputClearedLines, call: save.saveProfileCallLines, sp: [save.saveProfile.startLine, save.saveProfile.endLine], warn: save.saveProfile.warnLines, warnText: save.saveProfile.warnText, throws: save.saveProfile.throwLines, confetti: save.confettiLines, flash: save.flashLines }, css: { lines: uiCss.lines, important: uiCss.important, names: uiCss.variableNamesDefined, defs: uiCss.variableDefinitions, uses: uiCss.variableUses, five: uiCss.fiveVariables, themes: uiCss.themeSelectors, files: uiCss.cssFiles, links: uiCss.linkTags }, acceptedThemes }, null, 1));
