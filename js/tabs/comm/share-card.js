/**
 * OurGoal Share Card (소통 탭 — 플랫폼 맞춤 공유 카드 그리기)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G155.
 *   옮긴 선언(이전 전 줄): SHARE_PLATFORMS(30545~30554) · SHARE_CANVAS_DIMS(30555~30560) · SHARE_DOMAIN(30561~30562) · drawShareWatermark(30581~30598) · buildInviteLinkSuffix(30599~30599) · scRoundRect(30600~30608) · scWrapLines(30609~30629) · scDrawLines(30630~30633) · generateShareImage(30634~30739) · buildShareText(30740~30753)
 * SHARE_PLATFORMS·SHARE_CANVAS_DIMS·SHARE_DOMAIN = 플랫폼별 크기·주소, drawShareWatermark·scRoundRect·scWrapLines·scDrawLines·generateShareImage = 공유 카드 캔버스,
 * buildInviteLinkSuffix·buildShareText = 초대 링크 꼬리·공유 글. shareContent(같은 줄에 window 노출)는 index.html 에 남았다.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* [#TASK-ES-379] renderCommScreen → js/tabs/comm/render.js 로 옮김(소통 탭 세포 1차) */

  /* ============ 플랫폼 맞춤 공유 카드 ============ */
  var SHARE_PLATFORMS = {
    kakao:   { label:'카카오톡',   badgeChar:'카', emoji:'💬', bg:'#FEE500', text:'#3A1D1D', ratios:[{key:'wide',     label:'1.91:1', ratio:'1.91/1'}] },
    insta:   { label:'인스타그램', badgeChar:'인', emoji:'📷', bg:'linear-gradient(135deg,#C13584,#F77737)', text:'#fff', ratios:[{key:'square',label:'1:1', ratio:'1/1'},{key:'portrait',label:'3:4', ratio:'3/4'}] },
    tiktok:  { label:'틱톡',       badgeChar:'틱', emoji:'🎵', bg:'#111', text:'#fff', ratios:[{key:'vertical', label:'9:16',   ratio:'9/16'}] },
    threads: { label:'쓰레드',     badgeChar:'쓰', emoji:'🧵', bg:'#2b2b2b', text:'#fff', ratios:[{key:'square',  label:'1:1',    ratio:'1/1'}] }
  };

  var SHARE_CANVAS_DIMS = {
    kakao:   { wide:     {w:800, h:419} },
    insta:   { square:   {w:720, h:720}, portrait:{w:720, h:960} },
    tiktok:  { vertical: {w:720, h:1280} },
    threads: { square:   {w:720, h:720} }
  };

  /* 실제 배포 도메인(접속 환경에 맞춰 동적 감지, 커스텀 도메인 및 로컬/Vercel 자동 호환) */
  var SHARE_DOMAIN = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://ourgoal-app.vercel.app';

  /* 워터마크: 모든 공유 카드(플랫폼별 공유 카드·완주 인증서·위클리 리캡)가 공통으로 호출 */
  function drawShareWatermark(ctx, dims, userId, textColor){
    var pad = Math.round(dims.w*0.045);
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = textColor || '#fff';
    ctx.textAlign = 'right';
    ctx.globalAlpha = 0.75;
    ctx.font = '800 ' + Math.round(dims.w*0.026) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText('아워골', dims.w-pad, dims.h-pad*1.6);
    ctx.font = '500 ' + Math.round(dims.w*0.02) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText(SHARE_DOMAIN.replace(/^https?:\/\//,'')+'/share/'+userId, dims.w-pad, dims.h-pad*0.9);
    ctx.textAlign = 'center';
    ctx.font = '500 ' + Math.round(dims.w*0.022) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText('나만의 목표 달성 메이트 · 아워골', dims.w/2, dims.h-pad*0.35);
    ctx.restore();
  }

  function buildInviteLinkSuffix(goalId, goalTitle){ var origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : SHARE_DOMAIN; return goalId ? ('\r\n\r\n' + origin + '/share?type=goal&id=' + encodeURIComponent(goalId) + (goalTitle ? '&title=' + encodeURIComponent(goalTitle) : '')) : ('\r\n\r\n' + origin + '/share?type=app&ref=' + encodeURIComponent((L.state.profile && L.state.profile.id) || '')); }

  function scRoundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  function scWrapLines(ctx, text, maxWidth, maxLines){
    var chars = String(text).split('');
    var lines = [], line = '';
    for(var i=0;i<chars.length;i++){
      var test = line + chars[i];
      if(ctx.measureText(test).width > maxWidth && line){
        lines.push(line);
        line = chars[i];
        if(maxLines && lines.length>=maxLines) break;
      } else {
        line = test;
      }
    }
    if(maxLines && lines.length>=maxLines){
      lines = lines.slice(0, maxLines);
      lines[maxLines-1] = lines[maxLines-1].replace(/.$/, '…');
    } else if(line){
      lines.push(line);
    }
    return lines;
  }

  function scDrawLines(ctx, lines, x, y, lineHeight){
    lines.forEach(function(l, i){ ctx.fillText(l, x, y + i*lineHeight); });
    return y + lines.length*lineHeight;
  }

  /* 선택된 목표·플랫폼 정보를 바탕으로 실제 공유될 이미지를 캔버스로 그려낸다 */
  async function generateShareImage(pkey, g, pct, sel, days){
    if(document.fonts && document.fonts.ready){ try{ await document.fonts.ready; } catch(e){} }
    var p = SHARE_PLATFORMS[pkey];
    var comp = L.state.shareComposer;
    var ratioKey = comp.ratio[pkey] || p.ratios[0].key;
    var dims = (SHARE_CANVAS_DIMS[pkey] && SHARE_CANVAS_DIMS[pkey][ratioKey]) || SHARE_CANVAS_DIMS[pkey][Object.keys(SHARE_CANVAS_DIMS[pkey])[0]];
    var canvas = document.createElement('canvas');
    canvas.width = dims.w; canvas.height = dims.h;
    var ctx = canvas.getContext('2d');

    if(pkey==='insta'){
      var grad = ctx.createLinearGradient(0,0,dims.w,dims.h);
      grad.addColorStop(0,'#C13584'); grad.addColorStop(1,'#F77737');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = p.bg==='#111' ? '#111111' : (p.bg.indexOf('gradient')!==-1 ? '#2b2b2b' : p.bg);
    }
    ctx.fillRect(0,0,dims.w,dims.h);

    var textColor = p.text;
    var pad = Math.round(dims.w*0.075);
    var innerW = dims.w - pad*2;
    var watermarkH = dims.w*0.1; // 하단 워터마크(drawShareWatermark)가 차지할 여백
    var isVertical = pkey==='tiktok' || (pkey==='insta' && ratioKey==='portrait');
    var topExtra = isVertical ? dims.h*0.05 : 0; // 세로형 카드는 위아래 여백을 넉넉히 둬 스티커 공간 확보
    var y = pad + dims.w*0.03 + topExtra;

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = textColor;
    ctx.globalAlpha = .92;
    ctx.font = '700 ' + Math.round(dims.w*0.034) + 'px "Noto Sans KR",sans-serif';
    ctx.fillText('아워골', pad, y);
    ctx.globalAlpha = .6;
    ctx.font = '500 ' + Math.round(dims.w*0.024) + 'px "Noto Sans KR",sans-serif';
    // [TASK-ES-104] 카카오톡/인스타그램 맞춤카드 문구 제거 (상민님 지시 제6항)
    ctx.globalAlpha = 1;
    y += dims.w*0.06;

    var lastRec = L.state.profile.records[0];
    var fbOk = sel.feedback && L.state.lastCapture && L.state.lastCapture.feedback && L.state.lastCapture.goal && L.state.lastCapture.goal.id===g.id;
    var pickedMs = g.milestones.filter(function(m){ return sel.ms[m.id]; });
    var maxContentY = dims.h - pad*1.3 - watermarkH - (isVertical ? dims.h*0.04 : 0);
    var compact = dims.h < 500;

    if(sel.goal){
      ctx.fillStyle = textColor;
      ctx.font = '900 ' + Math.round(dims.w*0.07) + 'px "Noto Sans KR",sans-serif';
      y = scDrawLines(ctx, scWrapLines(ctx, g.title, innerW, compact?1:2), pad, y, dims.w*0.08) + dims.w*0.012;
      ctx.font = '800 ' + Math.round(dims.w*0.05) + 'px "Noto Sans KR",sans-serif';
      ctx.fillText(pct+'% 달성 중', pad, y);
      y += dims.w*(compact?0.045:0.055);
      var barH = Math.round(dims.w*0.02);
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      scRoundRect(ctx, pad, y, innerW, barH, barH/2); ctx.fill();
      ctx.fillStyle = textColor;
      scRoundRect(ctx, pad, y, Math.max(barH, innerW*Math.min(100,pct)/100), barH, barH/2); ctx.fill();
      y += barH + dims.w*(compact?0.04:0.055);
    }

    function drawChip(icon, text){
      if(y >= maxContentY) return;
      var fontSize = Math.round(dims.w*0.028);
      ctx.font = '600 '+fontSize+'px "Noto Sans KR",sans-serif';
      var chipPadX = dims.w*0.026, chipPadY = dims.w*0.018;
      var lines = scWrapLines(ctx, icon+' '+text, innerW - chipPadX*2, compact?1:2);
      var lineH = dims.w*0.035;
      var chipH = chipPadY*2 + lines.length*lineH;
      if(y + chipH > maxContentY) return;
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      scRoundRect(ctx, pad, y, innerW, chipH, dims.w*0.018); ctx.fill();
      ctx.fillStyle = textColor;
      scDrawLines(ctx, lines, pad+chipPadX, y+chipPadY+lineH*0.72, lineH);
      y += chipH + dims.w*0.018;
    }
    if(sel.record && lastRec) drawChip('📝', lastRec.text);
    if(fbOk) drawChip('🤖', L.state.lastCapture.feedback.comment);

    if(pickedMs.length && y < maxContentY){
      var chipFont = Math.round(dims.w*0.025);
      ctx.font = '700 '+chipFont+'px "Noto Sans KR",sans-serif';
      var cx = pad, cy = y, rowH = dims.w*0.048;
      pickedMs.slice(0,4).forEach(function(m){
        if(cy >= maxContentY) return;
        var label = '· '+m.title;
        var w = ctx.measureText(label).width + dims.w*0.03;
        if(cx + w > pad+innerW){ cx = pad; cy += rowH+dims.w*0.012; if(cy>=maxContentY) return; }
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        scRoundRect(ctx, cx, cy, w, rowH*0.82, rowH*0.4); ctx.fill();
        ctx.fillStyle = textColor;
        ctx.fillText(label, cx+dims.w*0.015, cy+rowH*0.56);
        cx += w + dims.w*0.014;
      });
      y = cy + rowH + dims.w*0.02;
    }

    var footerY = Math.max(y + dims.w*0.03, dims.h - pad*0.6 - watermarkH);
    ctx.globalAlpha = .7;
    ctx.font = '600 ' + Math.round(dims.w*0.024) + 'px "Noto Sans KR",sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText(days+'일째 진행 중'+(g.dueDate?' · '+L.dDay(g.dueDate):''), pad, footerY);
    ctx.globalAlpha = 1;

    drawShareWatermark(ctx, dims, L.state.profile.id, textColor);
    return canvas;
  }

  function buildShareText(g, pct, sel, days){
    var lines = [];
    if(sel.goal) lines.push('아워골에서 "'+g.title+'" '+pct+'% 달성 중! 💪');
    var lastRec = L.state.profile.records[0];
    if(sel.record && lastRec) lines.push('오늘 기록: '+lastRec.text);
    if(sel.feedback && L.state.lastCapture && L.state.lastCapture.feedback && L.state.lastCapture.goal && L.state.lastCapture.goal.id===g.id){
      lines.push('AI 피드백: '+L.state.lastCapture.feedback.comment);
    }
    var pickedMs = g.milestones.filter(function(m){ return sel.ms[m.id]; });
    if(pickedMs.length) lines.push('마일스톤: '+pickedMs.map(function(m){ return m.title; }).join(', '));
    if(typeof days==='number') lines.push(days+'일째 진행 중');
    var base = lines.join('\r\n') || ('아워골에서 "'+g.title+'" '+pct+'% 달성 중! 💪');
    return base + buildInviteLinkSuffix(g.id);
  }

  K.SHARE_PLATFORMS = SHARE_PLATFORMS;
  K.SHARE_CANVAS_DIMS = SHARE_CANVAS_DIMS;
  K.SHARE_DOMAIN = SHARE_DOMAIN;
  K.drawShareWatermark = drawShareWatermark;
  K.buildInviteLinkSuffix = buildInviteLinkSuffix;
  K.scRoundRect = scRoundRect;
  K.scWrapLines = scWrapLines;
  K.scDrawLines = scDrawLines;
  K.generateShareImage = generateShareImage;
  K.buildShareText = buildShareText;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
