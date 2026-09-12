'use strict';
/* 페르소나 20명 UI/UX 평가: 아워골(스크린샷 실물) vs 당근·토스·네이버·다방·스타벅스·숨고(페르소나가 아는 현행 앱)
 * 엔진: 커맨드센터가 쓰는 Gemini(sim/persona-ai-brain.js와 동일 키). 기능 제외, UI/UX만 1~10점.
 * 사용: node eval-personas.js <shotsDir> <outJson>
 */
const fs = require('fs'), path = require('path'), https = require('https');
require('C:/dev/command-center/lib/env').loadEnv();
const KEY = (process.env.GEMINI_API_KEY || '').trim();
if (!KEY) { console.error('GEMINI_API_KEY 없음'); process.exit(1); }
const shotsDir = path.resolve(process.argv[2]);
const outFile = path.resolve(process.argv[3] || 'eval.json');
const SHOTS = ['00-landing', '10-home', '1x-goals', '1x-calendar', '1x-records', '1x-comm', '1x-settings', '20-modal-newgoal'];
const APPS = ['당근', '토스', '네이버', '다방', '스타벅스', '숨고'];
const personas = require('C:/dev/command-center/sim/uiux_personas.json');
const byDomain = {};
for (const p of personas) { const k = p.uiuxDomain && p.uiuxDomain.category; if (k && !byDomain[k]) byDomain[k] = p; }
const PANEL = Object.values(byDomain).slice(0, 20);

function gemini(parts, model) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.4, maxOutputTokens: 1200, responseMimeType: 'application/json' } });
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + KEY);
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 60000 }, (res) => {
      let body = ''; res.on('data', (c) => body += c); res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error('HTTP ' + res.statusCode + ' ' + body.slice(0, 200)));
        try { const j = JSON.parse(body); resolve(j.candidates[0].content.parts[0].text); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(payload); req.end();
  });
}
async function callWithFallback(parts) {
  const models = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let last;
  for (const m of models) { for (let i = 0; i < 2; i++) { try { return { text: await gemini(parts, m), model: m }; } catch (e) { last = e; await new Promise(r => setTimeout(r, 1500)); } } }
  throw last;
}
function imgParts() {
  const parts = [];
  for (const s of SHOTS) {
    const f = path.join(shotsDir, s + '.png'); if (!fs.existsSync(f)) continue;
    parts.push({ text: '[아워골 화면: ' + s + ']' });
    parts.push({ inline_data: { mime_type: 'image/png', data: fs.readFileSync(f).toString('base64') } });
  }
  return parts;
}
async function main() {
  const images = imgParts();
  const results = [];
  for (const p of PANEL) {
    const prompt = `당신은 다음 페르소나가 되어 모바일 앱 UI/UX를 평가합니다.
이름: ${p.name}, ${p.age}세 ${p.gender}, 직업: ${p.job}, MBTI: ${p.mbti}, 기기: ${p.device || '스마트폰'}
전문 관점: ${p.uiuxDomain.name} — ${p.uiuxDomain.focus}
평가 지시: ${p.uiuxDomain.testDirective}

과제: 7개 앱의 UI/UX(기능은 제외, 시각 디자인·레이아웃·타이포·색·내비게이션·컴포넌트 완성도·일관성·"전문 회사가 만든 느낌"만)를 1~10점으로 채점합니다.
- 아워골: 첨부된 스크린샷(현재 버전)만 보고 채점합니다.
- ${APPS.join(', ')}: 당신이 아는 2025~2026년 현행 iOS/Android 앱의 UI/UX를 기준으로 채점합니다.
채점 기준은 모든 앱에 동일하게 엄격히 적용하세요. 아워골에 유리하거나 불리하게 편향하지 마세요. 10점 = 업계 최고 수준, 7점 = 대기업 앱 평균, 4점 이하 = 아마추어/AI 생성 티가 남.
JSON만 출력: {"persona":"이름","scores":{"아워골":n,"당근":n,"토스":n,"네이버":n,"다방":n,"스타벅스":n,"숨고":n},"ourgoal_comment":"아워골 강점 1개와 약점 1개, 한국어 2문장","ai_made_feel":"아워골이 AI가 만든 느낌인지 1~5(1=전혀 아님)"}`;
    const parts = [{ text: prompt }, ...images];
    try {
      const { text, model } = await callWithFallback(parts);
      const j = JSON.parse(text);
      j._model = model; j._domain = p.uiuxDomain.category;
      results.push(j);
      console.log(p.name, JSON.stringify(j.scores), 'ai', j.ai_made_feel);
    } catch (e) {
      results.push({ persona: p.name, error: String(e.message).slice(0, 120), _domain: p.uiuxDomain.category });
      console.log(p.name, 'ERROR', e.message.slice(0, 100));
    }
    await new Promise(r => setTimeout(r, 800));
  }
  const ok = results.filter(r => r.scores);
  const avg = (app) => ok.reduce((a, r) => a + Number(r.scores[app] || 0), 0) / (ok.length || 1);
  const summary = { n: ok.length, ourgoal: avg('아워골'), apps: {}, refAvg: 0, aiMadeFeel: ok.reduce((a, r) => a + Number(r.ai_made_feel || 0), 0) / (ok.length || 1) };
  for (const a of APPS) summary.apps[a] = avg(a);
  summary.refAvg = APPS.reduce((a, x) => a + summary.apps[x], 0) / APPS.length;
  summary.pass = summary.ourgoal > summary.refAvg;
  fs.writeFileSync(outFile, JSON.stringify({ shotsDir, summary, results }, null, 2), 'utf8');
  console.log(JSON.stringify(summary));
}
main().catch(e => { console.error(e); process.exit(1); });
