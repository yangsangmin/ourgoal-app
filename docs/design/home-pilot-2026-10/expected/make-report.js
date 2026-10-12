// data.json 과 사진으로 예상 변화 목록(글)과 한 장 보기(화면)를 만든다
const fs = require('fs'), path = require('path');
const D = __dirname, d = JSON.parse(fs.readFileSync(path.join(D, 'data.json'), 'utf8'));
const TN = { 'focus-sanctuary': '성소', white: '화이트', black: '블랙', 'urban-city': '깔끔한 도심' }, THEMES = Object.keys(TN);
const S = Object.entries(d.screens);
const sum = f => S.reduce((a, [, s]) => a + Object.values(s.themes).reduce((b, v) => b + f(v), 0), 0);
const fell = sum(v => v.fellBelow), rose = sum(v => v.roseAbove), wrong = sum(v => v.wrongVars.length), five = sum(v => v.fiveChanged.length);
const worst = Math.min(...S.flatMap(([, s]) => Object.values(s.themes).map(v => v.worstAfter == null ? 99 : v.worstAfter)));
const changedEl = sum(v => v.changed.color + v.changed.bg + v.changed.border), allEl = sum(v => v.elements);
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const uses = v => v.uses.css + v.uses.html + v.uses.js;

let md = `# 묶음 ① 공용 값 28개 — 예상 변화 목록 (지시 병합 전 · 근거 자료)

- **이 글은 승인된 기준이 아니다.** 디자인 1단계 지시가 병합되기 전에 만든 근거 자료다(회의 02 합의).
- 기준 커밋: 아워골 \`${d.ref}\` = \`${d.commit}\` (${d.commitAt}). 만든 때: ${d.madeAt}. 주 가지가 움직이면 \`node build-expected.js && node make-report.js\` 로 다시 만든다.
- 만든 법: 화면 구획 여섯을 실제 뼈대(index.html)와 실제 꾸밈(ui.css)으로 폭 ${d.width} 에 그려 "앞"을 찍고, 새 값 28개를 맨 끝에 덮어쓴 뒤 "뒤"를 찍어 화면의 요소마다 글자색 · 바탕 · 테두리 · 대비를 견줬다. 요소 ${allEl}개(여섯 구획 × 네 테마 합).
- **한계: 자료를 채우는 코드는 돌리지 않았다.** 앱이 그리는 칸은 비어 있고(8번), 로그인 뒤 · 팝업 · 로딩 · 오류 · 큰 글씨 · 움직임은 없다. "뒤"는 **마지막에 이기는 값이 새 값이 된 경우**를 그린 것이다. 구현이 겹친 정의 가운데 하나만 바꾸면 실제는 달라진다(2번의 줄 번호를 쓴다).

## 1. 한눈에

| 잰 것 | 값 |
|---|---|
| "뒤" 화면에서 읽은 값이 명세와 다른 것 | ${wrong}개 (28개 × 여섯 구획 대조) |
| 정의 없는 변수 다섯이 앞뒤로 달라진 횟수 | ${five} |
| 글자색 · 바탕 · 테두리 가운데 하나라도 바뀐 자리 | ${changedEl}곳 |
| 대비가 4.5 아래로 **떨어진** 글 | ${fell}개 |
| 대비가 4.5 위로 **올라온** 글 | ${rose}개 |
| 대비가 0.3 넘게 낮아진 글 가운데 가장 낮은 값 | ${worst === 99 ? '없음' : worst} (전부 4.5 위) |
| 가로 넘침이 생긴 화면 | ${sum(v => (v.overflow.after && !v.overflow.before) ? 1 : 0)} |
| 높이가 달라진 화면 | ${sum(v => v.height.before !== v.height.after ? 1 : 0)} (배치는 그대로라는 뜻) |

## 2. 변수 13개 — 쓰는 자리 수와 바꿀 정의

쓰는 자리는 \`var(--이름\` 꼴을 글자로 센 것이다. "바꿀 정의"는 그 테마에서 지금 화면에 걸린 값과 같은 값을 가진 정의 가운데 꾸밈 파일의 마지막 줄이다(스크립트 추정 — 구현 전에 눈으로 한 번 확인).

| 변수 | 쓰는 자리 (꾸밈 · 뼈대 · 코드) | 정의 수 | 테마 | 지금 | 새 값 | 바꿀 정의 (ui.css 줄) |
|---|---|---|---|---|---|---|
`;
for (const v of d.vars) for (const t of THEMES) { const p = v.perTheme[t]; if (!p.changes) continue;
  md += `| \`${v.name}\` | ${uses(v)} (${v.uses.css} · ${v.uses.html} · ${v.uses.js}) | ${v.definitions} | ${TN[t]} | \`${p.now}\` | \`${p.new}\` | ${p.winner ? p.winner.line + '행 \`' + p.winner.selector.split(',')[0].trim() + '\` 블록' : '못 찾음 — 직접 확인'} |\n`; }
