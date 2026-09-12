module.exports.config = { maxDuration: 30 };

var TOPIC_KEYS = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
var STATUS_VALUES = ['todo', 'doing', 'done'];

function clampStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function isDateStr(v) {
  return typeof v === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(v) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v));
}

function sanitizeAttachments(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 10).map(function (a) {
    if (!a || typeof a !== 'object') return null;
    var type = ['video', 'image', 'text', 'link'].indexOf(a.type) !== -1 ? a.type : 'link';
    var title = clampStr(a.title, 80) || '참고자료';
    var url = clampStr(a.url, 500);
    var content = clampStr(a.content, 1000);
    return { type: type, title: title, url: url, content: content };
  }).filter(Boolean);
}

function sanitizeCreateGoalData(data) {
  data = data || {};
  var title = clampStr(data.title, 60);
  if (!title) return null;
  var milestones = Array.isArray(data.milestones) ? data.milestones.slice(0, 35).map(function (m) {
    return {
      title: clampStr(m && m.title, 60),
      dueDate: isDateStr(m && m.dueDate) ? m.dueDate : null,
      tasks: Array.isArray(m && m.tasks) ? m.tasks.slice(0, 35).map(function (t) {
        if (typeof t === 'string') return clampStr(t, 80);
        if (t && typeof t === 'object') {
          var tTitle = clampStr(t.title, 80);
          if (!tTitle) return null;
          var resT = { title: tTitle };
          if (isDateStr(t.dueDate)) resT.dueDate = t.dueDate;
          if (Array.isArray(t.attachments)) resT.attachments = sanitizeAttachments(t.attachments);
          return resT;
        }
        return null;
      }).filter(Boolean) : [],
      attachments: sanitizeAttachments(m && m.attachments)
    };
  }).filter(function (m) { return m.title; }) : [];
  return {
    title: title,
    dueDate: isDateStr(data.dueDate) ? data.dueDate : null,
    topicMajor: TOPIC_KEYS.indexOf(data.topicMajor) !== -1 ? data.topicMajor : '',
    topicMinor: clampStr(data.topicMinor, 20),
    milestones: milestones
  };
}
function sanitizeUpdateGoalData(data) {
  data = data || {};
  var out = {}, has = false;
  if (typeof data.title === 'string' && data.title.trim()) { out.title = clampStr(data.title, 60); has = true; }
  if (data.dueDate === null || isDateStr(data.dueDate)) { out.dueDate = data.dueDate; has = true; }
  return has ? out : null;
}
function sanitizeCreateMilestoneData(data) {
  data = data || {};
  var title = clampStr(data.title, 60);
  if (!title) return null;
  return {
    title: title,
    dueDate: isDateStr(data.dueDate) ? data.dueDate : null,
    tasks: Array.isArray(data.tasks) ? data.tasks.slice(0, 35).map(function (t) {
      if (typeof t === 'string') return clampStr(t, 80);
      if (t && typeof t === 'object') {
        var tTitle = clampStr(t.title, 80);
        if (!tTitle) return null;
        var resT = { title: tTitle };
        if (isDateStr(t.dueDate)) resT.dueDate = t.dueDate;
        if (Array.isArray(t.attachments)) resT.attachments = sanitizeAttachments(t.attachments);
        return resT;
      }
      return null;
    }).filter(Boolean) : [],
    attachments: sanitizeAttachments(data.attachments)
  };
}
function sanitizeUpdateMilestoneData(data) {
  data = data || {};
  var out = {}, has = false;
  if (typeof data.title === 'string' && data.title.trim()) { out.title = clampStr(data.title, 60); has = true; }
  if (data.dueDate === null || isDateStr(data.dueDate)) { out.dueDate = data.dueDate; has = true; }
  if (STATUS_VALUES.indexOf(data.status) !== -1) { out.status = data.status; has = true; }
  if (Array.isArray(data.attachments)) { out.attachments = sanitizeAttachments(data.attachments); has = true; }
  return has ? out : null;
}
function sanitizeCreateTaskData(data) {
  data = data || {};
  var title = clampStr(data.title, 80);
  if (!title) return null;
  var out = { title: title };
  if (data.dueDate === null || isDateStr(data.dueDate)) out.dueDate = data.dueDate;
  if (Array.isArray(data.attachments)) out.attachments = sanitizeAttachments(data.attachments);
  return out;
}
function sanitizeUpdateTaskData(data) {
  data = data || {};
  var out = {}, has = false;
  if (typeof data.title === 'string' && data.title.trim()) { out.title = clampStr(data.title, 80); has = true; }
  if (data.done === true || data.done === false) { out.done = data.done; has = true; }
  if (data.dueDate === null || isDateStr(data.dueDate)) { out.dueDate = data.dueDate; has = true; }
  if (Array.isArray(data.attachments)) { out.attachments = sanitizeAttachments(data.attachments); has = true; }
  return has ? out : null;
}

function processOp(op, goalMap) {
  if (!op || typeof op !== 'object') return null;
  var type = op.type, level = op.level;
  if (['CREATE', 'UPDATE', 'DELETE'].indexOf(type) === -1) return null;
  if (['goal', 'milestone', 'task'].indexOf(level) === -1) return null;

  var goalId = op.goalId, milestoneId = op.milestoneId, taskId = op.taskId;
  var isCreateGoal = type === 'CREATE' && level === 'goal';

  if (!isCreateGoal) {
    if (!goalId || !goalMap.hasOwnProperty(goalId)) return null;
  }
  if (level === 'milestone' && type !== 'CREATE') {
    if (!milestoneId || !goalMap[goalId].hasOwnProperty(milestoneId)) return null;
  }
  if (level === 'task') {
    if (!milestoneId || !goalMap[goalId].hasOwnProperty(milestoneId)) return null;
    if (type !== 'CREATE' && (!taskId || !goalMap[goalId][milestoneId].hasOwnProperty(taskId))) return null;
  }

  var result = { type: type, level: level, summary: clampStr(op.summary, 120) || (type + ' ' + level) };
  if (goalId) result.goalId = goalId;
  if (milestoneId) result.milestoneId = milestoneId;
  if (taskId) result.taskId = taskId;

  if (type === 'DELETE') return result;

  var sanitizers = {
    CREATE: { goal: sanitizeCreateGoalData, milestone: sanitizeCreateMilestoneData, task: sanitizeCreateTaskData },
    UPDATE: { goal: sanitizeUpdateGoalData, milestone: sanitizeUpdateMilestoneData, task: sanitizeUpdateTaskData }
  };
  var data = sanitizers[type][level](op.data);
  if (!data) return null;
  result.data = data;
  return result;
}

function addDays(baseDateStr, days) {
  var d = new Date(baseDateStr + 'T12:00:00');
  if (isNaN(d.getTime())) d = new Date();
  d.setDate(d.getDate() + days);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function diffDays(startDateStr, endDateStr) {
  var s = new Date(startDateStr + 'T12:00:00');
  var e = new Date(endDateStr + 'T12:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 30;
  return Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000)));
}

