/**
 * OurGoal MZ Story Canvas (소통 — 9:16 갓생 스토리 카드 그림)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   generateMzStoryCanvas(이전 전 13664~14012줄, 구획 주석 포함 · 구획 「MZ 9:16 인스타 스토리 고해상도 그래픽 캔버스 생성기 (Growth & Viral Loop)」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ============ MZ 9:16 인스타 스토리 고해상도 그래픽 캔버스 생성기 (Growth & Viral Loop) ============ */
  function generateMzStoryCanvas(options){
    options = options || {};
    var streak = Number(options.streak) || 0;
    var userName = String(options.userName || '아워골 메이커');
    var quote = String(options.quote || '목표를 향해 한 걸음씩, 꾸준함이 비범함을 만든다 ✨');
    var dateStr = options.dateStr || (function(){
      var d = new Date();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '.' + m + '.' + day;
    })();

    var ratio = options.ratio || '9:16';
    var w = 720, h = 1280;
    if(ratio === '16:9'){ w = 1280; h = 720; }
    else if(ratio === '3:4'){ w = 720; h = 960; }
    else if(ratio === '4:3'){ w = 960; h = 720; }
    else if(ratio === '1:1'){ w = 720; h = 720; }
    else { w = 720; h = 1280; }

    var incGoal = options.includeGoal !== false;
    var incAvatar = options.includeAvatar !== false;
    var incRecord = options.includeRecord !== false;
    var incFeedback = options.includeFeedback !== false;

    var goalTitle = options.goalTitle || (typeof L.state !== 'undefined' && L.state && L.state.profile && L.state.profile.goals && L.state.profile.goals.length ? L.state.profile.goals[0].title : '매일 성장하는 나만의 목표');
    var avatarIcon = options.avatarIcon || (typeof L.state !== 'undefined' && L.state && L.state.profile && (L.state.profile.avatar || L.state.profile.avatarIcon)) || '🌱';
    var feedback = options.feedback || 'AI 코치: 완벽한 몰입 페이스! 흔들림 없이 목표를 향해 전진 중 ✨';

    var canvas = options.canvas || (typeof document !== 'undefined' && document.createElement ? document.createElement('canvas') : null);
    if(!canvas) return null;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext ? canvas.getContext('2d') : null;
    if(!ctx) return canvas;

    var theme = options.theme || 'neon';
    var themeConfigs = {
      neon: {
        bg: ['#0E0C18', '#1B142E', '#0C0A14'],
        glow1: 'rgba(108, 92, 231, 0.42)',
        glow2: 'rgba(255, 107, 74, 0.35)',
        headerColor: '#FF6B4A',
        streakColors: ['#FF8A65', '#FFD54F'],
        frameStroke: 'rgba(255, 107, 74, 0.25)',
        tag: '갓생 네온'
      },
      cyber: {
        bg: ['#040E1E', '#0B2347', '#030A17'],
        glow1: 'rgba(0, 242, 254, 0.40)',
        glow2: 'rgba(79, 172, 254, 0.35)',
        headerColor: '#00F2FE',
        streakColors: ['#00F2FE', '#4FACFE'],
        frameStroke: 'rgba(0, 242, 254, 0.30)',
        tag: '사이버'
      },
      gold: {
        bg: ['#161105', '#2E220A', '#100C03'],
        glow1: 'rgba(243, 156, 18, 0.42)',
        glow2: 'rgba(46, 204, 113, 0.28)',
        headerColor: '#F39C12',
        streakColors: ['#F39C12', '#F1C40F'],
        frameStroke: 'rgba(243, 156, 18, 0.30)',
        tag: '골드'
      },
      aurora: {
        bg: ['#15061E', '#2A0E38', '#0E0315'],
        glow1: 'rgba(253, 121, 168, 0.42)',
        glow2: 'rgba(9, 132, 227, 0.35)',
        headerColor: '#FD79A8',
        streakColors: ['#FD79A8', '#E056FD'],
        frameStroke: 'rgba(253, 121, 168, 0.30)',
        tag: '오로라'
      }
    };
    var cfg = themeConfigs[theme] || themeConfigs.neon;

    // 1. 다크 프리미엄 배경 그라디언트
    var bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, cfg.bg[0]);
    bgGrad.addColorStop(0.5, cfg.bg[1]);
    bgGrad.addColorStop(1, cfg.bg[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. 앰비언트 글로우
    try {
      var glow1 = ctx.createRadialGradient(w * 0.8, h * 0.2, 20, w * 0.8, h * 0.2, Math.min(w, h) * 0.45);
      glow1.addColorStop(0, cfg.glow1);
      glow1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, w, h);

      var glow2 = ctx.createRadialGradient(w * 0.2, h * 0.8, 20, w * 0.2, h * 0.8, Math.min(w, h) * 0.45);
      glow2.addColorStop(0, cfg.glow2);
      glow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);
    } catch(e){}

    // 파티클 효과 옵션
    if (options.particles) {
      var stars = [
        [w * 0.14, h * 0.18, 4, 0.8], [w * 0.86, h * 0.2, 5, 0.85], [w * 0.3, h * 0.36, 3, 0.75], [w * 0.7, h * 0.38, 4, 0.8],
        [w * 0.12, h * 0.65, 5, 0.85], [w * 0.88, h * 0.66, 3, 0.75], [w * 0.25, h * 0.85, 4, 0.8], [w * 0.75, h * 0.87, 6, 0.9],
        [w * 0.5, h * 0.16, 3, 0.65], [w * 0.2, h * 0.48, 4, 0.7], [w * 0.8, h * 0.49, 5, 0.8], [w * 0.5, h * 0.78, 4, 0.85]
      ];
      ctx.save();
      stars.forEach(function(st){
        ctx.beginPath();
        ctx.arc(st[0], st[1], st[2], 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + st[3] + ')';
        ctx.shadowColor = cfg.headerColor;
        ctx.shadowBlur = 12;
        ctx.fill();
      });
      ctx.restore();
    }

    // 3. 카드 외곽 테두리 (네온 라운드 프레임)
    var fx = 28, fy = 28, fw = w - 56, fh = h - 56, r = 24;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fx + r, fy);
    ctx.lineTo(fx + fw - r, fy);
    ctx.quadraticCurveTo(fx + fw, fy, fx + fw, fy + r);
    ctx.lineTo(fx + fw, fy + fh - r);
    ctx.quadraticCurveTo(fx + fw, fy + fh, fx + fw - r, fy + fh);
    ctx.lineTo(fx + r, fy + fh);
    ctx.quadraticCurveTo(fx, fy + fh, fx, fy + fh - r);
    ctx.lineTo(fx, fy + r);
    ctx.quadraticCurveTo(fx, fy, fx + r, fy);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    var cx = w / 2;

    // 4. 헤더 엠블럼 & 날짜
    ctx.textAlign = 'center';
    ctx.fillStyle = (typeof cfg !== 'undefined' ? cfg.headerColor : '#FF6B4A');
    var isLandscape = (w > h);
    var headY = isLandscape ? 68 : Math.max(72, Math.round(h * 0.08));
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText('OUR GOAL · 갓생 아카이브', cx, headY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '17px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(dateStr + ' MISSION RECORD', cx, headY + 34);

    if(isLandscape){
      var leftCx = Math.round(w * 0.28);
      var flameY = 220;
      ctx.font = '72px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif';
      ctx.fillText('🔥', leftCx, flameY);

      ctx.font = '900 84px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(String(streak), leftCx, flameY + 95);

      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      try {
        var textGrad = ctx.createLinearGradient(leftCx - 80, flameY + 130, leftCx + 80, flameY + 130);
        textGrad.addColorStop(0, (typeof cfg !== 'undefined' ? cfg.streakColors[0] : '#FF8A65'));
        textGrad.addColorStop(1, (typeof cfg !== 'undefined' ? cfg.streakColors[1] : '#FFD54F'));
        ctx.fillStyle = textGrad;
      } catch(e){
        ctx.fillStyle = '#FFD54F';
      }
      ctx.fillText('DAYS STREAK', leftCx, flameY + 135);

      if(incAvatar){
        ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif';
        ctx.fillText(avatarIcon, leftCx, flameY + 185);
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(userName, leftCx, flameY + 215);
      }

      var rx = Math.round(w * 0.54), ry = 130, rw = Math.round(w * 0.41), rh = 460;
      ctx.beginPath();
      ctx.moveTo(rx + 18, ry);
      ctx.lineTo(rx + rw - 18, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + 18);
      ctx.lineTo(rx + rw, ry + rh - 18);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - 18, ry + rh);
      ctx.lineTo(rx + 18, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - 18);
      ctx.lineTo(rx, ry + 18);
      ctx.quadraticCurveTo(rx, ry, rx + 18, ry);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      var curY = ry + 42;
      if(incGoal){
        ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = (typeof cfg !== 'undefined' ? cfg.headerColor : '#FF6B4A');
        ctx.fillText('🎯 ' + goalTitle.slice(0, 24), rx + 24, curY);
        curY += 45;
      }
      if(incRecord){
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText('' + userName + ' 님의 오늘 기록', rx + 24, curY);
        curY += 32;
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = '#F5F5FA';
        var cleanQuote = quote.replace(/^["']|["']$/g, '').trim();
        ctx.fillText('"' + cleanQuote.slice(0, 26) + (cleanQuote.length > 26 ? '…' : '') + '"', rx + 24, curY);
        curY += 48;
      }
      if(incFeedback){
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = '#68D391';
        ctx.fillText('🤖 ' + feedback.slice(0, 30) + (feedback.length > 30 ? '…' : ''), rx + 24, curY);
      }
    } else {
      var scale = (h <= 720) ? 0.72 : ((h <= 960) ? 0.85 : 1.0);
      var flameY = Math.round(h * 0.22);
      ctx.font = Math.round(96 * scale) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif';
      ctx.fillText('🔥', cx, flameY);

      if(incAvatar){
        ctx.font = Math.round(36 * scale) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif';
        ctx.fillText(avatarIcon, cx + Math.round(60 * scale), flameY - Math.round(20 * scale));
      }

      ctx.font = '900 ' + Math.round(104 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(String(streak), cx, flameY + Math.round(105 * scale));

      ctx.font = 'bold ' + Math.round(30 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      try {
        var textGrad = ctx.createLinearGradient(cx - 140, flameY + Math.round(145 * scale), cx + 140, flameY + Math.round(145 * scale));
        textGrad.addColorStop(0, (typeof cfg !== 'undefined' ? cfg.streakColors[0] : '#FF8A65'));
        textGrad.addColorStop(1, (typeof cfg !== 'undefined' ? cfg.streakColors[1] : '#FFD54F'));
        ctx.fillStyle = textGrad;
      } catch(e){
        ctx.fillStyle = '#FFD54F';
      }
      ctx.fillText('DAYS STREAK', cx, flameY + Math.round(145 * scale));

      ctx.font = Math.round(21 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fillText('매일매일 쌓아올린 흔들리지 않는 몰입', cx, flameY + Math.round(185 * scale));

      var qx = Math.round(w * 0.08), qy = flameY + Math.round(210 * scale), qw = Math.round(w * 0.84);
      var qh = Math.round(h - qy - Math.max(120, h * 0.14));
      var qr = 20;
      ctx.beginPath();
      ctx.moveTo(qx + qr, qy);
      ctx.lineTo(qx + qw - qr, qy);
      ctx.quadraticCurveTo(qx + qw, qy, qx + qw, qy + qr);
      ctx.lineTo(qx + qw, qy + qh - qr);
      ctx.quadraticCurveTo(qx + qw, qy + qh, qx + qw - qr, qy + qh);
      ctx.lineTo(qx + qr, qy + qh);
      ctx.quadraticCurveTo(qx, qy + qh, qx, qy + qh - qr);
      ctx.lineTo(qx, qy + qr);
      ctx.quadraticCurveTo(qx, qy, qx + qr, qy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      var textPad = Math.round(24 * scale);
      var curY = qy + Math.round(40 * scale);

      if(incGoal){
        ctx.font = 'bold ' + Math.round(22 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = (typeof cfg !== 'undefined' ? cfg.headerColor : '#FF6B4A');
        ctx.fillText('🎯 ' + goalTitle.slice(0, 24), qx + textPad, curY);
        curY += Math.round(40 * scale);
      }

      if(incRecord){
        ctx.font = 'bold ' + Math.round(21 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText('' + userName + ' 님의 오늘 기록', qx + textPad, curY);
        curY += Math.round(36 * scale);

        ctx.font = Math.round(22 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = '#F5F5FA';
        var cleanQuote = quote.replace(/^["']|["']$/g, '').trim();
        var words = cleanQuote.split('');
        var line = '';
        var maxCharsPerLine = (w <= 720) ? 19 : 28;
        var lines = [];
        for(var wd = 0; wd < words.length; wd++){
          line += words[wd];
          if(line.length >= maxCharsPerLine || wd === words.length - 1){
            lines.push(line);
            line = '';
            if(lines.length >= 2) break;
          }
        }
        if(!lines.length) lines.push('오늘의 몰입 완료');
        for(var li = 0; li < lines.length; li++){
          var prefix = (li === 0) ? '"' : ' ';
          var suffix = (li === lines.length - 1 || li === 1) ? '"' : '';
          ctx.fillText(prefix + lines[li] + suffix, qx + textPad, curY + (li * Math.round(32 * scale)));
        }
        curY += lines.length * Math.round(34 * scale) + Math.round(16 * scale);
      }

      if(incFeedback && (qh > 200 || !incRecord)){
        ctx.font = 'bold ' + Math.round(17 * scale) + 'px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = '#68D391';
        ctx.fillText('🤖 ' + feedback.slice(0, 28) + (feedback.length > 28 ? '…' : ''), qx + textPad, curY);
      }
    }

    // 태그 & 하단 워터마크
    ctx.textAlign = 'center';
    var botY = h - Math.max(36, Math.round(h * 0.05));
    if(h >= 900){
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = 'rgba(108, 92, 231, 0.95)';
      ctx.fillText('#오운완  #아워골  #갓생  #목표완주  #100일루틴', cx, botY - 95);

      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('OURGOAL', cx, botY - 60);

      ctx.font = '17px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('함께 달리는 나만의 목표 루틴 아카이브', cx, botY - 32);
    } else {
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('OURGOAL', cx, botY - 26);
    }

    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = '#FF6B4A';
    ctx.fillText('ourgoal-app.vercel.app', cx, botY);

    ctx.restore();
    return canvas;
  }

  K.generateMzStoryCanvas = generateMzStoryCanvas;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
