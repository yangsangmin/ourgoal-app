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
  var milestones = body.milestones || '없음';
  var text = body.text;
  if (!goalTitle || !text) {
    res.status(400).json({ error: 'goalTitle and text are required' });
    return;
  }

  var prompt = '당신은 목표 달성 코치입니다. 사용자의 목표와 방금 남긴 기록을 보고 그 행동이 목표 달성에 도움이 되는지 판단하세요.\n\n' +
    '[사용자의 목표]\n최종 목표: ' + goalTitle + '\n마일스톤: ' + milestones + '\n\n' +
    '[방금 남긴 기록]\n"' + text + '"\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트나 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '{"verdict":"도움됨 또는 애매함 또는 도움안됨 중 하나","comment":"1문장의 짧고 솔직한 피드백"}';

  try {
    var headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
        max_tokens: 300,
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
    if (!parsed || !parsed.verdict) throw new Error('bad shape');

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