// 일일/주차별/순차 계획의 dueDate가 최종 마감일 하나로 몰리지 않도록 안전하게 분배하는 엔진
function distributeSequentialDates(ops, today, userMessage) {
  if (!Array.isArray(ops) || !ops.length) return ops;
  var msg = (userMessage || '').toLowerCase();
  var isDailyIntent = /(일일|일자별|매일|데일리|30일|한달\s*계획|한달\s*일일|루틴|챌린지|daily|day)/i.test(msg);
  var isWeeklyIntent = /(주차별|주간|주별|주차|weekly|week)/i.test(msg);

  ops.forEach(function (op) {
    if (!op || !op.data) return;

    if (op.type === 'CREATE' && op.level === 'goal') {
      var goalDue = op.data.dueDate;
      var totalSpan = goalDue ? diffDays(today, goalDue) : 30;
      var msList = op.data.milestones;

      if (Array.isArray(msList) && msList.length > 1) {
        var nonNullDues = msList.map(function (m) { return m && m.dueDate; }).filter(Boolean);
        var allSameDue = nonNullDues.length > 0 && nonNullDues.every(function (d) { return d === nonNullDues[0]; });
        var mostlyMissing = nonNullDues.length <= Math.ceil(msList.length * 0.3);
        var hasSequentialTitle = msList.some(function (m) {
          return m && m.title && /(?:day\s*\d+|\d+일차|\d+주차)/i.test(m.title);
        });

        // 이미 마일스톤 날짜들이 서로 다르고 유효하게 채워져 있다면 임의로 덮어쓰지 않음
        var hasValidDistinctDates = nonNullDues.length === msList.length && !allSameDue;

        if (!hasValidDistinctDates && (allSameDue || mostlyMissing || hasSequentialTitle || isDailyIntent || isWeeklyIntent)) {
          var isDaily = isDailyIntent || msList.length >= 14 || msList.some(function (m) { return m && m.title && /(?:day\s*\d+|\d+일차)/i.test(m.title); });
          var isWeekly = !isDaily && (isWeeklyIntent || msList.some(function (m) { return m && m.title && /(?:\d+주차|주간)/i.test(m.title); }));

          msList.forEach(function (m, idx) {
            if (!m) return;
            var numMatch = (m.title || '').match(/(?:day\s*(\d+)|\b(\d+)일차)/i);
            var itemIdx = numMatch ? (parseInt(numMatch[1] || numMatch[2], 10) - 1) : idx;
            if (itemIdx < 0) itemIdx = idx;

            if (isDaily) {
              var offset = itemIdx + 1;
              if (offset > totalSpan && goalDue) offset = totalSpan;
              m.dueDate = addDays(today, offset);
            } else if (isWeekly) {
              var wOffset = Math.min((itemIdx + 1) * 7, totalSpan);
              m.dueDate = addDays(today, wOffset);
            } else {
              var step = Math.max(1, Math.round(((itemIdx + 1) / msList.length) * totalSpan));
              m.dueDate = addDays(today, step);
            }
          });
        }
      }

      // 각 마일스톤 내부의 tasks도 날짜 순차 분배 확인
      if (Array.isArray(msList)) {
        var prevMDue = today;
        msList.forEach(function (m) {
          if (!m || !Array.isArray(m.tasks) || m.tasks.length < 2) {
            if (m && m.dueDate) prevMDue = m.dueDate;
            return;
          }
          var tList = m.tasks;
          var tNonNullDues = tList.map(function (t) { return t && typeof t === 'object' && t.dueDate; }).filter(Boolean);
          var tAllSame = tNonNullDues.length > 0 && tNonNullDues.every(function (d) { return d === tNonNullDues[0]; });
          var tSeq = tList.some(function (t) {
            var tTitle = typeof t === 'string' ? t : (t && t.title);
            return tTitle && /(?:day\s*\d+|\d+일차)/i.test(tTitle);
          });

          // 할 일 순차 분배는 명시적 일일 의도가 있거나 Day 1/1일차 제목이 있거나, 모든 날짜가 동일할 때만 적용
          if (tSeq || isDailyIntent || (tAllSame && tNonNullDues.length > 0)) {
            var mDue = m.dueDate || goalDue;
            var startBase = prevMDue || today;
            var mSpan = mDue ? Math.max(1, diffDays(startBase, mDue)) : Math.max(tList.length, 7);
            tList.forEach(function (t, tIdx) {
              if (typeof t === 'string') {
                t = { title: t };
                m.tasks[tIdx] = t;
              }
              var tNum = (t.title || '').match(/(?:day\s*(\d+)|\b(\d+)일차)/i);
              var tDayIdx = tNum ? (parseInt(tNum[1] || tNum[2], 10) - 1) : tIdx;
              if (tDayIdx < 0) tDayIdx = tIdx;

              if (isDailyIntent || tSeq) {
                t.dueDate = addDays(startBase, Math.min(tDayIdx + 1, mSpan));
              } else {
                var tStep = Math.max(1, Math.round(((tDayIdx + 1) / tList.length) * mSpan));
                t.dueDate = addDays(startBase, tStep);
              }
            });
          }
          if (m && m.dueDate) prevMDue = m.dueDate;
        });
      }
    }
  });

  // 연속된 CREATE milestone ops 처리
  var createMsOps = ops.filter(function (o) { return o && o.type === 'CREATE' && o.level === 'milestone'; });
  if (createMsOps.length > 1) {
    var msDues = createMsOps.map(function (o) { return o.data && o.data.dueDate; }).filter(Boolean);
    var msAllSame = msDues.length > 0 && msDues.every(function (d) { return d === msDues[0]; });
    var msHasSeq = createMsOps.some(function (o) { return o.data && /(?:day\s*\d+|\d+일차|\d+단계|\d+주차)/i.test(o.data.title || ''); });
    if (msAllSame || msHasSeq || isDailyIntent) {
      var baseSpan = msDues[0] ? diffDays(today, msDues[0]) : Math.max(createMsOps.length, 30);
      createMsOps.forEach(function (o, idx) {
        if (!o.data) return;
        var offset = isDailyIntent || createMsOps.length >= 14 ? (idx + 1) : Math.max(1, Math.round(((idx + 1) / createMsOps.length) * baseSpan));
        if (msDues[0] && offset > baseSpan) offset = baseSpan;
        o.data.dueDate = addDays(today, offset);
      });
    }
  }

  // 연속된 CREATE task ops 처리
  var createTaskOps = ops.filter(function (o) { return o && o.type === 'CREATE' && o.level === 'task'; });
  if (createTaskOps.length > 1) {
    var tDues = createTaskOps.map(function (o) { return o.data && o.data.dueDate; }).filter(Boolean);
    var tAllSame = tDues.length > 0 && tDues.every(function (d) { return d === tDues[0]; });
    var tHasSeq = createTaskOps.some(function (o) { return o.data && /(?:day\s*\d+|\d+일차)/i.test((o.data.title || '') + (typeof o.data === 'string' ? o.data : '')); });
    if (tAllSame || tHasSeq || isDailyIntent) {
      var tSpan = tDues[0] ? diffDays(today, tDues[0]) : Math.max(createTaskOps.length, 30);
      createTaskOps.forEach(function (o, idx) {
        if (!o.data) return;
        if (typeof o.data === 'string') o.data = { title: o.data };
        var offset = isDailyIntent || createTaskOps.length >= 14 ? (idx + 1) : Math.max(1, Math.round(((idx + 1) / createTaskOps.length) * tSpan));
        if (tDues[0] && offset > tSpan) offset = tSpan;
        o.data.dueDate = addDays(today, offset);
      });
    }
  }

  return ops;
}

