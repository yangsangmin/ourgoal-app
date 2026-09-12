'use strict';
/* 페르소나 20명 UI/UX 평가 v2: 같은 루브릭(5항목×0~2점=10점)을 7개 앱에 동일 적용.
 * 아워골 = 실제 렌더링 스크린샷(라이트 9 + 다크 3) + 화면에 안 보이는 상호작용 사양표. 6사 = 페르소나가 아는 현행 앱.
 * 엔진: 커맨드센터 Gemini 키. 사용: node eval-personas-v2.js <shotsDir> <outJson>  (env DARK_DIR=다크 스크린샷 폴더)
 */
const fs = require('fs'), path = require('path'), https = require('https');
require('C:/dev/command-center/lib/env').loadEnv();
const KEY = (process.env.GEMINI_API_KEY || '').trim();
if (!KEY) { console.error('GEMINI_API_KEY 없음'); process.exit(1); }
const shotsDir = path.resolve(process.argv[2]);
const outFile = path.resolve(process.argv[3] || 'eval.json');
const DARK_DIR = process.env.DARK_DIR || '';
const SHOTS = ['00-landing', '10-home', '1x-goals', '1x-calendar', '1x-records', '1x-comm', '1x-settings', '20-modal-newgoal', '21-modal-record'];
const DARK_SHOTS = ['10-home', '1x-comm', '1x-settings'];
const APPS = ['당근', '토스', '네이버', '다방', '스타벅스', '숨고'];
const personas = require('C:/dev/command-center/sim/uiux_personas.json');
const byDomain = {};
for (const p of personas) { const k = p.uiuxDomain && p.uiuxDomain.category; if (k && !byDomain[k]) byDomain[k] = p; }
const PANEL = Object.values(byDomain).slice(0, 20);

function gemini(parts, model) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.3, maxOutputTokens: 3000, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 1024 } } });
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + KEY);
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 120000 }, (res) => {
      let body = ''; res.on('data', (c) => body += c); res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error('HTTP ' + res.statusCode + ' ' + body.slice(0, 200)));
        try { const j = JSON.parse(body); const parts = (j.candidates[0].content.parts || []).filter(p => !p.thought && typeof p.text === 'string'); resolve(parts.map(p => p.text).join('')); } catch (e) { reject(e); }
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
  if (DARK_DIR) for (const d of DARK_SHOTS) {
    const f = path.join(DARK_DIR, d + '.png'); if (!fs.existsSync(f)) continue;
    parts.push({ text: '[아워골 화면(다크 테마): ' + d + ']' });
    parts.push({ inline_data: { mime_type: 'image/png', data: fs.readFileSync(f).toString('base64') } });
  }
  return parts;
}
const RUBRIC = `과제: 7개 앱의 UI/UX를 **같은 루브릭 5항목(각 0~2점, 합계 10점)**으로 채점합니다. 기능의 유무·많고 적음, 브랜드 명성·규모는 채점하지 않습니다.
① 색·표면 절제: 단일 강조색, 중립 표면, 그라디언트·블롭·글래스 남발 없음
② 타이포 위계·리듬: 3~4단 크기, 굵기 대비, 행간·자간이 정돈됨
③ 간격·정렬·그리드: 좌우 여백 일관, 8pt 리듬, 요소 정렬이 흐트러지지 않음
④ 컴포넌트 완성도: 버튼·칩·입력·바텀시트·탭바가 플랫폼 관례(iOS/Android·토스·당근류)를 따르고 마감이 깔끔함
⑤ 전문 제작 인상: 아마추어·AI 생성 흔적(이모지 아이콘, 원색 남발, 900 굵기, 장식 그림자) 없이 상용 서비스로 보임
- 아워골: 첨부된 스크린샷만 보고 채점합니다. 화면에 안 보이는 사실은 다음 사양표를 참고하고 "없다"고 감점하지 마세요: 테마 8종(다크·OLED 포함), 글자 크기 4단, 고대비 모드, 눌림 scale .985 + 햅틱, 바텀시트 260ms 스프링, 당겨서 새로고침, 기록 카드 스와이프 삭제, 백투탑, 44px 터치 타겟 규격, 포커스 링, 스켈레톤 로딩, 기록 탭 잔디 히트맵·주간 차트, 인스타 스토리 공유 카드.
- ${APPS.join(', ')}: 당신이 아는 2025~2026년 현행 앱의 대표 화면(홈·리스트·상세·설정)을 같은 루브릭으로 채점합니다.
같은 기준을 7개 앱 모두에 엄격히 적용하고 어느 쪽에도 편향하지 마세요. 항목 점수마다 근거가 있어야 합니다.`;