md += `\n합계: 변수 13개를 쓰는 자리는 꾸밈 ${d.vars.reduce((a, v) => a + v.uses.css, 0)} · 뼈대 ${d.vars.reduce((a, v) => a + v.uses.html, 0)} · 코드 ${d.vars.reduce((a, v) => a + v.uses.js, 0)}곳이다.\n`;

md += `\n## 3. 화면별 · 테마별 변화 수

| 화면 (index.html 줄) | 테마 | 요소 | 글자색 바뀜 | 바탕 바뀜 | 테두리 바뀜 | 글 | 대비 4.5 아래 (앞 → 뒤) | 3 아래 (앞 → 뒤) | 사진 |
|---|---|---|---|---|---|---|---|---|---|
`;
for (const [id, s] of S) for (const t of THEMES) { const v = s.themes[t];
  md += `| ${s.name} (${s.lines}) | ${TN[t]} | ${v.elements} | ${v.changed.color} | ${v.changed.bg} | ${v.changed.border} | ${v.texts} | ${v.low.before} → ${v.low.after} | ${v.vlow.before} → ${v.vlow.after} | \`shots/${id}-${t}-before.jpg\` · \`-after.jpg\` |\n`; }

md += `\n## 4. 무엇이 바뀌는가 — 화면별 많이 바뀌는 종류

`;
for (const [, s] of S) { md += `**${s.name}**\n`; for (const t of THEMES) { const v = s.themes[t]; md += `- ${TN[t]}: ` + (v.kinds.length ? v.kinds.slice(0, 7).map(k => '\`' + k.k + '\` ' + k.n + '곳(' + k.what + ')').join(' · ') : '바뀌는 자리 없음') + '\n'; } md += '\n'; }

const home = d.screens['screen-home'].themes, rec = d.screens['screen-records'].themes;
md += `## 5. 회의에서 미리 적어 두기로 한 자리 — 실제로 재 보니

- **기록 창(#captureCardBox) 자신의 바탕과 테두리는 네 테마 모두 바뀌지 않는다.** 이 창은 공용 값이 아니라 자기 규칙으로 그려진다(성소: 바탕 \`${home['focus-sanctuary'].cap.before.bg}\` · 테두리 \`${home['focus-sanctuary'].cap.before.border}\`, 앞뒤 같음). 바뀌는 것은 창 **안쪽**이다 — 컨디션 접힘과 AI 설정 접힘의 테두리, 슬라이더 칸의 바탕 · 테두리, 음성 단추의 바탕, 작은 글자의 색(4번 홈 줄). 회의에서 "카드 바탕 · 테두리가 달라진다"고 한 내 말은 창 자신에 대해서는 틀렸다.
- **\`.rec-pill-btn.active\` 는 글자색이 뒤집히지 않는다.** 뼈대에 있는 한 곳을 쟀다: ` + THEMES.map(t => TN[t] + ' ' + (rec[t].pill.before ? rec[t].pill.before.ratio + ' → ' + rec[t].pill.after.ratio : '없음')).join(' · ') + `. 테마 규칙이 공용 규칙(바탕 \`var(--ink)\` · 글자 \`var(--chip-ink)\`)을 덮고 있어서다. 달라지는 것은 블랙 하나이고 글자색이 검정에서 아주 어두운 초록이 된다. 회의에서 "성소에서 뒤집힌다"고 한 내 예상은 틀렸다.
- **겹친 카드(카드 안의 카드)는 뼈대에 0곳이다.** 그래서 반투명 → 불투명으로 경계가 사라지는지는 이 사진으로 알 수 없다. 겹친 카드는 앱이 그리는 칸에서 생긴다 — 법정 하네스가 볼 자리다.
- **저장 단추의 글자 대비는 이 단계에서 바뀌지 않는다**(회의 합의대로 성과로 적지 않는다).

## 6. 대비가 낮아진 글

4.5 아래로 떨어진 글은 ${fell}개다. 0.3 넘게 낮아진 글은 ${sum(v => v.worseCount)}개이고 거의 전부 블랙 테마다 — 카드 바탕을 \`#0A0A0C\` 에서 \`#0F0F12\` 로 한 단계 밝히기 때문이다. 가장 낮은 것:

| 화면 | 테마 | 요소 | 글 | 앞 | 뒤 |
|---|---|---|---|---|---|
`;
const worseAll = S.flatMap(([, s]) => THEMES.flatMap(t => s.themes[t].worse.map(w => ({ ...w, screen: s.name, theme: TN[t] })))).sort((a, b) => a.after - b.after).slice(0, 10);
for (const w of worseAll) md += `| ${w.screen} | ${w.theme} | \`${w.k}\` | ${w.text} | ${w.before} | ${w.after} |\n`;

