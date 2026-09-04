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
  var description = (body.description || '').trim();
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

  async function askClaude(prompt, maxTokens) {
    var anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!anthropicRes.ok) {
      var errText = await anthropicRes.text().catch(function () { return ''; });
      var err = new Error('Anthropic API error: ' + errText.slice(0, 300));
      err.isUpstream = true;
      throw err;
    }
    var data = await anthropicRes.json();
    var text = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
    return { text: text, truncated: data.stop_reason === 'max_tokens' };
  }

  var draftPrompt = '당신은 습관·목표 관리 앱 "아워골"의 AI 피드백 봇 페르소나를 설계하는 프롬프트 엔지니어입니다.\n' +
    '사용자가 원하는 피드백 스타일을 아래처럼 설명했습니다. 이 설명을 바탕으로, 실제 기록을 보고 피드백을 생성할 다른 AI에게 내릴 "페르소나 지침"을 작성하세요.\n\n' +
    '먼저 어떤 내용을 담을지 속으로 구상한 뒤, 아래 점검 기준으로 스스로 검토하고 다듬은 최종 버전만 출력하세요(초안이나 검토 과정은 출력하지 말 것).\n' +
    '점검 기준: (1) 사용자가 말한 목표·톤·판단 기준이 구체적으로 반영되었는가 (2) 실제 다른 AI에게 내리는 지침으로서 명확하고 실행 가능한가 (3) 문장이 중간에 끊기지 않고 완결되었는가 (4) 2000자를 넘지 않는가.\n\n' +
    '[사용자 설명]\n"' + description + '"\n\n' +
    '작성 규칙:\n' +
    '- 한국어로, AI에게 지시하는 어조로 작성 (사용자에게 말하듯 쓰지 말 것)\n' +
    '- 필요한 만큼 상세히 쓰되 2000자 이내로, 반드시 완결된 문장으로 마무리할 것\n' +
    '- 출력 형식은 지시하지 말고 톤·관점·판단 기준만 정의할 것\n\n' +
    '점검을 마친 최종 지침 본문만 출력하세요. 따옴표, 설명, 마크다운 없이 지침 문장만 작성하세요.';

  try {
    var first = await askClaude(draftPrompt, 1500);
    var text = first.text;
    if (!text) throw new Error('empty response');

    if (first.truncated) {
      var continuePrompt = '아래 글이 글자 수 제한 때문에 문장 중간에서 끊겼습니다. 지금까지의 흐름과 어조를 그대로 이어받아, ' +
        '처음부터 다시 쓰지 말고 끊긴 지점부터 자연스럽게 이어서 문장을 완결하는 내용만 짧게 이어 써주세요.\n\n"' + text + '"';
      var cont = await askClaude(continuePrompt, 300);
      if (cont.text) text = (text + ' ' + cont.text).trim();
    }

    res.status(200).json({ prompt: text.slice(0, 2000) });
  } catch (e) {
    res.status(e && e.isUpstream ? 502 : 500).json({ error: e.message || 'unknown error' });
  }
};
