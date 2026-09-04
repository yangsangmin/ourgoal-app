module.exports.config = { maxDuration: 30 };

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
  var description = (body.description || '').trim().slice(0, 500);
  if (!description) {
    res.status(400).json({ error: 'description is required' });
    return;
  }

  var headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  };
  if (process.env.ANTHROPIC_WORKSPACE_ID) {
    headers['anthropic-workspace-id'] = process.env.ANTHROPIC_WORKSPACE_ID;
  }

  var prompt = '당신은 습관·목표 관리 앱 "아워골"에서 사용자의 새 목표를 마일스톤·할 일 템플릿으로 만들어주는 도우미입니다.\n' +
    '사용자가 원하는 목표를 아래처럼 자유롭게 설명했습니다. 이를 바탕으로 실행 가능한 목표 템플릿을 만드세요.\n\n' +
    '[사용자 설명]\n"' + description + '"\n\n' +
    '먼저 속으로 계획을 구상한 뒤, 아래 점검 기준으로 스스로 검토하고 다듬은 최종 결과만 출력하세요.\n' +
    '점검 기준: (1) 마일스톤이 목표 달성까지 논리적인 순서로 배열되었는가 (2) 설명에 언급된 사용자의 현재 진행 상태(예: "계정만 만들어둔 상태")가 첫 마일스톤에 반영되었는가 ' +
    '(3) 각 마일스톤에 실행 가능한 세부 할 일이 2~4개 있는가 (4) 마일스톤은 4~6개인가 (5) JSON 형식이 정확한가.\n\n' +
    '대분류(topicMajor)는 아래 6개 중 설명에 가장 어울리는 것을 고르세요. 설명에 카테고리가 언급되어 있으면 최대한 그 의도를 반영하세요.\n' +
    '- health: 운동·건강\n- study: 학습·자격\n- career: 커리어·머니\n- hobby: 취미·창작\n- mind: 마음·습관\n- relation: 관계·생활\n' +
    'topicMinor은 설명에 맞는 자연스러운 한 단어~짧은 구 (기존 목록에 없어도 새로 지어도 됨).\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트, 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '{"title":"간결한 최종 목표 제목","topicMajor":"health/study/career/hobby/mind/relation 중 하나","topicMinor":"짧은 세부 분야",' +
    '"milestones":[{"title":"마일스톤 제목","tasks":["세부 할 일1","세부 할 일2"]}]}';

  try {
    var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
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
    if (!parsed || !parsed.title || !Array.isArray(parsed.milestones) || !parsed.milestones.length) {
      throw new Error('bad shape');
    }
    parsed.milestones = parsed.milestones.slice(0, 8).map(function (m) {
      return {
        title: String(m.title || '').slice(0, 60),
        tasks: Array.isArray(m.tasks) ? m.tasks.slice(0, 6).map(function (t) { return String(t).slice(0, 80); }) : []
      };
    }).filter(function (m) { return m.title; });

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