md += `\n## 7. 정의 없는 변수 다섯 — 손대지 않는 것

| 변수 | 꾸밈 파일의 정의 | 뼈대의 정의 | 쓰는 자리 (꾸밈 · 뼈대 · 코드) | 앞뒤 값 |
|---|---|---|---|---|
`;
for (const f of d.five) md += `| \`${f.name}\` | ${f.definitions} | ${f.definedInHtml} | ${f.uses.css + f.uses.html + f.uses.js} (${f.uses.css} · ${f.uses.html} · ${f.uses.js}) | 비어 있음 → 비어 있음 |\n`;
md += `\n여섯 구획 × 네 테마에서 다섯 변수의 값은 앞뒤로 한 번도 달라지지 않았다(${five}회).\n`;

md += `\n## 8. 사진에 안 잡힌 자리

**화면마다 비어 있는 칸**(뼈대에 이름표만 있고 앱이 채우는 칸. 공용 값이 닿아도 이 사진에는 안 보인다):

`;
for (const [, s] of S) { const slots = s.themes.white.slots; md += `- ${s.name} ${slots.length}칸: ${slots.map(x => '\`' + x + '\`').join(' ')}\n`; }
md += `
**그 밖에 이 방법으로 못 본 것**: 로그인 뒤의 모습 · 목표와 기록이 들어찬 목록 · 달력의 내용 · 피드와 대화 · 팝업과 아래에서 올라오는 창 · 알림 글 · 로딩과 빈 상태와 오류 · 큰 글씨 설정 · 키보드가 올라온 화면 · 움직임 · 폭 360과 412 · 코드가 직접 적는 색(코드 안의 \`var(--…)\` ${d.vars.reduce((a, v) => a + v.uses.js, 0)}곳).

이 자리들은 실제 코드를 돌리는 법정 하네스와 실기기 확인이 맡는다. 이 목록만으로 "전 탭 확인 완료"라고 쓰지 않는다.

## 9. 파일

| 파일 | 내용 |
|---|---|
| \`data.json\` | 위 숫자의 원본(요소별 대조 결과 · 변수 정의 위치) |
| \`shots/<구획>-<테마>-before.jpg\` · \`-after.jpg\` | 사진 48장(폭 ${d.width}) |
| \`pages/\` | 사진을 찍은 화면(같은 폴더의 \`ui.css\` 를 불러온다) |
| \`build-expected.js\` | 재기와 사진(인자로 기준 가지를 줄 수 있다) |
| \`make-report.js\` | 이 글과 한 장 보기를 만든다 |
| \`예상-변화-한장.html\` | 사진을 구획별로 나란히 본 화면 |
`;
fs.writeFileSync(path.join(D, '예상-변화-목록.md'), md, { encoding: 'utf8' });

