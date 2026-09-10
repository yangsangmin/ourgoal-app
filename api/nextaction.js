module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var goalTitle = body.goalTitle;
  var completedTitle = body.completedTitle;
  var remaining = Array.isArray(body.remaining) ? body.remaining : [];
  if (!goalTitle || !completedTitle) {
    res.status(400).json({ error: 'goalTitle and completedTitle are required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 환경변수 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  var prompt = '당신은 목표 달성 코치입니다. 사용자가 방금 아래 목표의 마일스톤 하나를 완료했습니다. ' +
    '축하 모달에 한 줄로 보여줄, 사용자가 지금 바로 이어서 하면 좋을 다음 행동을 제안하세요.\n\n' +
    '[목표]\n' + goalTitle + '\n' +
    '[방금 완료한 마일스톤]\n' + completedTitle + '\n' +
    '[남은 마일스톤/할 일 - JSON, status: todo/doing/done]\n' + JSON.stringify(remaining) + '\n\n' +
    '먼저 속으로 다음 행동을 정한 뒤, 아래 기준으로 스스로 점검하고 다듬은 최종 문장만 출력하세요.\n' +
    '점검 기준:\n' +
    '1. 위에 제공된 데이터에만 근거했는가 (남은 항목에 없는 내용을 지어내지 않았는가)\n' +
    '2. 축하하는 톤으로 시작해 구체적인 다음 행동 하나로 자연스럽게 이어지는가\n' +
    '3. 남은 항목이 없으면 다음 행동 대신 목표 결과를 기록해보라고 제안했는가\n' +
    '4. 공백 포함 25~50자 사이의 한 문장인가 (모자라면 보완하고, 넘치면 압축할 것)\n\n' +
    '점검을 마친 최종 문장만 출력하세요. 따옴표, 설명, 마크다운, 글자수 표기 없이 본문만 작성하세요.';

  function localActionFallback() {
    var next = remaining.find(function(m){ return m && m.status !== 'done'; });
    return next ? '멋져요! 다음으로 "' + next.title + '" 마일스톤을 시작해볼까요?' : '축하합니다! 모든 마일스톤을 마쳤으니 목표 최종 결과를 기록해보세요.';
  }

  try {
    var suggestion = '';

    // 1. Gemini 2.5 Flash 우선 호출
    if (geminiApiKey) {
      try {
        var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(geminiApiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
          })
        });
        if (geminiRes.ok) {
          var gData = await geminiRes.json();
          suggestion = (gData.candidates && gData.candidates[0] && gData.candidates[0].content && gData.candidates[0].content.parts && gData.candidates[0].content.parts[0] && gData.candidates[0].content.parts[0].text) || '';
        }
      } catch (ge) {}
    }

    // 2. Anthropic Claude Sonnet 듀얼 폴백
    if (!suggestion && anthropicApiKey) {
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
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (anthropicRes.ok) {
          var data = await anthropicRes.json();
          suggestion = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
        }
      } catch (ae) {}
    }

    // 3. 로컬 스마트 폴백
    if (!suggestion) {
      suggestion = localActionFallback();
    }

    res.status(200).json({ suggestion: suggestion.trim().replace(/^["']|["']$/g, '').slice(0, 100) });
  } catch (e) {
    res.status(200).json({ suggestion: localActionFallback() });
  }
};
