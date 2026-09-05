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
  var dueDate = body.dueDate || null;
  var goalResult = body.goalResult || null;
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

  var prompt = '당신은 목표 달성 코치입니다. 아래 목표와 마일스톤·하위 할 일의 진행 상태·결과 데이터를 보고, ' +
    '사용자가 목표 화면에서 매일 확인할 "현재 종합상황" 요약을 작성하세요.\n\n' +
    '[목표]\n' + goalTitle + '\n' +
    '[마감일]\n' + (dueDate || '없음') + '\n' +
    '[목표 최종 결과 입력값]\n' + JSON.stringify(goalResult) + '\n' +
    '[마일스톤/할 일 - JSON, status: todo/doing/done, result: {target,result,unit,note}]\n' + JSON.stringify(milestones) + '\n\n' +
    '먼저 속으로 현재 상태를 판단한 뒤, 아래 기준으로 스스로 점검하고 다듬은 최종 문장만 출력하세요.\n' +
    '점검 기준:\n' +
    '1. 위에 제공된 데이터에만 근거했는가 (데이터에 없는 내용을 추측하거나 과장하지 않았는가)\n' +
    '2. 현재 상태에 대한 판단과, 다음에 하면 좋을 구체적인 행동 제안이 함께 담겼는가\n' +
    '3. 전문적이면서도 자연스러운 한국어 문장인가\n' +
    '4. 공백 포함 정확히 150~200자 사이인가 (모자라면 보완하고, 넘치면 압축할 것)\n\n' +
    '점검을 마친 최종 요약 문장만 출력하세요. 따옴표, 설명, 마크다운, 글자수 표기 없이 본문만 작성하세요.';

  try {
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
      res.status(502).json({ error: 'Anthropic API error', detail: errText.slice(0, 300) });
      return;
    }

    var data = await anthropicRes.json();
    var summary = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
    if (!summary) throw new Error('empty response');

    res.status(200).json({ summary: summary });
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