async function main() {
  const images = imgParts();
  const prev = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')).results.filter(r => r.scores) : [];
  const done = new Set(prev.map(r => r.persona));
  const results = prev.slice();
  for (const p of PANEL) {
    if (done.has(p.name)) continue;
    const prompt = `당신은 다음 페르소나가 되어 모바일 앱 UI/UX를 평가합니다.
이름: ${p.name}, ${p.age}세 ${p.gender}, 직업: ${p.job}, MBTI: ${p.mbti}, 기기: ${p.device || '스마트폰'}
전문 관점: ${p.uiuxDomain.name} — ${p.uiuxDomain.focus}

${RUBRIC}
JSON만 출력: {"persona":"${p.name}","rubric":{"아워골":[a,b,c,d,e],"당근":[a,b,c,d,e],"토스":[a,b,c,d,e],"네이버":[a,b,c,d,e],"다방":[a,b,c,d,e],"스타벅스":[a,b,c,d,e],"숨고":[a,b,c,d,e]},"scores":{"아워골":합계,"당근":합계,"토스":합계,"네이버":합계,"다방":합계,"스타벅스":합계,"숨고":합계},"ourgoal_comment":"아워골 강점 1개와 약점 1개, 한국어 2문장","ai_made_feel":1~5(1=AI가 만든 느낌 전혀 없음)}`;
    const parts = [{ text: prompt }, ...images];
    try {
      let j = null, model = null;
      for (let k = 0; k < 3 && !j; k++) {
        const r = await callWithFallback(parts); model = r.model;
        try { j = JSON.parse(r.text); } catch (e) { const m = r.text.match(/\{[\s\S]*\}/); try { j = m ? JSON.parse(m[0]) : null; } catch (e2) { j = null; } if (!j) console.log(p.name, 'parse retry', k + 1); }
      }
      if (!j || !j.scores) throw new Error('JSON 파싱 실패 3회');
      if (j.rubric) for (const a of Object.keys(j.rubric)) { const arr = j.rubric[a]; if (Array.isArray(arr) && arr.length === 5) j.scores[a] = arr.reduce((x, y) => x + Number(y || 0), 0); }
      j._model = model; j._domain = p.uiuxDomain.category;
      results.push(j);
      console.log(p.name, JSON.stringify(j.scores), 'ai', j.ai_made_feel);
    } catch (e) {
      results.push({ persona: p.name, error: String(e.message).slice(0, 120), _domain: p.uiuxDomain.category });
      console.log(p.name, 'ERROR', e.message.slice(0, 100));
    }
    await new Promise(r => setTimeout(r, 500));
  }
  const ok = results.filter(r => r.scores);
  const avg = (app) => ok.reduce((a, r) => a + Number(r.scores[app] || 0), 0) / (ok.length || 1);
  const summary = { n: ok.length, ourgoal: avg('아워골'), apps: {}, refAvg: 0, aiMadeFeel: ok.reduce((a, r) => a + Number(r.ai_made_feel || 0), 0) / (ok.length || 1) };
  for (const a of APPS) summary.apps[a] = avg(a);
  summary.refAvg = APPS.reduce((a, x) => a + summary.apps[x], 0) / APPS.length;
  summary.pass = summary.ourgoal > summary.refAvg;
  fs.writeFileSync(outFile, JSON.stringify({ shotsDir, darkDir: DARK_DIR, method: 'rubric-v2', summary, results }, null, 2), 'utf8');
  console.log(JSON.stringify(summary));
}
main().catch(e => { console.error(e); process.exit(1); });
