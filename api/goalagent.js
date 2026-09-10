module.exports.config = { maxDuration: 30 };

var TOPIC_KEYS = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
var STATUS_VALUES = ['todo', 'doing', 'done'];

function clampStr(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function isDateStr(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function sanitizeCreateGoalData(data) {
  data = data || {};
  var title = clampStr(data.title, 60);
  if (!title) return null;
  var milestones = Array.isArray(data.milestones) ? data.milestones.slice(0, 8).map(function (m) {
    return {
      title: clampStr(m && m.title, 60),
      tasks: Array.isArray(m && m.tasks) ? m.tasks.slice(0, 6).map(function (t) { return clampStr(t, 80); }).filter(Boolean) : []
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
    tasks: Array.isArray(data.tasks) ? data.tasks.slice(0, 6).map(function (t) { return clampStr(t, 80); }).filter(Boolean) : []
  };
}
function sanitizeUpdateMilestoneData(data) {
  data = data || {};
  var out = {}, has = false;
  if (typeof data.title === 'string' && data.title.trim()) { out.title = clampStr(data.title, 60); has = true; }
  if (data.dueDate === null || isDateStr(data.dueDate)) { out.dueDate = data.dueDate; has = true; }
  if (STATUS_VALUES.indexOf(data.status) !== -1) { out.status = data.status; has = true; }
  return has ? out : null;
}
function sanitizeCreateTaskData(data) {
  data = data || {};
  var title = clampStr(data.title, 80);
  return title ? { title: title } : null;
}
function sanitizeUpdateTaskData(data) {
  data = data || {};
  var out = {}, has = false;
  if (typeof data.title === 'string' && data.title.trim()) { out.title = clampStr(data.title, 80); has = true; }
  if (data.done === true || data.done === false) { out.done = data.done; has = true; }
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

// API 키 부재 또는 호출 실패 시 로컬 규칙 기반 스마트 폴백 엔진
function localGoalAgentFallback(message, goals, today, goalMap) {
  var msg = (message || '').trim();
  var ops = [];
  var reply = '';

  // 1. 완료/달성 의도 (예: "OO 완료", "OO 마일스톤 완료해줘", "OO 끝냈어")
  if (/(완료|끝냈|다했|체크)/.test(msg)) {
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

  // 2. 신규 목표 추가 의도 (예: "영어 회화 목표 추가해줘", "토익 900점 목표 만들어줘")
  if (/(추가|만들|생성|등록|시작)/.test(msg)) {
    var cleanTitle = msg.replace(/(목표|할일|마일스톤|추가해줘|추가|만들어줘|만들기|생성해줘|등록해줘|시작하기|시작|해줘|해주세요)/g, '').trim();
    if (!cleanTitle || cleanTitle.length < 2) cleanTitle = '새로운 실천 목표';

    var topic = 'study';
    if (/(운동|헬스|달리기|러닝|다이어트|건강|수영|자전거)/.test(msg)) topic = 'health';
    else if (/(공부|토익|영어|독서|책|자격증|시험|수학|학습)/.test(msg)) topic = 'study';
    else if (/(일|업무|사업|매출|취업|이직|코딩|개발|프로젝트|머니)/.test(msg)) topic = 'career';
    else if (/(취미|음악|그림|사진|게임|여행|영상|유튜브)/.test(msg)) topic = 'hobby';
    else if (/(마음|명상|수면|일기|감사|습관)/.test(msg)) topic = 'mind';
    else if (/(친구|가족|연인|약속|모임|대화)/.test(msg)) topic = 'relation';

    ops.push({
      type: 'CREATE',
      level: 'goal',
      data: {
        title: cleanTitle,
        dueDate: null,
        topicMajor: topic,
        topicMinor: '',
        milestones: [
          { title: '1단계: 시작 준비 및 실행 계획 수립', tasks: ['세부 계획 정리하기', '필요 도구/자료 준비하기'] },
          { title: '2단계: 주 3회 이상 꾸준히 실천하기', tasks: ['기본 실천 진행', '진행 과정 기록 남기기'] },
          { title: '3단계: 목표 달성 점검 및 습관화', tasks: ['최종 결과 점검', '회고 및 다음 단계 수립'] }
        ]
      },
      summary: '신규 목표 "' + cleanTitle + '" 및 3단계 마일스톤 생성'
    });
    reply = '"' + cleanTitle + '" 목표와 실행 마일스톤 초안을 준비했어요.';
    return { ops: ops, reply: reply };
  }

  // 3. 삭제 의도
  if (/(삭제|지워|제거)/.test(msg)) {
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

  // 매칭되는 기본 명령이 없을 때
  return {
    ops: [],
    reply: '요청을 완전히 해석하지 못했어요. "OO 목표 추가해줘" 또는 "OO 마일스톤 완료"처럼 명령해 주시거나, 정교한 AI 자연어 처리를 위해 Vercel에 GEMINI_API_KEY를 등록해 주세요.'
  };
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
    '(4) 사용자가 언급하지 않은 목표·마일스톤·할 일은 절대 건드리지 않았는가\n' +
    '(5) summary가 각 변경사항을 한국어 한 문장으로 명확히 설명하는가\n' +
    '(6) JSON 형식이 정확한가\n\n' +
    '요청이 모호하거나 대상을 찾을 수 없으면 ops를 빈 배열로 두고 reply에 이유를 설명하세요. 절대 추측으로 엉뚱한 항목을 바꾸지 마세요.\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트, 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '{"ops":[{"type":"CREATE 또는 UPDATE 또는 DELETE","level":"goal 또는 milestone 또는 task",' +
    '"goalId":"UPDATE·DELETE 및 milestone·task 대상 작업에 필수 (CREATE goal 제외)",' +
    '"milestoneId":"level이 milestone인 UPDATE·DELETE, level이 task인 모든 작업에 필수",' +
    '"taskId":"level이 task인 UPDATE·DELETE에 필수",' +
    '"data":{"CREATE·UPDATE에서 바꿀 필드만 (아래 규칙 참고, DELETE는 생략)"},' +
    '"summary":"이 변경사항을 설명하는 한국어 한 문장"}],' +
    '"reply":"사용자에게 보여줄 1~2문장 응답 (요청 이해 내용 요약 또는 실패 이유)"}\n\n' +
    'data 필드 규칙:\n' +
    '- goal CREATE: title(필수), dueDate(YYYY-MM-DD 또는 null), topicMajor(health/study/career/hobby/mind/relation 중 하나, 선택), ' +
    'topicMinor(짧은 텍스트, 선택), milestones(선택, [{"title":"","tasks":["",...]}] 형태)\n' +
    '- goal UPDATE: title, dueDate 중 바꿀 것만\n' +
    '- milestone CREATE: title(필수), tasks(선택, 문자열 배열), dueDate(선택)\n' +
    '- milestone UPDATE: title, dueDate, status(todo/doing/done) 중 바꿀 것만\n' +
    '- task CREATE: title(필수)\n' +
    '- task UPDATE: title, done(true/false) 중 바꿀 것만\n' +
    '- DELETE는 data가 필요 없습니다.';

  try {
    var parsed = null;

    // 1. Gemini 2.5 Flash 최우선 호출
    if (geminiApiKey) {
      try {
        var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(geminiApiKey), {
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
        }
      } catch (ge) {
        // Gemini 실패 시 다음 공급자 또는 로컬 폴백
      }
    }

    // 2. Anthropic Claude Sonnet 듀얼 폴백
    if (!parsed && anthropicApiKey) {
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
            model: 'claude-sonnet-4-6',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (anthropicRes.ok) {
          var aData = await anthropicRes.json();
          var aRaw = (aData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
          var aClean = aRaw.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(aClean);
        }
      } catch (ae) {
        // Anthropic 실패 시 로컬 폴백
      }
    }

    // 3. API 키가 없거나 외부 API 장애 시 로컬 스마트 폴백 적용
    if (!parsed || !Array.isArray(parsed.ops)) {
      var fallbackResult = localGoalAgentFallback(message, goals, today, goalMap);
      res.status(200).json(fallbackResult);
      return;
    }

    var ops = parsed.ops.slice(0, 20).map(function (op) { return processOp(op, goalMap); }).filter(Boolean);
    var reply = clampStr(parsed.reply, 200) || (ops.length ? '요청하신 변경사항을 준비했어요.' : '요청을 이해하지 못했어요.');

    res.status(200).json({ ops: ops, reply: reply });
  } catch (e) {
    // 예외 발생 시에도 로컬 폴백으로 부드럽게 복구
    var fb = localGoalAgentFallback(message, goals, today, goalMap);
    res.status(200).json(fb);
  }
};
