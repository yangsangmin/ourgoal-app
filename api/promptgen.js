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
  var description = (body.description || '').trim();
  if (!description) {
    res.status(400).json({ error: 'description is required' });
    return;
  }

  var prompt = '당신은 습관·목표 관리 앱 "아워골"의 AI 피드백 봇 페르소나를 설계하는 프롬프트 엔지니어입니다.\n' +
    '사용자가 자신이 원하는 피드백 스타일을 아래처럼 설명했습니다. 이 설명을 바탕으로, 실제 기록을 보고 피드백을 생성할 다른 AI에게 내릴 "페르소나 지침"을 작성하세요.\n\n' +
    '[사용자 설명]\n"' + description + '"\n\n' +
    '지침 작성 규칙:\n' +
    '- 한국어로, AI에게 지시하는 어조로 3~6문장 작성 (사용자에게 말하듯 쓰지 말 것)\n' +
    '- 사용자의 목표, 원하는 톤(예: 엄격함/다정함/전문성), 피드백에서 강조해야 할 관점이나 판단 기준을 구체적으로 담을 것\n' +
    '- 실제 피드백은 다른 곳에서 정해진 JSON 형식으로 출력되므로, 여기서는 출력 형식을 지시하지 말고 톤과 관점, 판단 기준만 정의할 것\n\n' +
    '순수 텍스트로 지침 본문만 출력하세요. 따옴표, 설명, 마크다운 없이 지침 문장만 작성하세요.';

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
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!anthropicRes.ok) {
      var errText = await anthropicRes.text().catch(function () { return ''; });
      res.status(502).json({
        error: 'Anthropic API error',
        detail: errText.slice(0, 300)
      });
      return;
    }

    var data = await anthropicRes.json();
    var raw = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
    if (!raw) throw new Error('empty response');

    res.status(200).json({ prompt: raw });
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
