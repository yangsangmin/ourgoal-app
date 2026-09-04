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
    '사용자가 자신이 원하는 피드백 스타일을 아래처럼 설명했습니다. 이 설명을 바탕으로, 실제 기록을 보고 피드백을 생성할 다른 AI에게 내릴 "페르소나 지침"을 작성하세요.\n\n' +
    '[사용자 설명]\n"' + description + '"\n\n' +
    '지침 작성 규칙:\n' +
    '- 한국어로, AI에게 지시하는 어조로 작성 (사용자에게 말하듯 쓰지 말 것)\n' +
    '- 사용자의 목표, 원하는 톤(예: 엄격함/다정함/전문성), 피드백에서 강조해야 할 관점이나 판단 기준을 구체적으로 담을 것\n' +
    '- 필요한 만큼 상세하게 쓰되 2000자를 넘기지 말고, 반드시 완결된 문장으로 마무리할 것(문장 중간에 끊지 말 것)\n' +
    '- 실제 피드백은 다른 곳에서 정해진 JSON 형식으로 출력되므로, 여기서는 출력 형식을 지시하지 말고 톤과 관점, 판단 기준만 정의할 것\n\n' +
    '순수 텍스트로 지침 본문만 출력하세요. 따옴표, 설명, 마크다운 없이 지침 문장만 작성하세요.';

  try {
    var draft = await askClaude(draftPrompt, 1600);
    if (!draft.text) throw new Error('empty draft response');

    var reviewPrompt = '당신은 AI 피드백 봇 페르소나 지침의 품질을 검수하는 검수자입니다.\n' +
      '아래는 사용자의 원래 요청과, 그에 맞춰 초안으로 작성된 페르소나 지침입니다.\n\n' +
      '[사용자의 원래 요청]\n"' + description + '"\n\n' +
      '[초안 지침' + (draft.truncated ? ' — 글자 수 제한으로 문장이 중간에 끊겼을 수 있음' : '') + ']\n"' + draft.text + '"\n\n' +
      '검수 기준:\n' +
      '1. 문장이 중간에 끊기지 않고 완결되었는가 (끊겼다면 자연스럽게 마무리하거나 정리할 것)\n' +
      '2. 사용자가 요청한 목표·톤·판단 기준이 실제로 잘 반영되었는가 (부족하면 보완할 것)\n' +
      '3. 실제 다른 AI에게 내리는 지침으로서 명확하고 실행 가능한가\n' +
      '4. 2000자를 넘지 않는가 (넘으면 핵심을 유지하며 압축할 것)\n\n' +
      '위 기준에 맞게 다듬은 최종 지침 텍스트만 출력하세요. 초안이 이미 기준을 충족하면 그대로 출력해도 됩니다. ' +
      '다른 설명, 검수 코멘트, 따옴표, 마크다운 없이 최종 지침 본문만 출력하세요.';

    var final = await askClaude(reviewPrompt, 1600);
    var resultText = (final.text || draft.text).slice(0, 2000);
    if (!resultText) throw new Error('empty final response');

    res.status(200).json({ prompt: resultText });
  } catch (e) {
    res.status(e && e.isUpstream ? 502 : 500).json({ error: e.message || 'unknown error' });
  }
};
