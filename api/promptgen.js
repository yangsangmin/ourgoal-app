module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var description = (body.description || '').trim();
  if (!description) {
    res.status(400).json({ error: 'description is required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 환경변수 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

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
    var text = '';

    // 1. Gemini 2.5 Flash 우선 호출
    if (geminiApiKey) {
      try {
        var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + encodeURIComponent(geminiApiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: draftPrompt }] }],
            generationConfig: { temperature: 0.3 }
          })
        });
        if (geminiRes.ok) {
          var gData = await geminiRes.json();
          text = (gData.candidates && gData.candidates[0] && gData.candidates[0].content && gData.candidates[0].content.parts && gData.candidates[0].content.parts[0] && gData.candidates[0].content.parts[0].text) || '';
        }
      } catch (ge) {}
    }

    // 2. Anthropic Claude 듀얼 폴백
    if (!text && anthropicApiKey) {
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
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            messages: [{ role: 'user', content: draftPrompt }]
          })
        });
        if (anthropicRes.ok) {
          var aData = await anthropicRes.json();
          text = (aData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
        }
      } catch (ae) {}
    }

    // 3. 로컬 스마트 폴백
    if (!text) {
      text = '사용자의 지침: "' + description + '". 이 관점을 충실히 반영하여 사용자의 실천 기록을 따뜻하면서도 실천적인 피드백으로 코칭하세요.';
    }

    res.status(200).json({ prompt: text.trim().slice(0, 2000) });
  } catch (e) {
    res.status(200).json({
      prompt: '사용자의 지침: "' + description + '". 이 관점을 충실히 반영하여 사용자의 실천 기록을 따뜻하면서도 실천적인 피드백으로 코칭하세요.'
    });
  }
};
