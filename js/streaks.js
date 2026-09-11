/*
 * 아워골 — 출석·스트릭·배지 (#TASK-ES-019, E1)
 *
 * 규격: KF-3 요구사항정의서 v2 (2026-09-12) · 「아워골 수익화 모델(정립/구현)」 원칙 1.
 *   - 출석(앱 열기)과 기록(체크인)에 화폐형 보상을 주지 않는다. 보상은 성취감 장치(스트릭·배지)뿐.
 *   - 홈 "내 위치" 안에서만 보인다. 새 위젯·모달·팝업을 만들지 않는다(체크인 루프 순서 보존).
 *   - 표시하는 숫자는 전부 로컬 records·settings 실데이터에서 계산한다. 값이 없으면 숨긴다.
 *   - 조건값은 RULES 하나에 모으고, OURGOAL_CONFIG.STREAK_RULES 로 덮어쓸 수 있다(코드 고정값 금지).
 *
 * index.html 은 이 파일을 로드한 뒤 renderHome() 안에서 한 번 호출한다:
 *   OurgoalStreaks.renderHome({ state, BADGES, badgeContext, computeStreakDays, saveProfile, escapeHtml, dateKey })
 * 메인 스크립트가 IIFE 라 전역이 없으므로 필요한 것은 전부 인자로 받는다.
 */