// API 키 부재 또는 호출 실패 시 로컬 규칙 기반 스마트 폴백 엔진 (어떤 입력이든 목표 생성으로 안전하게 포용)
function localGoalAgentFallback(message, goals, today, goalMap) {
  var msg = (message || '').trim();
  if (!msg) {
    return { ops: [], reply: '원하시는 목표나 할 일을 입력해 주세요.' };
  }
  var ops = [];
  var reply = '';

  // 1. 완료/달성 의도 (예: "OO 완료", "OO 마일스톤 완료해줘", "OO 끝냈어")
  if (/(완료|끝냈|다했|체크|달성)/.test(msg) && !/(목표|신규|새|추가|설정)/.test(msg)) {
    var foundMs = null;
    var foundGoal = null;
    for (var i = 0; i < goals.length; i++) {
      var g = goals[i];
      for (var j = 0; j < (g.milestones || []).length; j++) {
        var m = g.milestones[j];
        if (m.status !== 'done' && (msg.includes(m.title) || m.title.split(' ').some(function(w){ return w.length >= 2 && msg.includes(w); }))) {
          foundMs = m;
          foundGoal = g;
          break;
        }
      }
      if (foundMs) break;
    }
    if (foundMs && foundGoal) {
      ops.push({
        type: 'UPDATE',
        level: 'milestone',
        goalId: foundGoal.id,
        milestoneId: foundMs.id,
        data: { status: 'done' },
        summary: '"' + foundGoal.title + '"의 "' + foundMs.title + '" 마일스톤 완료 처리'
      });
      reply = '"' + foundMs.title + '" 마일스톤을 완료 상태로 변경하는 안을 준비했어요.';
      return { ops: ops, reply: reply };
    }
  }

  // 2. 삭제 의도 (예: "OO 목표 삭제해줘", "OO 지워줘")
  if (/(삭제|지워|제거|취소)/.test(msg) && !/(추가|만들|생성|등록|시작|설정)/.test(msg)) {
    for (var k = 0; k < goals.length; k++) {
      var targetGoal = goals[k];
      if (msg.includes(targetGoal.title) || targetGoal.title.split(' ').some(function(w){ return w.length >= 2 && msg.includes(w); })) {
        ops.push({
          type: 'DELETE',
          level: 'goal',
          goalId: targetGoal.id,
          summary: '목표 "' + targetGoal.title + '" 삭제'
        });
        reply = '"' + targetGoal.title + '" 목표를 삭제하는 안을 준비했어요.';
        return { ops: ops, reply: reply };
      }
    }
  }

  // 3. 신규 목표/일정 추가 의도 (모든 일반 텍스트·목표설정·일정등록 요청을 폭넓게 수용)
  // 날짜/요일 계산 헬퍼
  function calcDayOffset(targetDayIdx, isNext) {
    var d = new Date(today + 'T12:00:00');
    var cur = d.getDay();
    var diff = (targetDayIdx - cur + 7) % 7;
    if (diff === 0 && !isNext) diff = 7;
    if (isNext) diff += 7;
    d.setDate(d.getDate() + diff);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // 수정보완 태그 사전 제거
  var rawMsgWithoutRev = msg.replace(/\[(?:추가)?수정보완\s*\d+회차\]:?/gi, '').trim();

  // 날짜/기간 자연어 및 생년월일 추출
  var dueDate = null;
  var childBirthDate = null;
  var childTargetDate = null;

  // 1) 생년월일 + 만 N세/N살 계산 (예: "25년5월17일생 아기를 만 3살까지", "2025년 5월 17일생")
  var birthMatch = msg.match(/(?:(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*생|생년월일\s*[:\s]*(\d{2,4})[-.년\s]+(\d{1,2})[-.월\s]+(\d{1,2}))/i);
  var targetAgeMatch = msg.match(/(?:만\s*)?(\d{1,2})\s*(?:살|세)(?:\s*까지|\s*목표)?/i);

  if (birthMatch) {
    var bYear = parseInt(birthMatch[1] || birthMatch[4], 10);
    if (bYear < 100) bYear += 2000;
    var bMonth = parseInt(birthMatch[2] || birthMatch[5], 10);
    var bDay = parseInt(birthMatch[3] || birthMatch[6], 10);
    childBirthDate = bYear + '-' + String(bMonth).padStart(2, '0') + '-' + String(bDay).padStart(2, '0');

    if (targetAgeMatch) {
      var targetAge = parseInt(targetAgeMatch[1], 10);
      var tYear = bYear + targetAge;
      childTargetDate = tYear + '-' + String(bMonth).padStart(2, '0') + '-' + String(bDay).padStart(2, '0');
      dueDate = childTargetDate;
    }
  }

  // 2) 명시적 연-월-일 (예: "2028년 5월 17일", "2028-05-17", "28년 12월 31일")
  if (!dueDate) {
    var explicitDateMatch = msg.match(/(?:(\d{2,4})년\s*(\d{1,2})월\s*(\d{1,2})일)|(?:(\d{4})[-.](\d{1,2})[-.](\d{1,2}))/);
    if (explicitDateMatch) {
      var expY = parseInt(explicitDateMatch[1] || explicitDateMatch[4], 10);
      if (expY < 100) expY += 2000;
      var expM = parseInt(explicitDateMatch[2] || explicitDateMatch[5], 10);
      var expD = parseInt(explicitDateMatch[3] || explicitDateMatch[6], 10);
      dueDate = expY + '-' + String(expM).padStart(2, '0') + '-' + String(expD).padStart(2, '0');
    }
  }

  // 3) N년 / N개월 / N일 / D-Day / 연말
  if (!dueDate) {
    var yearAfterMatch = msg.match(/(\d{1,2})\s*년\s*(?:뒤|후|동안|간|안에|이내|까지)?/);
    if (yearAfterMatch && !msg.match(/\d{2,4}년\s*\d{1,2}월/)) {
      var yAdd = parseInt(yearAfterMatch[1], 10);
      if (yAdd > 0 && yAdd <= 20) {
        var d = new Date(today + 'T12:00:00');
        d.setFullYear(d.getFullYear() + yAdd);
        dueDate = d.toISOString().slice(0, 10);
      }
    }
  }
  if (!dueDate) {
    var monthAfterMatch = msg.match(/(\d{1,2})\s*개?월\s*(?:뒤|후|동안|간|안에|이내|까지)/);
    if (monthAfterMatch) {
      var mAdd = parseInt(monthAfterMatch[1], 10);
      var d = new Date(today + 'T12:00:00');
      d.setMonth(d.getMonth() + mAdd);
      dueDate = d.toISOString().slice(0, 10);
    }
  }
  if (!dueDate) {
    var dayAfterMatch = msg.match(/(\d{1,3})\s*일\s*(?:뒤|후|동안|간|안에|이내|챌린지)/);
    if (dayAfterMatch) {
      var dayAdd = parseInt(dayAfterMatch[1], 10);
      if (dayAdd > 0 && dayAdd <= 365) {
        dueDate = addDays(today, dayAdd);
      }
    }
  }
  if (!dueDate) {
    var dDayMatch = msg.match(/d\s*[-–—]\s*(\d{1,3})/i);
    if (dDayMatch) {
      dueDate = addDays(today, parseInt(dDayMatch[1], 10));
    }
  }
  if (!dueDate && /(올해\s*말|연말)/i.test(msg)) {
    var curY = new Date(today + 'T12:00:00').getFullYear();
    dueDate = curY + '-12-31';
  }
  if (!dueDate && /(상반기)/i.test(msg)) {
    var curY = new Date(today + 'T12:00:00').getFullYear();
    dueDate = curY + '-06-30';
  }
  if (!dueDate && /(하반기)/i.test(msg)) {
    var curY = new Date(today + 'T12:00:00').getFullYear();
    dueDate = curY + '-12-31';
  }

  // 4) 요일 및 상대 일정
  var isNextWk = /(다음\s*주)/i.test(msg);
  if (!dueDate) {
    if (/(이번\s*주\s*일요일|일요일)/i.test(msg)) {
      dueDate = calcDayOffset(0, isNextWk);
    } else if (/(이번\s*주\s*토요일|토요일)/i.test(msg)) {
      dueDate = calcDayOffset(6, isNextWk);
    } else if (/(이번\s*주\s*금요일|금요일)/i.test(msg)) {
      dueDate = calcDayOffset(5, isNextWk);
    } else if (/(이번\s*주\s*목요일|목요일)/i.test(msg)) {
      dueDate = calcDayOffset(4, isNextWk);
    } else if (/(이번\s*주\s*수요일|수요일)/i.test(msg)) {
      dueDate = calcDayOffset(3, isNextWk);
    } else if (/(이번\s*주\s*화요일|화요일)/i.test(msg)) {
      dueDate = calcDayOffset(2, isNextWk);
    } else if (/(이번\s*주\s*월요일|월요일)/i.test(msg)) {
      dueDate = calcDayOffset(1, isNextWk);
    } else if (/(내일)/i.test(msg)) {
      var d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      dueDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else if (/(모레)/i.test(msg)) {
      var d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() + 2);
      dueDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else if (/(한\s*달\s*뒤|1\s*달\s*뒤|30\s*일\s*뒤|1\s*개월\s*뒤)/i.test(msg)) {
      var d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() + 30);
      dueDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else if (/(두\s*달\s*뒤|2\s*달\s*뒤|60\s*일\s*뒤|2\s*개월\s*뒤)/i.test(msg)) {
      var d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() + 60);
      dueDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else if (/(세\s*달\s*뒤|3\s*달\s*뒤|90\s*일\s*뒤|3\s*개월\s*뒤|100\s*일\s*뒤)/i.test(msg)) {
      var d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() + 90);
      dueDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else if (/(다음\s*주|1\s*주\s*뒤|7\s*일\s*뒤)/i.test(msg)) {
      var d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() + 7);
      dueDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else if (/(올해\s*말|연말)/i.test(msg)) {
      var y = today.slice(0, 4);
      dueDate = y + '-12-31';
    }
  }

  // 시간 자연어 추출 (예: "오후 2시", "14시 30분", "저녁 7시")
  var timeMatch = msg.match(/(오전|오후|저녁|아침)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (timeMatch && dueDate) {
    var period = timeMatch[1] || '';
    var hour = parseInt(timeMatch[2], 10);
    var min = parseInt(timeMatch[3] || '0', 10);
    if ((period === '오후' || period === '저녁') && hour < 12) hour += 12;
    if (period === '오전' && hour === 12) hour = 0;
    dueDate += 'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  // 첨부파일 / 참고자료 / 레시피 / 유튜브 링크 요청 감지 및 자동 추출
  var hasAttachmentReq = /(첨부|레시피|유튜브|영상링크|동영상|참고자료|링크|자료)/i.test(msg);
  var attachKeyword = '';
  var attachUrl = '';
  var attachTitle = '';

  if (hasAttachmentReq) {
    if (/미역국/i.test(msg)) {
      attachKeyword = '미역국 레시피';
    } else {
      var kwMatch = msg.match(/(?:첨부파일로|첨부로|참고자료로|영상으로)?\s*([가-힣a-zA-Z0-9\s]+?)\s*(?:레시피|유튜브|영상|링크|자료|팁|노하우)\s*(?:등록|추가|찾아|첨부|넣어)/i) ||
                    msg.match(/([가-힣a-zA-Z0-9]+(?:\s+[가-힣a-zA-Z0-9]+)?\s*레시피)/i) ||
                    msg.match(/([가-힣a-zA-Z0-9]+(?:\s+[가-힣a-zA-Z0-9]+)?\s*유튜브)/i) ||
                    msg.match(/([가-힣a-zA-Z0-9]+(?:\s+[가-힣a-zA-Z0-9]+)?\s*(?:자세|운동법|훈련법|스피치|공부법))/i);
      if (kwMatch) {
        attachKeyword = kwMatch[1].trim().replace(/(등록|추가|해줘|첨부파일로|첨부로)$/, '').trim();
        if (/레시피/i.test(msg) && !/레시피/i.test(attachKeyword)) attachKeyword += ' 레시피';
      }
    }
    if (!attachKeyword) attachKeyword = '관련 가이드 영상';
    var encodedKw = encodeURIComponent(attachKeyword);
    attachUrl = 'https://www.youtube.com/results?search_query=' + encodedKw;
    attachTitle = attachKeyword + ' 유튜브 영상';
  }

  // 세부 도메인 판정
  var isWorkshop = /(워크숍|워크샵|전략회의|팀빌딩|해커톤|타운홀|컨퍼런스|세미나)/i.test(rawMsgWithoutRev);
  var isTravel = /(단체여행|팀여행|우정여행|가족여행|힐링여행|제주여행|해외여행|여행계획|여행준비|MT|엠티)/i.test(rawMsgWithoutRev) ||
                 (/(여행|휴가|캠핑)/i.test(rawMsgWithoutRev) && /(단체|모임|친구|팀|동기|함께|동행)/i.test(rawMsgWithoutRev));
  var isBirthday = /(생일|기념일|돌잔치|환갑|칠순|축하|파티)/i.test(rawMsgWithoutRev);
  var isBabyCare = /(아기|아이|영유아|신생아|자녀|육아|딸|아들|돌쟁이|출산|어린이집|유치원|소아과)/i.test(rawMsgWithoutRev) ||
                   (/(건강검진|발달|이유식|모유|분유|예방접종)/i.test(rawMsgWithoutRev) && /(아이|아기|자녀|영유아|생)/i.test(rawMsgWithoutRev));
  var isPet = /(반려동물|반려견|반려묘|강아지|고양이|댕댕이|집사|동물병원|배변|산책)/i.test(rawMsgWithoutRev);
  var isMarathon = /(마라톤|10km|5km|달리기|러닝|조깅|하프|풀코스|트랙|페이스)/i.test(rawMsgWithoutRev);
  var isDiet = /(다이어트|살빼기|체중|식단|감량|체지방|뱃살|칼로리)/i.test(rawMsgWithoutRev);
  var isExercise = isMarathon || isDiet || /(운동|헬스|피트니스|웨이트|근육|스쿼트|수영|자전거|사이클|필라테스|요가|크로스핏|등산|체력증진|유산소|근력)/i.test(rawMsgWithoutRev);
  var isMedicalHealth = !isBabyCare && !isPet && !isExercise && /(건강검진|병원|진료|치료|수술|복약|약|혈압|혈당|치과|스케일링|영양제|비타민|검진|의료|질환|수치|건강)/i.test(rawMsgWithoutRev);
  var isCertification = /(자격증|시험|합격|기사|토익|토플|오픽|공무원|수능|CPA|세무사|노무사|한국사|정보처리기사|취득)/i.test(rawMsgWithoutRev);
  var isFinance = /(저축|적금|예금|투자|주식|부동산|청약|재테크|목돈|시드머니|자산|가계부|절약|모으기|\d+[억만천]원?|\b돈\b|부자|소득|월급)/i.test(rawMsgWithoutRev);
  var isStudy = isCertification || /(공부|독서|책|학습|코딩|개발|프로그래밍|알고리즘|외국어|회화|영어|일본어|수학|강의)/i.test(rawMsgWithoutRev);
  var isCareer = isWorkshop || /(일|업무|사업|매출|취업|이직|프로젝트|포트폴리오|이력서|면접|퇴사|경력|마케팅|창업|스토어|고객)/i.test(rawMsgWithoutRev);
  var isHobby = isTravel || /(취미|음악|악기|피아노|기타|그림|사진|게임|여행|영상|유튜브|블로그|글쓰기|웹소설)/i.test(rawMsgWithoutRev);
  var isMind = /(마음|명상|수면|일기|감사|습관|기상|미라클|루틴|멘탈|정리|청소|도파민|디톡스)/i.test(rawMsgWithoutRev);
  var isRelation = isBirthday || /(친구|가족|연인|약속|모임|대화|결혼|부모|엄마|아빠|환갑|칠순)/i.test(rawMsgWithoutRev);

  // 깔끔한 목표 제목 정제
  var cleanTitle = rawMsgWithoutRev
    .replace(/^(목표설정|목표 설정|새로운 목표|새 목표|신규 목표|일정등록|일정 등록)[:\s]*/g, '')
    .replace(/(이번\s*주\s*일요일|이번\s*주\s*토요일|이번\s*주\s*금요일|이번\s*주|다음\s*주|내일|모레)/g, '')
    .replace(/(?:첨부파일로|첨부로|참고자료로|영상으로)\s*[^,\.\s]+\s*(?:레시피|유튜브|영상|링크|자료|팁)?\s*(?:등록해줘|등록|추가해줘|추가|찾아서|찾아줘|넣어줘|첨부해줘|첨부)?/g, '')
    .replace(/(?:레시피|유튜브|영상|링크|자료|팁)\s*(?:등록해줘|등록|추가해줘|추가|찾아서|찾아줘|넣어줘|첨부해줘|첨부)/g, '')
    .replace(/(목표설정해줘|목표설정|목표 설정해줘|목표 설정|일정등록해줘|일정등록|일정 등록해줘|일정 등록|목표를|목표로|목표|할일|마일스톤|추가해줘|추가|만들어줘|만들기|생성해줘|등록해줘|시작하기|시작|세워줘|세우기|잡아줘|잡기|설정해줘|설정|계획해줘|계획|추천해줘|추천|해줘|해주세요|하고 싶어|하고싶어|원해|요청|요청해줘|부탁해|하면서)/g, '')
    .replace(/\s*(?:등록|설정|추가|생성|계획)\s*$/g, '')
    .trim();

  if (isBabyCare) {
    if (birthMatch && targetAgeMatch) {
      cleanTitle = (birthMatch[1] ? ('20' + birthMatch[1].slice(-2)) : bYear) + '년 ' + bMonth + '월 ' + bDay + '일생 아기 만 ' + targetAgeMatch[1] + '세 건강 성장 관리';
    } else if (/아기|아이|자녀/i.test(cleanTitle)) {
      cleanTitle = cleanTitle.slice(0, 40);
    } else {
      cleanTitle = '우리아기 건강하게 키우기 및 성장 검진 관리';
    }
  } else if (!cleanTitle || cleanTitle.length < 2 || cleanTitle === '목표' || cleanTitle === '요청' || cleanTitle === '일정') {
    if (isBirthday) cleanTitle = '가족 생일 축하';
    else if (isWorkshop) cleanTitle = '성공적인 팀 워크숍 준비 및 실행';
    else if (isTravel) cleanTitle = '완벽한 단체 여행 준비 및 추억 만들기';
    else if (isCertification) cleanTitle = '목표 자격증 취득 및 시험 합격';
    else if (isFinance) cleanTitle = '목돈 모으기 및 자산 형성';
    else if (isMedicalHealth) cleanTitle = '정기 건강검진 및 일상 건강 관리';
    else if (isPet) cleanTitle = '반려동물 건강 관리 및 행복한 일상';
    else cleanTitle = '나만의 새로운 실천 목표';
  }

  // 대분류 및 마일스톤 생성
  var topic = 'mind';
  var topicMinor = '자기계발';

  if (isWorkshop) {
    topic = 'career';
    topicMinor = '기획/전략';
  } else if (isTravel) {
    topic = 'hobby';
    topicMinor = '여행/캠핑';
  } else if (isBabyCare) {
    topic = 'health';
    topicMinor = '육아 건강';
  } else if (isPet) {
    topic = 'relation';
    topicMinor = '반려동물';
  } else if (isRelation) {
    topic = 'relation';
    topicMinor = '가족/관계';
  } else if (isExercise) {
    topic = 'health';
    topicMinor = '운동/헬스';
  } else if (isMedicalHealth) {
    topic = 'health';
    topicMinor = '건강/검진';
  } else if (isCertification) {
    topic = 'study';
    topicMinor = '자격증/시험';
  } else if (isStudy) {
    topic = 'study';
    topicMinor = '학습/공부';
  } else if (isFinance) {
    topic = 'career';
    topicMinor = '재테크/자산';
  } else if (isCareer) {
    topic = 'career';
    topicMinor = '커리어/업무';
  } else if (isHobby) {
    topic = 'hobby';
    topicMinor = '취미/창작';
  } else if (isMind) {
    topic = 'mind';
    topicMinor = '마음/습관';
  }

  var m1 = '1단계: 시작 준비 및 실행 계획 수립';
  var t1 = ['세부 실천 계획 정리하기', '필요한 준비물 및 환경 구성하기'];
  var m2 = '2단계: 규칙적인 실천 루틴 확립';
  var t2 = ['기본 실천 꾸준히 이어가기', '진행 과정과 느낀 점 기록하기'];
  var m3 = '3단계: 최종 목표 달성 점검 및 습관화';
  var t3 = ['최종 결과 점검 및 피드백', '다음 성장 단계 수립하기'];
  var m1Atts = attachUrl ? [{ type: 'video', title: attachTitle, url: attachUrl }] : [];

  var totalDays = dueDate ? diffDays(today, dueDate) : 30;
  var d1 = addDays(today, Math.max(1, Math.round(totalDays * 1 / 3)));
  var d2 = addDays(today, Math.max(2, Math.round(totalDays * 2 / 3)));
  var d3 = dueDate || addDays(today, totalDays);

  if (isBabyCare) {
    if (childBirthDate) {
      // 2025-05-17 출생일 기준 만 3세(2028-05-17) 주요 영유아 건강검진 및 예방접종
      var d18m = addDays(childBirthDate, 18 * 30.4375); // ~2026-11-17
      var d24m = addDays(childBirthDate, 24 * 30.4375); // ~2027-05-17
      var d30m = addDays(childBirthDate, 30 * 30.4375); // ~2027-11-17
      var d36m = childTargetDate || addDays(childBirthDate, 36 * 30.4375);

      m1 = '1단계: 4차 영유아 건강검진 및 필수 예방접종 (생후 18~24개월)';
      t1 = [
        '4차 영유아 건강검진 문진표·발달선별검사표 작성 및 소아과 예약',
        '18개월 필수 예방접종(A형간염 2차, 일본뇌염 등) 완료',
        '1차 영유아 구강검진(생후 18~29개월) 치과 방문'
      ];
      d1 = d24m > today ? d24m : addDays(today, 60);

      m2 = '2단계: 만 2세 신체·언어 발달 점검 및 생활습관 형성 (생후 24~30개월)';
      t2 = [
        '한국 영유아 발달선별검사(K-DST) 언어 및 대소근육 발달 체크',
        '올바른 수면 루틴 및 영양 균형 식단(편식 예방) 정착',
        '2차 영유아 구강검진 및 치아 불소도포 점검'
      ];
      d2 = d30m > today && d30m > d1 ? d30m : addDays(d1, 180);

      m3 = '3단계: 5차 영유아 건강검진 및 만 3세 종합 성장 점검 (생후 30~36개월)';
      t3 = [
        '5차 영유아 건강검진(생후 30~36개월) 수검 및 신체 계측 평가',
        '만 3세까지의 필수 예방접종 누락 내역 종합 확인',
        '보육기관/유치원 제출용 영유아 건강검진 결과표 발급 및 보관'
      ];
      d3 = childTargetDate || d36m;
    } else {
      m1 = '1단계: 월령별 필수 영유아 건강검진 및 예방접종 일정 정리';
      t1 = ['국민건강보험 영유아 검진 대상 기간 조회', '필수 국가예방접종 수검 내역 체크', '단골 소아과 및 치과 검진 예약'];
      m2 = '2단계: 연령별 신체·언어 발달 단계 모니터링 및 생활 루틴 정착';
      t2 = ['대근육·소근육 발달 및 언어 표현력 관찰 기록', '규칙적인 수면 및 균형 잡힌 영양 식단 챙기기', '안전한 실내외 놀이 환경 조성'];
      m3 = '3단계: 성장 발달 종합 평가 및 다음 성장 주기 준비';
      t3 = ['영유아 건강검진 결과 확인 및 전문의 상담', '발달 상태 기록 정리', '다음 연령기 성장 가이드 확인'];
    }
  } else if (isWorkshop) {
    m1 = '1단계: 워크숍 기획안 수립 및 장소·예산 확정';
    t1 = ['워크숍 목적 및 타임테이블 확정하기', '행사장/숙소 대관 및 총 예산안 결재 받기'];
    m2 = '2단계: 세션 아젠다 및 팀빌딩 레크리에이션 준비';
    t2 = ['부서별 세션 발표자료 취합하기', '팀빌딩 프로그램 및 참가자 기념품/다과 준비하기'];
    m3 = '3단계: 워크숍 본행사 실행 및 액션플랜 도출·회고';
    t3 = ['시간대별 프로그램 및 네트워킹 진행하기', '워크숍 결과 보고서 및 후속 실행과제 정리하기'];
  } else if (isTravel) {
    m1 = '1단계: 여행 일정 및 항공·숙소 예약 확정';
    t1 = ['참여자 일정 투표 및 여행 일자 확정하기', '왕복 교통편(항공/열차) 및 숙소 예약 완료하기'];
    m2 = '2단계: 세부 동선 설계, 렌터카 및 맛집 리스트업';
    t2 = ['일자별 드라이브 코스 및 주요 관광지 동선 짜기', '로컬 대표 맛집 단체석 예약 및 렌터카 배차하기'];
    m3 = '3단계: 안전 여행 완주, 공용 경비 정산 및 사진 공유';
    t3 = ['준비물 체크리스트 점검 및 안전하게 여행 즐기기', '모임 통장 공용 경비 정산 및 단체 앨범 공유하기'];
  } else if (isBirthday) {
    m1 = '1단계: 생일 맞이 요리 및 선물 준비';
    t1 = ['미역국 및 맛있는 축하 음식 만들기', '생일 케이크 및 선물 챙기기'];
    m2 = '2단계: 가족 생일 축하 파티 및 기념';
    t2 = ['온 가족 모여 축하 노래 부르기', '축하 사진 촬영 및 소중한 추억 기록하기'];
    m3 = '3단계: 감사 회고 및 가족 앨범 정리';
    t3 = ['생일 파티 사진 정리 및 회고', '가족과 감사 인사 나누기'];
  } else if (isMarathon) {
    m1 = '1단계: 기초 러닝 적응 및 장비 점검 (주 2~3회, 3~5km)';
    t1 = ['발에 맞는 러닝화 및 복장 점검하기', '주 2~3회 가벼운 조깅(3km)으로 기초 호흡 적응하기'];
    m2 = '2단계: 주간 주행거리 증량 및 페이스 훈련 (5~8km)';
    t2 = ['1회 5km 지속주 완주 및 주간 15km 마일리지 달성하기', '대회 2주 전 8km 지속주로 목표 페이스 점검하기'];
    m3 = '3단계: 테이퍼링(컨디션 조절) 및 10km 완주 도전';
    t3 = ['대회 1주 전 훈련량 조절 및 충분한 수분/휴식 취하기', '10km 마라톤 완주 및 기록 회고하기'];
  } else if (isDiet) {
    m1 = '1단계: 기초 식단 구성 및 현재 식습관 점검';
    t1 = ['하루 섭취 칼로리 및 식단 기록하기', '물 2L 마시기 및 야식 줄이기'];
    m2 = '2단계: 규칙적인 유산소 운동 및 칼로리 조절 병행';
    t2 = ['주 4회 40분 이상 유산소 운동 실천하기', '단백질 위주 건강한 식사 유지하기'];
    m3 = '3단계: 목표 체중 달성 및 요요 없는 유지 습관 형성';
    t3 = ['최종 체중 및 체지방 측정 점검하기', '지속 가능한 건강 루틴 완성하기'];
  } else if (isPet) {
    m1 = '1단계: 동물병원 등록 및 필수 기초 건강검진·예방접종';
    t1 = ['단골 동물병원 등록 및 기초 신체 검진', '필수 혼합백신·광견병 예방접종 및 심장사상충 예방'];
    m2 = '2단계: 올바른 식이 관리 및 규칙적인 산책/놀이 루틴 정착';
    t2 = ['연령·체중별 맞춤 사료 급여 및 수분 섭취 체크', '매일 규칙적인 산책 및 실내 스트레스 해소 놀이'];
    m3 = '3단계: 위생 케어 및 주기적 건강 모니터링';
    t3 = ['정기 발톱·귀·치아 위생 관리 및 양치질', '이상 징후(식욕·배변 등) 관찰 및 반기별 건강 체크'];
  } else if (isMedicalHealth) {
    m1 = '1단계: 종합 건강검진 예약 및 현재 건강 상태 점검';
    t1 = ['건강검진 항목 선정 및 의료기관 예약', '기초 문진표 작성 및 주의사항 확인'];
    m2 = '2단계: 검진 결과 확인 및 맞춤 건강 관리 실천';
    t2 = ['검진 결과표 수령 및 전문의 소견 확인', '권장 복약/영양제 복용 및 식습관 개선'];
    m3 = '3단계: 건강 지표 추적 관리 및 정기 검진 습관화';
    t3 = ['주요 건강 지표(혈압·혈당 등) 주기적 측정 기록', '다음 정기 검진 일정 캘린더 등록'];
  } else if (isExercise) {
    m1 = '1단계: 운동 계획 수립 및 장비/루틴 준비';
    t1 = ['운동 루틴 및 시간대 계획하기', '필요한 장비 및 복장 챙기기'];
    m2 = '2단계: 주 3~4회 규칙적인 실천 이어가기';
    t2 = ['계획한 운동 성실히 완료하기', '운동 후 간단한 체크인 기록하기'];
    m3 = '3단계: 목표 체력/체중 달성 및 건강한 습관 정착';
    t3 = ['체력 변화 및 성취 점검하기', '다음 운동 루틴으로 업그레이드하기'];
  } else if (isCertification) {
    m1 = '1단계: 시험 출제 기준 분석 및 기본 개념 1회독';
    t1 = ['시험 일정 확정 및 접수', '기본서/강의 1회독 완독'];
    m2 = '2단계: 기출문제 집중 풀이 및 취약 단원 오답 정리';
    t2 = ['최근 5개년 기출문제 풀이', '오답 노트 작성 및 취약 개념 보완'];
    m3 = '3단계: 실전 모의고사 훈련 및 최종 합격 달성';
    t3 = ['실전 시간 배분 모의고사 3회 이상 완료', '시험 응시 및 최종 합격 점검'];
  } else if (isFinance) {
    m1 = '1단계: 현재 자산 현황 분석 및 저축/투자 목표 수립';
    t1 = ['월 고정 지출 및 수입 분석', '월별 목표 저축/투자 금액 확정'];
    m2 = '2단계: 자동 저축 파이프라인 가동 및 지출 관리';
    t2 = ['월급일 자동이체 적금/투자 계좌 설정', '불필요한 소비 줄이기 및 가계부 기록'];
    m3 = '3단계: 목표 자산 달성 점검 및 포트폴리오 리밸런싱';
    t3 = ['누적 자산 점검 및 성과 분석', '다음 분기 자산 배분 계획 수립'];
  } else if (isStudy) {
    m1 = '1단계: 학습 계획 수립 및 교재/강의 준비';
    t1 = ['학습 목표 분량 및 교재 선정하기', '주간 학습 스케줄 확정하기'];
    m2 = '2단계: 매일 핵심 분량 학습 및 복습 진행';
    t2 = ['일일 목표 챕터 집중 공부하기', '핵심 요약 및 오답 정리하기'];
    m3 = '3단계: 모의 점검 및 최종 목표 성적/합격 달성';
    t3 = ['모의 테스트 풀이 및 최종 점검하기', '시험 응시 또는 최종 과제 완료하기'];
  } else if (isCareer) {
    m1 = '1단계: 핵심 과제 정의 및 필요 자료 준비';
    t1 = ['핵심 마일스톤 및 일정 정의하기', '필요한 레퍼런스 및 데이터 수집하기'];
    m2 = '2단계: 주요 산출물 완성 및 실행 가속화';
    t2 = ['핵심 작업물 1차 버전 완료하기', '피드백 수렴 및 개선 반영하기'];
    m3 = '3단계: 최종 성과 검증 및 지속 성장 체계 구축';
    t3 = ['프로젝트 완료 및 성과 지표 측정하기', '회고 및 다음 액션 플랜 수립하기'];
  } else {
    // 범용 맞춤형 3단계 플랜
    m1 = '1단계: ' + cleanTitle.slice(0, 20) + ' 시작 준비 및 세부 계획 수립';
    t1 = ['핵심 목표 및 필요 준비물 정리하기', '주간별 세부 실천 일정 계획하기'];
    m2 = '2단계: ' + cleanTitle.slice(0, 20) + ' 핵심 실천 및 집중 실행';
    t2 = ['핵심 실행 과제 꾸준히 완료하기', '진행 과정과 느낀 점 체크인 기록하기'];
    m3 = '3단계: ' + cleanTitle.slice(0, 20) + ' 최종 달성 및 점검';
    t3 = ['최종 성과 점검 및 피드백 회고', '다음 성장 단계 수립하기'];
  }

  var isDailyPlan = /(일일|일자별|매일|데일리|30일\s*계획|30일\s*챌린지|한달\s*계획|한달\s*일일|한달\s*플랜|30개)/i.test(msg);
  if (isDailyPlan) {
    var dailyMilestones = [];
    var planSpan = dueDate ? diffDays(today, dueDate) : 30;
    var itemCount = Math.min(Math.max(planSpan, 30), 31);

    for (var di = 1; di <= itemCount; di++) {
      var dDate = addDays(today, di);
      var dayTitle = '';
      var dayTasks = [];
      if (isMarathon) {
        if (di === 1) { dayTitle = 'Day 1: 가벼운 3km 조깅 & 호흡 적응'; dayTasks = ['3km 조깅 완주', '러닝 후 종아리 스트레칭']; }
        else if (di === itemCount) { dayTitle = 'Day ' + di + ': 10km 마라톤 완주 및 기록 회고'; dayTasks = ['목표 페이스로 10km 완주', '완주 기록 및 소감 작성']; }
        else if (di % 7 === 0) { dayTitle = 'Day ' + di + ': 주간 지속주 테스트 및 장거리 회복'; dayTasks = ['목표 페이스 점검', '충분한 수분 및 영양 섭취']; }
        else if (di % 2 === 0) { dayTitle = 'Day ' + di + ': 하체 코어 운동 & 인터벌 러닝'; dayTasks = ['스쿼트/런지 3세트', '질주 인터벌 5회']; }
        else { dayTitle = 'Day ' + di + ': 페이스 유지 5km 러닝'; dayTasks = ['5km 일정한 페이스 유지', '러닝 자세 점검']; }
      } else if (isDiet) {
        if (di === 1) { dayTitle = 'Day 1: 식단 일기 시작 & 현재 체중 기록'; dayTasks = ['공복 체중 측정', '물 2L 마시기']; }
        else if (di === itemCount) { dayTitle = 'Day ' + di + ': 최종 인바디 측정 및 목표 체중 달성'; dayTasks = ['최종 체중 점검', '1개월 성과 회고']; }
        else if (di % 2 === 0) { dayTitle = 'Day ' + di + ': 40분 유산소 운동 & 저녁 소식'; dayTasks = ['빠르게 걷기 40분', '야식 금지']; }
        else { dayTitle = 'Day ' + di + ': 단백질 위주 식단 & 홈트레이닝'; dayTasks = ['단백질 60g 섭취', '복근 운동 15분']; }
      } else if (isStudy) {
        if (di === 1) { dayTitle = 'Day 1: 학습 분량 분배 및 1챕터 정독'; dayTasks = ['교재 1챕터 완독', '핵심 개념 요약노트']; }
        else if (di === itemCount) { dayTitle = 'Day ' + di + ': 실전 모의고사 풀이 및 합격 달성'; dayTasks = ['실전 시간 맞춰 풀기', '오답노트 최종 복습']; }
        else if (di % 7 === 0) { dayTitle = 'Day ' + di + ': 주간 누적 오답 복습 및 총정리'; dayTasks = ['틀린 문제 다시 풀기', '취약 개념 보강']; }
        else { dayTitle = 'Day ' + di + ': 일일 목표 단어 50개 암기 및 기출 풀이'; dayTasks = ['단어 50개 암기', '기출문제 20문항']; }
      } else {
        if (di === 1) { dayTitle = 'Day 1: 실천 환경 구축 및 첫 실행'; dayTasks = ['필요 도구 준비', '첫 실천 20분 완료']; }
        else if (di === itemCount) { dayTitle = 'Day ' + di + ': 최종 목표 달성 및 성장 회고'; dayTasks = ['성과 지표 점검', '다음 목표 계획']; }
        else { dayTitle = 'Day ' + di + ': 일일 루틴 실천 및 기록'; dayTasks = ['핵심 과제 1개 달성', '오늘의 체크인 기록']; }
      }

      dailyMilestones.push({
        title: dayTitle,
        dueDate: dDate,
        tasks: dayTasks
      });
    }

    var finalDue = addDays(today, itemCount);
    ops.push({
      type: 'CREATE',
      level: 'goal',
      data: {
        title: cleanTitle,
        dueDate: finalDue,
        topicMajor: topic,
        topicMinor: topicMinor,
        milestones: dailyMilestones
      },
      summary: '신규 목표 "' + cleanTitle + '" 및 ' + itemCount + '일 일일 플랜 생성 (' + addDays(today, 1) + ' ~ ' + finalDue + ')'
    });

    reply = '"' + cleanTitle + '" ' + itemCount + '일 일일단위 실천 계획을 준비했어요. 1일차(' + addDays(today, 1) + ')부터 ' + itemCount + '일차(' + finalDue + ')까지 날짜별로 마감일이 순차적으로 배치되었습니다. 이대로 적용할까요?';
    return { ops: ops, reply: reply };
  }

  ops.push({
    type: 'CREATE',
    level: 'goal',
    data: {
      title: cleanTitle,
      dueDate: dueDate || d3,
      topicMajor: topic,
      topicMinor: topicMinor,
      milestones: [
        { title: m1, tasks: t1, attachments: m1Atts, dueDate: d1 },
        { title: m2, tasks: t2, dueDate: d2 },
        { title: m3, tasks: t3, dueDate: d3 }
      ]
    },
    summary: '신규 목표 "' + cleanTitle + '" 및 3단계 마일스톤 생성' + (dueDate ? ' (일정: ' + dueDate + ')' : '') + (attachKeyword ? ' + ' + attachKeyword + ' 첨부' : '')
  });

  if (attachKeyword) {
    reply = attachKeyword + ' 유튜브링크를 찾아왔습니다. 첨부할까요?';
  } else {
    reply = '"' + cleanTitle + '" 목표와 맞춤 실행 마일스톤을 준비했어요.' + (dueDate ? ' 일정은 ' + dueDate + '로 잡았어요.' : '') + ' 이대로 적용할까요?';
  }

  return { ops: ops, reply: reply };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var message = (body.message || '').trim().slice(0, 300);
  var goals = Array.isArray(body.goals) ? body.goals.slice(0, 5) : [];
  var today = isDateStr(body.today) ? body.today : new Date().toISOString().slice(0, 10);
  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  console.log('[goalagent] request received: message="' + message + '", goalsCount=' + goals.length);

  var goalMap = {};
  goals.forEach(function (g) {
    if (!g || !g.id) return;
    var msMap = {};
    (Array.isArray(g.milestones) ? g.milestones : []).forEach(function (m) {
      if (!m || !m.id) return;
      var taskIds = {};
      (Array.isArray(m.tasks) ? m.tasks : []).forEach(function (t) { if (t && t.id) taskIds[t.id] = true; });
      msMap[m.id] = taskIds;
    });
    goalMap[g.id] = msMap;
  });

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 환경변수 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  var prompt = '당신은 습관·목표 관리 앱 "아워골"에서, 사용자가 "개인 목표" 화면 상단 채팅창에 입력한 자연어 요청을 읽고 ' +
    '목표(goal)·마일스톤(milestone)·할 일(task) 구조를 어떻게 바꿀지 판단해 변경사항(diff) 목록으로 정리해주는 도우미입니다.\n' +
    '실제로 데이터를 바꾸는 것이 아니라 "이렇게 바꿀까요?" 확인 화면에 보여줄 제안만 만듭니다. 사용자가 확인 후 반영 여부를 최종 결정합니다.\n\n' +
    '[오늘 날짜]\n' + today + '\n\n' +
    '[현재 목표 목록 - JSON. id는 실제 데이터 참조용이니 그대로 사용하세요. status는 todo/doing/done]\n' + JSON.stringify(goals) + '\n\n' +
    '[사용자 요청]\n"' + message + '"\n\n' +
    '먼저 속으로 어떤 항목을 어떻게 바꿀지 계획한 뒤, 아래 점검 기준으로 스스로 검토하고 다듬은 최종 결과만 출력하세요.\n' +
    '점검 기준:\n' +
    '(1) UPDATE·DELETE 대상의 goalId·milestoneId·taskId가 위 JSON에 실제로 존재하는 값인가\n' +
    '(2) 새로 만드는 항목(CREATE)에는 id를 절대 넣지 않았는가\n' +
    '(3) "10월", "다음 주" 같은 날짜 표현을 [오늘 날짜] 기준 정확한 YYYY-MM-DD로 변환했는가 (구체적인 날짜가 없으면 해당 월의 마지막 날을 사용)\n' +
    '(4) 사용자가 "일일 단위", "일자별(Day 1..Day 30)", "30일 챌린지", "주차별(1~4주차)", "단계별" 등 기간에 걸친 연속적인 계획을 요청한 경우: 절대 모든 항목의 dueDate를 최종 마감일(예: 한달 뒤) 하나로 똑같이 설정하지 마세요! [오늘 날짜]부터 시작해 Day 1은 +1일, Day 2는 +2일... 또는 주차별(+7일, +14일...)로 실제 실행 일자(YYYY-MM-DD)를 순차적으로 각각 다르게 배분하세요 (운동, 공부, 커리어, 습관 등 전 분야 필수 적용)\n' +
    '(5) 사용자가 언급하지 않은 목표·마일스톤·할 일은 절대 건드리지 않았는가\n' +
    '(6) summary가 각 변경사항을 한국어 한 문장으로 명확히 설명하는가\n' +
    '(7) JSON 형식이 정확한가\n\n' +
    '요청이 모호하거나 대상을 찾을 수 없으면 ops를 빈 배열로 두고 reply에 이유를 설명하세요. 절대 추측으로 엉뚱한 항목을 바꾸지 마세요.\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트, 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '{"ops":[{"type":"CREATE 또는 UPDATE 또는 DELETE","level":"goal 또는 milestone 또는 task",' +
    '"goalId":"UPDATE·DELETE 및 milestone·task 대상 작업에 필수 (CREATE goal 제외)",' +
    '"milestoneId":"level이 milestone인 UPDATE·DELETE, level이 task인 모든 작업에 필수",' +
    '"taskId":"level이 task인 UPDATE·DELETE에 필수",' +
    '"data":{"CREATE·UPDATE에서 바꿀 필드만 (아래 규칙 참고, DELETE는 생략)"},' +
    '"summary":"이 변경사항을 설명하는 한국어 한 문장"}],' +
    '"reply":"사용자에게 보여줄 1~2문장 응답 (요청 이해 내용 요약 또는 실패 이유)"}\n\n' +
    '전문 분야 및 특수 목표 지침:\n' +
    '- 사용자가 아기/자녀/영유아 육아, 영유아 건강검진, 예방접종, 성장 발달 등을 요청한 경우: 절대 성인 본인의 개인 운동·피트니스·다이어트 계획을 만들지 마세요! 생년월일(예: 25년 5월 17일생)과 목표 나이(예: 만 3살까지)에 맞는 실제 영유아 건강검진 차수(4차, 5차 등)와 구강검진, 필수 예방접종(A형간염, 일본뇌염 등), 성장 발달 체크리스트로 구성하세요.\n' +
    '- 목표가 수개월~수년 단위의 장기 목표인 경우(예: 만 3살까지 -> 2028년 5월 17일): 최종 dueDate를 해당 목표 완료 시점으로 정확히 산출하고, 마일스톤의 dueDate도 오늘부터 최종 목표일까지의 기간에 걸쳐 자연스러운 월령/연도별 시점으로 배분하세요. 절대 30일짜리 단기 일정으로 축소하지 마세요.\n' +
    '- 새 목표의 title은 "[수정보완 1회차]", "[추가수정보완 2회차]" 같은 대화용 부가 태그나 지시어를 완전히 제거하고, 간결하고 품격 있는 목표 이름(예: "2025년 5월 17일생 아기 만 3세까지 건강하게 키우기")으로 작성하세요.\n\n' +
    'data 필드 규칙:\n' +
    '- goal CREATE: title(필수), dueDate(YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm, null), topicMajor(health/study/career/hobby/mind/relation 중 하나, 선택), ' +
    'topicMinor(짧은 텍스트, 선택), milestones(선택, [{"title":"","dueDate":"YYYY-MM-DD(순차 분배)","tasks":["세부할일" 또는 {"title":"","dueDate":"YYYY-MM-DD"}],"attachments":[{"type":"video|image|text|link","title":"","url":""}]}] 형태)\n' +
    '- goal UPDATE: title, dueDate 중 바꿀 것만\n' +
    '- milestone CREATE: title(필수), tasks(선택, 문자열 또는 {title, dueDate} 배열), dueDate(선택, 순차 일자), attachments(선택)\n' +
    '- milestone UPDATE: title, dueDate, status(todo/doing/done), attachments 중 바꿀 것만\n' +
    '- task CREATE: title(필수), dueDate(선택, 순차 일자), attachments(선택)\n' +
    '- task UPDATE: title, done(true/false), dueDate, attachments 중 바꿀 것만\n' +
    '- DELETE는 data가 필요 없습니다.\n\n' +
    '첨부파일/유튜브 요청 대응 규칙:\n' +
    '- 사용자가 첨부파일, 참고자료, 레시피, 영상, 유튜브 등을 요청한 경우 (예: "이번주 일요일 아들생일 등록하면서 첨부파일로 미역국 레시피 등록해줘"), ' +
    '관련 유튜브 검색 링크(예: "https://www.youtube.com/results?search_query=...")를 attachments에 포함하고, ' +
    'reply는 반드시 "[키워드] 유튜브링크를 찾아왔습니다. 첨부할까요?" 형태로 명확히 응답하세요.';

  try {
    var parsed = null;

    // 1. Gemini 모델 캐스케이드 (429 Rate Limit 및 장애 대비 다중 플래시 모델 순차 호출)
    if (geminiApiKey) {
      var geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (var gi = 0; gi < geminiModels.length; gi++) {
        var gModel = geminiModels[gi];
        try {
          var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + gModel + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
              }
            })
          });
          if (geminiRes.ok) {
            var gData = await geminiRes.json();
            var gRaw = (gData.candidates && gData.candidates[0] && gData.candidates[0].content && gData.candidates[0].content.parts && gData.candidates[0].content.parts[0] && gData.candidates[0].content.parts[0].text) || '';
            var gClean = gRaw.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(gClean);
            console.log('[goalagent] Gemini (' + gModel + ') response parsed successfully');
            break;
          } else {
            var gErrText = await geminiRes.text().catch(function(){ return ''; });
            console.warn('[goalagent] Gemini (' + gModel + ') returned status:', geminiRes.status, gErrText.slice(0, 120));
            // 429인 경우 다른 모델 전환 전 짧은 대기
            if (geminiRes.status === 429 && gi < geminiModels.length - 1) {
              await new Promise(function(r){ setTimeout(r, 350); });
            }
          }
        } catch (ge) {
          console.warn('[goalagent] Gemini (' + gModel + ') error:', ge.message);
        }
      }
    }

    // 2. Anthropic Claude 최신 모델 캐스케이드 폴백
    if (!parsed && anthropicApiKey) {
      var anthropicModels = [
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-latest',
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-20241022',
        'claude-3-sonnet-20240229'
      ];
      for (var mi = 0; mi < anthropicModels.length; mi++) {
        var aModel = anthropicModels[mi];
        try {
          var headers = {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          };
          if (process.env.ANTHROPIC_WORKSPACE_ID) {
            headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;
          }
          var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              model: aModel,
              max_tokens: 2500,
              messages: [{ role: 'user', content: prompt }]
            })
          });
          if (anthropicRes.ok) {
            var aData = await anthropicRes.json();
            var aRaw = (aData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
            var aClean = aRaw.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(aClean);
            console.log('[goalagent] Anthropic (' + aModel + ') parsed successfully');
            break;
          } else {
            var aErr = await anthropicRes.text().catch(function(){ return ''; });
            console.warn('[goalagent] Anthropic (' + aModel + ') returned:', anthropicRes.status, aErr.slice(0, 150));
          }
        } catch (ae) {
          console.warn('[goalagent] Anthropic error with ' + aModel + ':', ae.message);
        }
      }
    }

    // 3. API 키가 없거나 외부 API 장애 시 로컬 스마트 폴백 적용
    if (!parsed || !Array.isArray(parsed.ops) || parsed.ops.length === 0) {
      console.log('[goalagent] Falling back to localGoalAgentFallback for:', message);
      var fallbackResult = localGoalAgentFallback(message, goals, today, goalMap);
      fallbackResult.ops = distributeSequentialDates(fallbackResult.ops, today, message);
      res.status(200).json(fallbackResult);
      return;
    }

    var ops = parsed.ops.slice(0, 40).map(function (op) { return processOp(op, goalMap); }).filter(Boolean);
    ops = distributeSequentialDates(ops, today, message);
    var reply = clampStr(parsed.reply, 200) || (ops.length ? '요청하신 변경사항을 준비했어요.' : '요청을 이해하지 못했어요.');

    res.status(200).json({ ops: ops, reply: reply });
  } catch (e) {
    console.error('[goalagent] Exception in handler:', e.message);
    var fb = localGoalAgentFallback(message, goals, today, goalMap);
    fb.ops = distributeSequentialDates(fb.ops, today, message);
    res.status(200).json(fb);
  }
};

module.exports.distributeSequentialDates = distributeSequentialDates;
module.exports.localGoalAgentFallback = localGoalAgentFallback;
