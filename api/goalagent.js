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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    return;
  }

  var body = req.body || {};
  var message = (body.message || '').trim().slice(0, 300);
  var goals = Array.isArray(body.goals) ? body.goals.slice(0, 3) : [];
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

  var headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  };
  if (process.env.ANTHROPIC_WORKSPACE_ID) {
    headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;
  }

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
    var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicRes.ok) {
      var errText = await anthropicRes.text().catch(function () { return ''; });
      res.status(502).json({ error: 'Anthropic API error', detail: errText.slice(0, 300) });
      return;
    }

    var data = await anthropicRes.json();
    var raw = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
    var clean = raw.replace(/```json|```/g, '').trim();
    var parsed = JSON.parse(clean);
    if (!parsed || !Array.isArray(parsed.ops)) throw new Error('bad shape');

    var ops = parsed.ops.slice(0, 20).map(function (op) { return processOp(op, goalMap); }).filter(Boolean);
    var reply = clampStr(parsed.reply, 200) || (ops.length ? '요청하신 변경사항을 준비했어요.' : '요청을 이해하지 못했어요.');

    res.status(200).json({ ops: ops, reply: reply });
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