(function (global) {
  'use strict';

  var RULES = {
    attendanceKeepDays: 400,                     // 출석 날짜 배열 보관 일수
    streakMilestones: [3, 7, 14, 30, 60, 100, 365], // 연속 기록 배지 단계(기존 3·7·30 + 확장)
    attendanceWeekDays: 7,                        // 주간 출석 완주 기준
    qualityMinChars: 20,                          // 기록 품질 배지: 한 기록 최소 글자
    qualityWindowDays: 7,                         // 최근 N일 안에서
    qualityMinDays: 5                             // M일 이상
  };

  var lastProfile = null;   // 배지 check 함수가 참조할 최근 프로필(명예의 전당은 ctx 만 넘기므로)
  var extended = false;

  function rules() {
    var c = global.OURGOAL_CONFIG;
    var o = (c && c.STREAK_RULES) || {};
    var out = {};
    Object.keys(RULES).forEach(function (k) { out[k] = (k in o) ? o[k] : RULES[k]; });
    return out;
  }

  function enabled() {
    var c = global.OURGOAL_CONFIG;
    return !(c && c.ENABLE_STREAK_BADGES === false);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayKey() { return keyOf(new Date()); }
  function daysAgoKey(n) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return keyOf(d); }

  /* ---------- 출석 ---------- */
  function markAttendance(settings) {
    if (!settings) return false;
    if (!Array.isArray(settings.attendance)) settings.attendance = [];
    var k = todayKey();
    if (settings.attendance.indexOf(k) !== -1) return false;
    settings.attendance.push(k);
    var keep = rules().attendanceKeepDays;
    if (settings.attendance.length > keep) settings.attendance = settings.attendance.slice(-keep);
    return true;
  }

  function weekDots(attendance) {
    var att = Array.isArray(attendance) ? attendance : [];
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var k = daysAgoKey(i);
      out.push({ key: k, on: att.indexOf(k) !== -1, isToday: i === 0 });
    }
    return out;
  }

  /* ---------- 스트릭 ---------- */
  function dayIndex(records, dateKey) {
    var days = {};
    (records || []).forEach(function (r) {
      var t = (r && typeof r.text === 'string') ? r.text.trim().length : 0;
      var k = dateKey ? dateKey(r.startAt) : keyOf(new Date(r.startAt));
      days[k] = Math.max(days[k] || 0, t);
    });
    return days;
  }

  /* 어제까지 이어진 연속 일수(오늘 아직 기록 안 했을 때 "오늘 한 줄이면 N+1일" 안내용) */
  function streakThroughYesterday(days) {
    var n = 0;
    for (var i = 1; i < 400; i++) {
      if (days[daysAgoKey(i)] === undefined) break;
      n++;
    }
    return n;
  }

  function streakNextMilestone(streak, milestones) {
    var list = (milestones || rules().streakMilestones).slice().sort(function (a, b) { return a - b; });
    for (var i = 0; i < list.length; i++) if (list[i] > streak) return list[i];
    return null;
  }

  /* ---------- 기록 품질 ---------- */
  function qualityDays(records, r, dateKey) {
    r = r || rules();
    var days = dayIndex(records, dateKey);
    var n = 0;
    for (var i = 0; i < r.qualityWindowDays; i++) {
      if ((days[daysAgoKey(i)] || 0) >= r.qualityMinChars) n++;
    }
    return n;
  }

  function attendanceWeekComplete(attendance) {
    return weekDots(attendance).every(function (d) { return d.on; });
  }

  /* ---------- 배지 확장 (기존 BADGES 배열에 누적형 배지를 더한다. 기존 항목은 건드리지 않는다) ---------- */
  function extendBadges(BADGES) {
    if (extended || !Array.isArray(BADGES)) return;
    var have = {};
    BADGES.forEach(function (b) { have[b.id] = true; });
    var r = rules();
    var flames = function (n) { return n >= 100 ? '🏅' : n >= 60 ? '🔥🔥🔥🔥' : '🔥🔥🔥'; };
    r.streakMilestones.forEach(function (n) {
      var id = 'streak_' + n;
      if (have[id]) return;
      BADGES.push({ id: id, icon: flames(n), label: n + '일 연속', desc: n + '일 연속으로 기록하면',
        check: function (ctx) { return (ctx && ctx.streak || 0) >= n; } });
      have[id] = true;
    });
    if (!have.attendance_week) {
      BADGES.push({ id: 'attendance_week', icon: '📅', label: '일주일 개근', desc: '7일 연속 앱에 들르면',
        check: function () { return !!(lastProfile && attendanceWeekComplete(lastProfile.settings && lastProfile.settings.attendance)); } });
    }
    if (!have.quality_week) {
      BADGES.push({ id: 'quality_week', icon: '📝', label: '진짜 기록가', desc: '최근 ' + r.qualityWindowDays + '일 중 ' + r.qualityMinDays + '일 이상 ' + r.qualityMinChars + '자 넘게 기록하면',
        check: function () { return !!(lastProfile && qualityDays(lastProfile.records, r) >= r.qualityMinDays); } });
    }
    extended = true;
  }

  /* 새로 열린 배지를 settings.badgeUnlocks 에 날짜와 함께 남긴다(누적형·잃지 않음). 새로 열린 것 목록을 돌려준다 */
  function syncUnlocks(BADGES, ctx, settings) {
    if (!settings.badgeUnlocks || typeof settings.badgeUnlocks !== 'object') settings.badgeUnlocks = {};
    var fresh = [];
    BADGES.forEach(function (b) {
      var on = false;
      try { on = !!b.check(ctx); } catch (e) { on = false; }
      if (on && !settings.badgeUnlocks[b.id]) {
        settings.badgeUnlocks[b.id] = new Date().toISOString();
        fresh.push(b);
      }
    });
    return fresh;
  }

  function latestUnlocked(BADGES, settings) {
    var u = (settings && settings.badgeUnlocks) || {};
    var best = null;
    BADGES.forEach(function (b) {
      if (u[b.id] && (!best || u[b.id] > u[best.id])) best = b;
    });
    return best;
  }

  /* ---------- 홈 "내 위치" 표시 ---------- */
  function esc(api, s) { return api && typeof api.escapeHtml === 'function' ? api.escapeHtml(String(s)) : String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function renderHome(api) {
    api = api || {};
    var el = global.document && global.document.getElementById('homePositionStrip');
    if (!el) return null;
    var p = api.state && api.state.profile;
    if (!enabled() || !p || !p.settings) { el.hidden = true; el.innerHTML = ''; return null; }
    lastProfile = p;
    var r = rules();
    var changed = markAttendance(p.settings);
    extendBadges(api.BADGES);

    var streak = typeof api.computeStreakDays === 'function' ? (api.computeStreakDays() || 0) : 0;
    var days = dayIndex(p.records, api.dateKey);
    var todayDone = days[todayKey()] !== undefined;
    var throughYesterday = streakThroughYesterday(days);
    var dots = weekDots(p.settings.attendance);
    var attendedThisWeek = dots.filter(function (d) { return d.on; }).length;

    var lines = [];
    // (a) 이번 주 출석 점 — 실데이터. 오늘 방금 찍었으니 최소 1
    if (attendedThisWeek > 0) {
      lines.push('<span title="이번 주 출석">' + dots.map(function (d) { return d.on ? '●' : '○'; }).join(' ') + '</span> 이번 주 ' + attendedThisWeek + '일 들렀어요');
    }
    // (b) 스트릭 — 오늘 기록했으면 현재 연속, 아니면 어제까지 이어진 만큼 "오늘 한 줄" 안내
    if (todayDone && streak > 0) {
      var next = streakNextMilestone(streak, r.streakMilestones);
      lines.push('🔥 ' + streak + '일 연속 기록 중' + (next ? ' · 다음 배지까지 ' + (next - streak) + '일' : ''));
    } else if (!todayDone && throughYesterday > 0) {
      lines.push('오늘 한 줄이면 ' + (throughYesterday + 1) + '일 연속이 이어져요');
    } else if (!todayDone && Object.keys(days).length > 0) {
      var first = streakNextMilestone(0, r.streakMilestones);
      lines.push('오늘 한 줄로 다시 시작해요' + (first ? ' · ' + first + '일이면 첫 배지' : ''));
    }
    // (c) 배지 — 새로 열린 것이 있으면 그것, 없으면 최근 것
    var ctx = null;
    try { ctx = typeof api.badgeContext === 'function' ? api.badgeContext(p) : { records: (p.records || []).length, streak: streak }; } catch (e) { ctx = { records: (p.records || []).length, streak: streak }; }
    var fresh = Array.isArray(api.BADGES) ? syncUnlocks(api.BADGES, ctx, p.settings) : [];
    if (fresh.length) {
      changed = true;
      lines.push('🎉 새 배지: ' + fresh.map(function (b) { return esc(api, b.icon + ' ' + b.label); }).join(', '));
    } else {
      var last = Array.isArray(api.BADGES) ? latestUnlocked(api.BADGES, p.settings) : null;
      if (last) lines.push('최근 배지 ' + esc(api, last.icon + ' ' + last.label));
    }

    if (!lines.length) { el.hidden = true; el.innerHTML = ''; }
    else { el.innerHTML = lines.map(function (l) { return '<div>' + l + '</div>'; }).join(''); el.hidden = false; }

    if (changed && typeof api.saveProfile === 'function') {
      try { var ret = api.saveProfile(); if (ret && typeof ret.catch === 'function') ret.catch(function () {}); } catch (e) { /* 저장 실패는 다음 렌더에서 재시도 */ }
    }
    return { streak: streak, attendedThisWeek: attendedThisWeek, fresh: fresh.length };
  }

  global.OurgoalStreaks = {
    RULES: RULES,
    rules: rules,
    enabled: enabled,
    markAttendance: markAttendance,
    weekDots: weekDots,
    streakNextMilestone: streakNextMilestone,
    qualityDays: qualityDays,
    attendanceWeekComplete: attendanceWeekComplete,
    extendBadges: extendBadges,
    renderHome: renderHome
  };
})(typeof window !== 'undefined' ? window : this);
