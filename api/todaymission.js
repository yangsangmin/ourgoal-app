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
  var goalTitle = body.goalTitle;
  var milestones = Array.isArray(body.milestones) ? body.milestones : [];
  if (!goalTitle) {
    res.status(400).json({ error: 'goalTitle is required' });
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

  var prompt = '당신은 목표 달성 코치입니다. 아래 목표와 마일스톤·하위 할 일의 진행 상태를 보고, ' +
    '사용자가 오늘 하루 안에 부담 없이 해낼 수 있는 아주 작은 할 일 1개를 "오늘의 미션"으로 제안하세요.\n\n' +
    '[목표]\n' + goalTitle + '\n' +
    '[마일스톤/할 일 - JSON, status: todo/doing/done]\n' + JSON.stringify(milestones) + '\n\n' +
    '먼저 속으로 오늘의 미션을 정한 뒤, 아래 기준으로 스스로 점검하고 다듬은 최종 문장만 출력하세요.\n' +
    '점검 기준:\n' +
    '1. 위에 제공된 마일스톤/할 일 중 아직 끝나지 않은 것에 근거했는가 (이미 done인 항목을 다시 제안하지 않았는가)\n' +
    '2. 오늘 하루, 짧은 시간 안에 실제로 해낼 수 있을 만큼 작고 구체적인 행동인가 (거창한 목표 자체를 반복하지 않았는가)\n' +
    '3. 명령형이 아닌 다정한 제안 톤인가\n' +
    '4. 공백 포함 15~40자 사이의 한 문장인가 (모자라면 보완하고, 넘치면 압축할 것)\n\n' +
    '점검을 마친 최종 문장만 출력하세요. 따옴표, 설명, 마크다운, 글자수 표기 없이 본문만 작성하세요.';

  try {
    var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicRes.ok) {
      var errText = await anthropicRes.text().catch(function () { return ''; });
      res.status(502).json({ error: 'Anthropic API error', detail: errText.slice(0, 300) });
      return;
    }

    var data = await anthropicRes.json();
    var mission = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
    if (!mission) throw new Error('empty response');

    res.status(200).json({ mission: mission });
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
