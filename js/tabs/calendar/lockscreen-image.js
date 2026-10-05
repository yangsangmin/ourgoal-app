/**
 * OurGoal Lock Screen Image (일정 탭 — 잠금화면 이미지 그리기)
 *
 * #TASK-ES-423 (인라인 스크립트 세포화 1차): index.html 인라인 IIFE 의 잠금화면 캔버스 그리기 두 묶음을 동작 그대로 옮겼다.
 *   lsDrawRoundRect · generateLockScreenCalendarImage(이전 전 11377~11654줄)
 *   generateLockScreenScheduleCardImage(이전 전 11904~12126줄)
 * generateLockScreenCalendarImage = 1080x2340 월간 달력 배경화면 캔버스(window.generateLockScreenCalendarImage 노출은 index.html 원래 자리에 그대로 있다).
 * generateLockScreenScheduleCardImage = 1080x1920(9:16) 오늘 일정 카드 캔버스 — 잠금화면 허브 창(#btnDownloadLockscreenCard)이 부른다.
 * 묶음을 통째로(구획 주석 포함) 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * index.html 은 IIFE 맨 위에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  /* =========================================================================
     [#TASK-ES-181] 폰 잠금화면용 고해상도 월간 달력 배경화면 캔버스 엔진
     - 해상도: 1080 x 2340 (스마트폰 최적 19.5:9 비율)
     - 상단 노치/시계 영역(y: 0~520) 세이프존 확보
     - 중앙 월간 캘린더 그리드 (오늘 하이라이트 + 일정 도트)
     - 하단 오늘 일정 및 핵심 D-Day 브리핑 카드
     - 다크(OLED 절전 블랙) & 라이트(감성 웜화이트) 테마
  ========================================================================= */
  function lsDrawRoundRect(ctx, x, y, w, h, r, fill, stroke){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if(fill){ ctx.fillStyle = fill; ctx.fill(); }
    if(stroke && stroke !== 'transparent'){ ctx.strokeStyle = stroke; ctx.stroke(); }
    ctx.restore();
  }

  async function generateLockScreenCalendarImage(targetYear, targetMonth, records, goals, options){
    options = options || {};
    var theme = options.theme || 'dark';

    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 2340;
    var ctx = canvas.getContext('2d');
    if(!ctx) return canvas;

    var now = new Date();
    var y = targetYear || now.getFullYear();
    var m = (targetMonth !== undefined && targetMonth !== null) ? targetMonth : now.getMonth();
    var todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    var isDark = (theme === 'dark');
    var cBg = isDark ? '#0A0C10' : '#F8FAFC';
    var cCard = isDark ? '#141721' : '#FFFFFF';
    var cCardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    var cTextMain = isDark ? '#FFFFFF' : '#0F172A';
    var cTextSub = isDark ? '#94A3B8' : '#64748B';
    var cTextMuted = isDark ? '#475569' : '#94A3B8';
    var cAccent = '#6366F1';
    var cAccentGlow = isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.08)';
    var cTodayBg = '#6366F1';
    var cTodayText = '#FFFFFF';
    var cDotColor = isDark ? '#38BDF8' : '#0284C7';
    var cSunColor = '#EF4444';
    var cSatColor = '#3B82F6';

    // 1. 배경
    ctx.fillStyle = cBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 상단 앰비언트 글로우
    var grad = ctx.createRadialGradient(540, 260, 20, 540, 260, 460);
    grad.addColorStop(0, cAccentGlow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 650);

    // 2. 상단 노치 및 시계 세이프존 안내
    ctx.save();
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('OURGOAL LOCK SCREEN', 540, 130);
    ctx.restore();

    // 3. 월간 타이틀
    var monthNamesKr = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    var titleMonthStr = y + '. ' + String(m + 1).padStart(2, '0');

    ctx.save();
    ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMain;
    ctx.textAlign = 'center';
    ctx.fillText(titleMonthStr, 540, 530);

    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cAccent;
    ctx.fillText(monthNamesKr[m] + ' 캘린더', 540, 575);
    ctx.restore();

    // 4. 달력 카드 박스
    var calBoxX = 60, calBoxY = 615, calBoxW = 960, calBoxH = 750;
    lsDrawRoundRect(ctx, calBoxX, calBoxY, calBoxW, calBoxH, 28, cCard, cCardBorder);

    // 요일 헤더
    var weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    var colW = calBoxW / 7;
    var startGridY = calBoxY + 75;

    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    for(var wd = 0; wd < 7; wd++){
      if(wd === 0) ctx.fillStyle = cSunColor;
      else if(wd === 6) ctx.fillStyle = cSatColor;
      else ctx.fillStyle = cTextSub;
      ctx.fillText(weekDays[wd], calBoxX + (wd * colW) + (colW / 2), calBoxY + 50);
    }

    var firstDay = new Date(y, m, 1).getDay();
    var lastDate = new Date(y, m + 1, 0).getDate();

    var eventMap = {};
    if(Array.isArray(records)){
      records.forEach(function(r){
        if(!r) return;
        var rDate = (r.startAt || r.date || '').slice(0, 10);
        if(rDate) eventMap[rDate] = (eventMap[rDate] || 0) + 1;
      });
    }

    var rowH = (calBoxH - 80) / 6;
    var dayCounter = 1;
    var gridY = startGridY;

    for(var row = 0; row < 6; row++){
      for(var col = 0; col < 7; col++){
        var cellIndex = row * 7 + col;
        if(cellIndex >= firstDay && dayCounter <= lastDate){
          var curDay = dayCounter;
          var curDateStr = y + '-' + String(m+1).padStart(2, '0') + '-' + String(curDay).padStart(2, '0');
          var isToday = (curDateStr === todayStr);
          var hasEvents = !!eventMap[curDateStr];
          var cellCenterX = calBoxX + (col * colW) + (colW / 2);
          var cellCenterY = gridY + (row * rowH) + (rowH / 2) - 4;

          if(isToday){
            ctx.fillStyle = cTodayBg;
            ctx.beginPath();
            ctx.arc(cellCenterX, cellCenterY, 34, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.font = isToday ? '900 32px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' : '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          if(isToday){
            ctx.fillStyle = cTodayText;
          } else if(col === 0){
            ctx.fillStyle = cSunColor;
          } else if(col === 6){
            ctx.fillStyle = cSatColor;
          } else {
            ctx.fillStyle = cTextMain;
          }
          ctx.fillText(String(curDay), cellCenterX, cellCenterY + 10);

          if(hasEvents){
            ctx.fillStyle = isToday ? '#FFFFFF' : cDotColor;
            ctx.beginPath();
            ctx.arc(cellCenterX, cellCenterY + 28, 4, 0, Math.PI * 2);
            ctx.fill();
          }

          dayCounter++;
        }
      }
    }

    // 5. 하단 "THIS MONTH & TODAY" 브리핑 카드
    var bCardX = 60, bCardY = 1400, bCardW = 960, bCardH = 750;
    lsDrawRoundRect(ctx, bCardX, bCardY, bCardW, bCardH, 28, cCard, cCardBorder);

    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMain;
    ctx.textAlign = 'left';
    ctx.fillText('📌 TODAY & KEY SCHEDULE', bCardX + 44, bCardY + 68);

    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextSub;
    ctx.fillText('오늘 하루 핵심 일정과 이달의 주요 목표입니다', bCardX + 44, bCardY + 106);

    ctx.strokeStyle = cCardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bCardX + 44, bCardY + 130);
    ctx.lineTo(bCardX + bCardW - 44, bCardY + 130);
    ctx.stroke();

    var scheduleItems = [];
    if(Array.isArray(records)){
      records.forEach(function(r){
        var rDate = (r.startAt || r.date || '').slice(0, 10);
        if(rDate === todayStr && r.text){
          var tStr = (r.startAt && r.startAt.includes('T')) ? r.startAt.slice(11, 16) : '';
          scheduleItems.push({ type: 'today', time: tStr, text: r.text });
        }
      });
    }

    var goalItems = [];
    if(Array.isArray(goals)){
      goals.forEach(function(g){
        if(!g || !g.title) return;
        var ddayStr = '';
        if(g.targetDate){
          var tTime = new Date(g.targetDate).getTime();
          var nTime = new Date(todayStr).getTime();
          var diff = Math.ceil((tTime - nTime) / (1000 * 60 * 60 * 24));
          if(diff >= 0) ddayStr = 'D-' + diff;
          else ddayStr = 'D+' + Math.abs(diff);
        }
        goalItems.push({ title: g.title, dday: ddayStr });
      });
    }

    var startItemY = bCardY + 190;
    var maxSlots = 5;
    var currentSlot = 0;

    if(scheduleItems.length > 0){
      scheduleItems.slice(0, 3).forEach(function(item){
        if(currentSlot >= maxSlots) return;
        var itemY = startItemY + (currentSlot * 95);

        lsDrawRoundRect(ctx, bCardX + 44, itemY - 32, 120, 52, 12, cAccentGlow, 'transparent');

        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = cAccent;
        ctx.textAlign = 'center';
        ctx.fillText(item.time || '오늘', bCardX + 104, itemY + 3);

        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = cTextMain;
        ctx.textAlign = 'left';
        var txt = item.text;
        if(txt.length > 24) txt = txt.slice(0, 24) + '…';
        ctx.fillText(txt, bCardX + 185, itemY + 4);

        currentSlot++;
      });
    }

    if(goalItems.length > 0 && currentSlot < maxSlots){
      goalItems.slice(0, maxSlots - currentSlot).forEach(function(gItem){
        var itemY = startItemY + (currentSlot * 95);

        var badgeBg = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)';
        var badgeColor = isDark ? '#38BDF8' : '#0284C7';
        lsDrawRoundRect(ctx, bCardX + 44, itemY - 32, 120, 52, 12, badgeBg, 'transparent');

        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = badgeColor;
        ctx.textAlign = 'center';
        ctx.fillText(gItem.dday || '목표', bCardX + 104, itemY + 3);

        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = cTextMain;
        ctx.textAlign = 'left';
        var gTxt = gItem.title;
        if(gTxt.length > 22) gTxt = gTxt.slice(0, 22) + '…';
        ctx.fillText(gTxt, bCardX + 185, itemY + 4);

        currentSlot++;
      });
    }

    if(currentSlot === 0){
      ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = cTextSub;
      ctx.textAlign = 'center';
      ctx.fillText('✨ 오늘 등록된 일정이 없습니다.', bCardX + (bCardW/2), bCardY + 280);
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = cTextMuted;
      ctx.fillText('오늘도 나만의 소중한 목표를 향해 한 걸음 나아가세요!', bCardX + (bCardW/2), bCardY + 330);
    }

    // 6. 하단 워터마크
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('OURGOAL · 매일 성장하는 나만의 목표 캘린더', 540, 2240);

    return canvas;
  }

  /* =========================================================================
     [#TASK-ES-232] 9:16 스마트폰 잠금화면용 일정 카드 고해상도 Canvas 생성 엔진
     - 해상도: 1080 x 1920 (정확한 9:16 배경화면 규격)
     - 상단 날짜, 아바타, 연속 실천 스트릭
     - 오늘의 일정 타임테이블 목록
     - 핵심 목표 TOP 3 및 D-Day
     - 격려 문구 및 아워골 워터마크
  ========================================================================= */
  async function generateLockScreenScheduleCardImage(records, goals, options){
    options = options || {};
    var theme = options.theme || (L.state && L.state.theme === 'white' ? 'light' : 'dark');
    var isDark = (theme !== 'light');

    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    var ctx = canvas.getContext('2d');
    if(!ctx) return canvas;

    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var d = now.getDate();
    var todayStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    var fullDateStr = y + '년 ' + (m + 1) + '월 ' + d + '일 ' + dayNames[now.getDay()];

    // 팔레트
    var cBg = isDark ? '#0A0C10' : '#F8FAFC';
    var cCard = isDark ? '#141721' : '#FFFFFF';
    var cCardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    var cTextMain = isDark ? '#FFFFFF' : '#0F172A';
    var cTextSub = isDark ? '#94A3B8' : '#64748B';
    var cTextMuted = isDark ? '#475569' : '#94A3B8';
    var cAccent = '#6366F1';
    var cAccentGlow = isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.1)';

    // 1. 전체 배경 드로잉
    ctx.fillStyle = cBg;
    ctx.fillRect(0, 0, 1080, 1920);

    // 상단 앰비언트 그라데이션 글로우
    var bgGrad = ctx.createRadialGradient(540, 220, 20, 540, 220, 480);
    bgGrad.addColorStop(0, cAccentGlow);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 600);

    // 2. 상단 노치 세이프존 & 브랜드 헤더
    ctx.save();
    ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cAccent;
    ctx.textAlign = 'center';
    ctx.fillText('OURGOAL · DAILY LOCKSCREEN', 540, 140);
    ctx.restore();

    // 3. 날짜 헤더 & 서브 스트릭
    ctx.save();
    ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMain;
    ctx.textAlign = 'center';
    ctx.fillText(fullDateStr, 540, 230);

    var rawAv = (L.state && L.state.profile && L.state.profile.avatar);
    var avatarChar = (typeof rawAv === 'object' && rawAv ? rawAv.emoji : rawAv) || '🌱';
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(avatarChar + ' 연속 ' + streakDays + '일째 실천 중 🔥', 540, 285);
    ctx.restore();

    // 4. 오늘의 타임테이블 카드 (y: 340, w: 960, h: 680)
    var c1X = 60, c1Y = 340, c1W = 960, c1H = 680;
    lsDrawRoundRect(ctx, c1X, c1Y, c1W, c1H, 28, cCard, cCardBorder);

    ctx.save();
    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMain;
    ctx.textAlign = 'left';
    ctx.fillText('📅 오늘의 타임테이블', c1X + 44, c1Y + 68);

    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextSub;
    ctx.fillText('시간대별 실천 계획과 주요 일정입니다', c1X + 44, c1Y + 106);

    ctx.strokeStyle = cCardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c1X + 44, c1Y + 130);
    ctx.lineTo(c1X + c1W - 44, c1Y + 130);
    ctx.stroke();
    ctx.restore();

    var todaySchedules = [];
    if(Array.isArray(records)){
      records.forEach(function(r){
        if(!r) return;
        var rDate = (r.startAt || r.date || '').slice(0, 10);
        if(rDate === todayStr && r.text){
          var tStr = (r.startAt && r.startAt.includes('T')) ? r.startAt.slice(11, 16) : '오늘';
          todaySchedules.push({ time: tStr, text: r.text });
        }
      });
    }

    var schedStartY = c1Y + 195;
    var maxSched = 4;
    if(todaySchedules.length > 0){
      todaySchedules.slice(0, maxSched).forEach(function(item, idx){
        var itemY = schedStartY + (idx * 105);
        lsDrawRoundRect(ctx, c1X + 44, itemY - 36, 120, 56, 14, cAccentGlow, 'transparent');

        ctx.save();
        ctx.font = '800 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = cAccent;
        ctx.textAlign = 'center';
        ctx.fillText(item.time, c1X + 104, itemY + 2);

        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = cTextMain;
        ctx.textAlign = 'left';
        var txt = item.text;
        if(txt.length > 22) txt = txt.slice(0, 22) + '…';
        ctx.fillText(txt, c1X + 190, itemY + 3);
        ctx.restore();
      });
    } else {
      ctx.save();
      ctx.font = '700 30px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = cTextSub;
      ctx.textAlign = 'center';
      ctx.fillText('✨ 오늘 등록된 일정이 없습니다', c1X + (c1W / 2), c1Y + 340);
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = cTextMuted;
      ctx.fillText('가볍고 상쾌한 마음으로 하루를 시작해보세요!', c1X + (c1W / 2), c1Y + 395);
      ctx.restore();
    }

    // 5. 핵심 목표 TOP 3 카드 (y: 1060, w: 960, h: 660)
    var c2X = 60, c2Y = 1060, c2W = 960, c2H = 660;
    lsDrawRoundRect(ctx, c2X, c2Y, c2W, c2H, 28, cCard, cCardBorder);

    ctx.save();
    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMain;
    ctx.textAlign = 'left';
    ctx.fillText('🎯 핵심 실천 목표 TOP 3', c2X + 44, c2Y + 68);

    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextSub;
    ctx.fillText('매일의 작은 발걸음이 위대한 성취가 됩니다', c2X + 44, c2Y + 106);

    ctx.strokeStyle = cCardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c2X + 44, c2Y + 130);
    ctx.lineTo(c2X + c2W - 44, c2Y + 130);
    ctx.stroke();
    ctx.restore();

    var activeGoals = [];
    if(Array.isArray(goals)){
      goals.forEach(function(g){
        if(!g || !g.title) return;
        var ddayStr = '';
        if(g.targetDate){
          var tTime = new Date(g.targetDate).getTime();
          var nTime = new Date(todayStr).getTime();
          var diff = Math.ceil((tTime - nTime) / (1000 * 60 * 60 * 24));
          if(diff >= 0) ddayStr = 'D-' + diff;
          else ddayStr = 'D+' + Math.abs(diff);
        }
        activeGoals.push({ title: g.title, dday: ddayStr });
      });
    }

    var goalStartY = c2Y + 195;
    if(activeGoals.length > 0){
      activeGoals.slice(0, 3).forEach(function(gItem, idx){
        var itemY = goalStartY + (idx * 115);
        var badgeBg = isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.12)';
        var badgeColor = isDark ? '#38BDF8' : '#0284C7';
        lsDrawRoundRect(ctx, c2X + 44, itemY - 36, 120, 56, 14, badgeBg, 'transparent');

        ctx.save();
        ctx.font = '800 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = badgeColor;
        ctx.textAlign = 'center';
        ctx.fillText(gItem.dday || '목표', c2X + 104, itemY + 2);

        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = cTextMain;
        ctx.textAlign = 'left';
        var gTxt = gItem.title;
        if(gTxt.length > 20) gTxt = gTxt.slice(0, 20) + '…';
        ctx.fillText(gTxt, c2X + 190, itemY + 3);
        ctx.restore();
      });
    } else {
      ctx.save();
      ctx.font = '700 30px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = cTextSub;
      ctx.textAlign = 'center';
      ctx.fillText('🎯 등록된 핵심 목표가 없습니다', c2X + (c2W / 2), c2Y + 330);
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillStyle = cTextMuted;
      ctx.fillText('목표 탭에서 나만의 새로운 목표를 추가해보세요!', c2X + (c2W / 2), c2Y + 385);
      ctx.restore();
    }

    // 6. 하단 격려 문구 & 워터마크 (y: 1760 ~ 1860)
    ctx.save();
    ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextSub;
    ctx.textAlign = 'center';
    ctx.fillText('오늘도 나만의 목표를 향해 한 걸음 나아가세요! 🔥', 540, 1780);

    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.fillText('OURGOAL · 매일 성장하는 나만의 습관 파트너', 540, 1835);
    ctx.restore();

    return canvas;
  }

  K.lsDrawRoundRect = lsDrawRoundRect;
  K.generateLockScreenCalendarImage = generateLockScreenCalendarImage;
  K.generateLockScreenScheduleCardImage = generateLockScreenScheduleCardImage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