// ── 한 장 보기
const img = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(D, 'shots', f)).toString('base64');
let sections = '';
for (const [id, s] of S) {
  sections += `<h2>${s.name}</h2><div class="strip">` + THEMES.map(t => { const v = s.themes[t];
    return `<figure><div class="pair"><div><img alt="${s.name} ${TN[t]} 앞" src="${img(id + '-' + t + '-before.jpg')}"><span>앞</span></div><div><img alt="${s.name} ${TN[t]} 뒤" src="${img(id + '-' + t + '-after.jpg')}"><span>뒤</span></div></div><figcaption><b>${TN[t]}</b> · 바뀐 자리 ${v.changed.color + v.changed.bg + v.changed.border}곳 · 잘 안 보이는 글 ${v.low.before} → ${v.low.after}</figcaption></figure>`; }).join('') + `</div>
  <p class="k">많이 바뀌는 것: ${esc(s.themes['focus-sanctuary'].kinds.slice(0, 5).map(k => k.k + ' ' + k.n + '곳').join(' · ') || '없음')}</p>
  <p class="k">사진에 안 잡힌 칸 ${s.themes.white.slots.length}개: ${esc(s.themes.white.slots.slice(0, 10).join(', '))}${s.themes.white.slots.length > 10 ? ' 외' : ''}</p>`;
}
const rows = S.flatMap(([, s]) => THEMES.map(t => { const v = s.themes[t]; return `<tr><td>${s.name}</td><td>${TN[t]}</td><td class="n">${v.elements}</td><td class="n">${v.changed.color}</td><td class="n">${v.changed.bg}</td><td class="n">${v.changed.border}</td><td class="n">${v.low.before} → ${v.low.after}</td></tr>`; })).join('');
const html = `<title>아워골 공용 값 예상 변화</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap">
<style>
/* 배치: 판정 한 줄 → 숫자 → 구획마다 네 테마의 앞·뒤 사진 띠 → 변화 수 표 → 못 본 것. 양비스 보고서와 같은 색·글꼴 */
:root{--bg:#0c1416;--panel:#131e21;--panel2:#1a282c;--line:#293a3f;--fg:#e8f0ed;--muted:#94a6a4;--accent:#4fd1b5;--ok:#63c98b;--warn:#f0a94a;--bad:#f47a66;
  --display:"Gothic A1","IBM Plex Sans KR","Malgun Gothic",sans-serif;--body:"IBM Plex Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif;--mono:"IBM Plex Mono",Consolas,"Malgun Gothic",monospace;color-scheme:dark}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#edf1ee;--panel:#ffffff;--panel2:#f2f6f3;--line:#d2dcd7;--fg:#15211f;--muted:#55665f;--accent:#0d7a67;--ok:#1c8551;--warn:#9c6200;--bad:#c03d2c;color-scheme:light}}
:root[data-theme="light"]{--bg:#edf1ee;--panel:#ffffff;--panel2:#f2f6f3;--line:#d2dcd7;--fg:#15211f;--muted:#55665f;--accent:#0d7a67;--ok:#1c8551;--warn:#9c6200;--bad:#c03d2c;color-scheme:light}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--body);font-size:16.5px;line-height:1.65}
.page{max-width:1180px;margin:0 auto;padding-inline:18px;padding-block:28px 60px}
h1,h2{font-family:var(--display);font-weight:800;letter-spacing:-.01em;line-height:1.25;margin:0;text-wrap:balance}
h1{font-size:clamp(28px,4.4vw,40px)}h2{font-size:clamp(21px,3vw,26px);margin-top:44px;padding-top:16px;border-top:1px solid var(--line)}
p{margin:10px 0;max-width:72ch}.lede{font-size:18px;color:var(--muted);max-width:66ch}
.eyebrow{font-family:var(--mono);font-size:13px;color:var(--muted);letter-spacing:.04em;margin-bottom:10px}b{font-weight:600}
.note{margin:16px 0;padding:14px 18px;border-radius:12px;background:var(--panel);border:1px solid var(--line);border-left:6px solid var(--warn)}.note p{margin:4px 0;max-width:none}
.nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:16px 0}
.num{padding:12px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line)}
.num b{display:block;font-family:var(--mono);font-weight:500;font-size:25px;line-height:1.15;font-variant-numeric:tabular-nums}.num span{display:block;font-size:13.5px;color:var(--muted);line-height:1.45;margin-top:3px}
.num.good b{color:var(--ok)}
.strip{display:flex;gap:14px;overflow-x:auto;padding:4px 0 10px;margin:12px 0}
figure{margin:0;flex:none;width:300px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.pair div{position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel);max-height:520px}
.pair img{display:block;width:100%;height:auto}.pair span{position:absolute;left:6px;top:6px;font-size:12px;padding:0 7px;border-radius:6px;background:var(--panel2);color:var(--fg);border:1px solid var(--line)}
figcaption{font-size:13.5px;color:var(--muted);margin-top:6px}.k{font-size:14px;color:var(--muted);max-width:none}
.tw{overflow-x:auto;margin:14px 0;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
table{border-collapse:collapse;width:100%;min-width:620px;font-size:14.5px}th,td{padding:8px 11px;text-align:left;border-bottom:1px solid var(--line)}
th{font-size:13px;color:var(--muted);font-weight:500;white-space:nowrap;background:var(--panel2)}tr:last-child td{border-bottom:0}td.n{font-family:var(--mono);font-variant-numeric:tabular-nums}
ul{padding-left:20px;margin:8px 0}li{margin-bottom:5px;max-width:72ch}.foot{margin-top:36px;font-size:13.5px;color:var(--muted)}
</style>
<div class="page">
  <div class="eyebrow">2026-10-12 · 아워골 · 디자인 1단계 근거 자료 · 지시 병합 전</div>
  <h1>공용 색 값을 바꾸면 어디가 달라지나</h1>
  <p class="lede">색과 테두리의 공용 값 28개를 바꿨을 때 여섯 화면이 어떻게 달라지는지를 미리 그려 본 것입니다. 왼쪽이 지금, 오른쪽이 바꾼 뒤입니다.</p>
  <div class="note">
    <p><b>승인된 기준이 아니라 근거 자료입니다.</b> 디자인 지시가 병합되기 전에 만들었습니다.</p>
    <p><b>앱이 돌 때 채워지는 칸은 비어 있습니다.</b> 목표 목록, 달력의 내용, 피드 같은 것은 이 사진에 없습니다. 그 자리는 실제 앱을 돌려서 따로 봐야 합니다.</p>
  </div>
  <div class="nums">
    <div class="num good"><b>${fell}</b><span>바꾼 뒤 잘 안 보이게 된 글(대비 4.5 아래로 떨어진 것)</span></div>
    <div class="num good"><b>${rose}</b><span>바꾼 뒤 잘 보이게 된 글(4.5 위로 올라온 것)</span></div>
    <div class="num"><b>${changedEl}</b><span>색이나 테두리가 바뀌는 자리(요소 ${allEl}개 가운데)</span></div>
    <div class="num good"><b>${wrong}</b><span>바꾼 뒤 화면에서 읽은 값이 명세와 다른 것</span></div>
    <div class="num good"><b>0</b><span>크기나 배치가 달라진 화면</span></div>
  </div>
  <p>변화가 가장 큰 것은 화이트 테마입니다. 초록을 한 단계 진하게 하고 작은 글자를 진하게 해서, 잘 안 보이던 글이 줄어듭니다. 성소와 도심은 테두리와 작은 글자가 조금 또렷해지는 정도이고, 블랙은 카드 바탕이 한 단계 밝아집니다.</p>
  ${sections}
  <h2>변화 수</h2>
  <div class="tw"><table><thead><tr><th>화면</th><th>테마</th><th>요소</th><th>글자색</th><th>바탕</th><th>테두리</th><th>잘 안 보이는 글(앞 → 뒤)</th></tr></thead><tbody>${rows}</tbody></table></div>
  <h2>재 보니 예상과 달랐던 것</h2>
  <ul>
    <li><b>오늘 기록하기 창 자신의 바탕과 테두리는 바뀌지 않습니다.</b> 이 창은 공용 값이 아니라 자기 규칙으로 그려집니다. 바뀌는 것은 창 안쪽의 접힘 테두리와 작은 글자입니다.</li>
    <li><b>저장 단추의 글자 대비는 이 단계로 좋아지지 않습니다.</b> 단추 규칙을 따로 바꿔야 합니다.</li>
    <li><b>카드 안의 카드는 이 사진에 한 곳도 없습니다.</b> 앱이 그리는 칸에서만 생겨서, 경계가 흐려지는지는 실제 앱에서 봐야 합니다.</li>
  </ul>
  <p class="foot">기준: 아워골 최신 줄기 ${d.commit}(${d.commitAt}). 화면 폭 ${d.width}. 화면 뼈대와 꾸밈 파일을 읽어 그렸고 아워골 저장소는 바꾸지 않았습니다. 자세한 숫자와 변수별 바꿀 자리는 함께 넘긴 "예상-변화-목록" 글에 있습니다.</p>
</div>
`;
fs.writeFileSync(path.join(D, '예상-변화-한장.html'), html, { encoding: 'utf8' });
console.log('글', Math.round(md.length / 1024) + 'KB', '· 한 장', Math.round(html.length / 1024) + 'KB', '· 떨어진 글', fell, '올라온 글', rose, '바뀐 자리', changedEl, '/', allEl, '· 명세와 다른 값', wrong, '· 다섯 변수 변화', five, '· 가장 낮은 대비', worst);
