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
  var text = body.text;
  if (!goalTitle || !text) {
    res.status(400).json({ error: 'goalTitle and text are required' });
    return;
  }

  var prompt = '당신은 목표 달성 코치입니다. 사용자의 목표 구조(마일스톤과 하위 할 일)와 방금 남긴 기록을 보고, ' +
    '그 기록이 목표 달성에 도움이 되는지 판단하고, 이 기록이 실제로 어떤 마일스톤이나 할 일의 진행 상태를 바꿀 만한 확실한 근거가 되는지도 함께 판단하세요.\n\n' +
    '[사용자의 목표]\n최종 목표: ' + goalTitle + '\n\n' +
    '[마일스톤/할 일 목록 - JSON, id는 그대로 참조용]\n' + JSON.stringify(milestones) + '\n\n' +
    '[방금 남긴 기록]\n"' + text + '"\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트나 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '근거가 확실하지 않으면 suggestions는 빈 배열로 두세요. 애매하면 절대 추측해서 제안하지 마세요.\n' +
    '{"verdict":"도움됨 또는 애매함 또는 도움안됨 중 하나",' +
    '"comment":"1문장의 짧고 솔직한 피드백",' +
    '"suggestions":[{"type":"milestone 또는 task","id":"위 목록에 있는 id 값 그대로","field":"status 또는 done 또는 result","value":"status면 todo/doing/done 중 하나, done이면 true/false, result면 result.target이 이미 있는 항목에 한해 새 숫자값","reason":"왜 이렇게 판단했는지 1문장"}]}';

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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicRes.ok) {
      var errText = await anthropicRes.text().catch(function () { return ''; });
      res.status(502).json({
        error: 'Anthropic API error',
        detail: errText.slice(0, 300),
        resolvedWorkspaceId: anthropicRes.headers.get('anthropic-workspace-id') || null
      });
      return;
    }

    var data = await anthropicRes.json();
    var raw = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
    var clean = raw.replace(/```json|```/g, '').trim();
    var parsed = JSON.parse(clean);
    if (!parsed || !parsed.verdict) throw new Error('bad shape');
    if (!Array.isArray(parsed.suggestions)) parsed.suggestions = [];

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
