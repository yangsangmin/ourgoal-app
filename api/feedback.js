module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var goalTitle = body.goalTitle;
  var milestones = Array.isArray(body.milestones) ? body.milestones : [];
  var text = body.text;
  var theme = body.theme;
  var customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt.trim().slice(0, 2000) : '';
  if (!goalTitle || !text) {
    res.status(400).json({ error: 'goalTitle and text are required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiApiKey && !anthropicApiKey) {
    res.status(503).json({ error: 'AI API key is not configured on server' });
    return;
  }

  var THEME_PROMPTS = {
    mind: '이 기록은 [심리상태] 테마로 분류되었습니다. 사용자의 감정 상태, 멘탈 회복, 스트레스 관리 관점에서 깊이 공감하고 따뜻한 위로와 마인드셋 회복 조언을 포함하세요.',
    study: '이 기록은 [공부기록] 테마로 분류되었습니다. 학습 효율성, 복습 주기, 지식 습득의 깊이 관점에서 구체적이고 실천적인 학습 피드백을 제공하세요.',
    business: '이 기록은 [사업기록] 테마로 분류되었습니다. 업무 생산성, 비즈니스 성과, 마일스톤 진척도, 우선순위 관리 관점에서 전략적 피드백을 제공하세요.',
    schedule: '이 기록은 [약속기록] 테마로 분류되었습니다. 대인 관계, 네트워킹, 약속 이행 및 시간 관리 관점의 조언을 제공하세요.',
    workout: '이 기록은 [운동기록] 테마로 분류되었습니다. 신체 건강, 운동 루틴의 지속성, 점진적 과부하와 부상 방지 관점에서 활력 넘치는 피드백을 제공하세요.'
  };
  var themeBlock = (theme && THEME_PROMPTS[theme]) ? ('[기록 테마 코칭 지침]\n' + THEME_PROMPTS[theme] + '\n\n') : '';

  var personaBlock = customPrompt ? ('[페르소나 지침]\n' + customPrompt + '\n\n') : '';
  var roleLine = customPrompt
    ? '당신은 위 페르소나 지침에 따라 행동하는 목표 달성 피드백 봇입니다.'
    : '당신은 목표 달성 코치입니다.';

  var prompt = themeBlock + personaBlock + roleLine + ' 사용자의 목표 구조(마일스톤과 하위 할 일)와 방금 남긴 기록을 보고, ' +
    '그 기록이 목표 달성에 도움이 되는지 판단하고, 이 기록이 실제로 어떤 마일스톤이나 할 일의 진행 상태·결과를 바꿀 만한 확실한 근거가 되는지도 함께 판단하세요.\n\n' +
    '[사용자의 목표]\n최종 목표: ' + goalTitle + '\n\n' +
    '[마일스톤/할 일 목록 - JSON, id는 그대로 참조용. result는 {target,result,unit,note} 형태의 결과 기록칸]\n' + JSON.stringify(milestones) + '\n\n' +
    '[방금 남긴 기록]\n"' + text + '"\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트나 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '근거가 확실하지 않으면 suggestions는 빈 배열로 두세요. 애매하면 절대 추측해서 제안하지 마세요.\n' +
    '특히 기록에 특정 마일스톤·할 일과 관련된 구체적인 계획·방법·루틴(예: "주 3회 루틴 만들기" 항목에 대해 언제·어떻게 운동할지)이 담겨 있다면, ' +
    'field를 "note"로 하고 value에 사용자가 말한 내용을 1~2문장으로 자연스럽게 정리해 그 항목의 결과 메모로 제안하세요(사용자의 표현을 존중하되 군더더기 없이 요약).\n' +
    '{"verdict":"도움됨 또는 애매함 또는 도움안됨 중 하나",' +
    '"comment":"1문장의 짧고 솔직한 피드백",' +
    '"suggestions":[{"type":"milestone 또는 task","id":"위 목록에 있는 id 값 그대로",' +
    '"field":"status 또는 done 또는 result 또는 note 중 하나",' +
    '"value":"status면 todo/doing/done 중 하나, done이면 true/false, result면 result.target이 이미 있는 항목에 한해 새 숫자값, note면 기록 내용을 정리한 1~2문장 요약",' +
    '"reason":"왜 이렇게 판단했는지 1문장"}]}';

  try {
    var parsed = null;
    var providerUsed = '';

    // 1. Gemini 사용 (우선)
    if (geminiApiKey) {
      try {
        var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(geminiApiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (geminiRes.ok) {
          var geminiData = await geminiRes.json();
          var rawText = ((geminiData.candidates || [])[0] || {}).content && geminiData.candidates[0].content.parts
            ? geminiData.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('\n')
            : '';
          if (rawText) {
            var cleanText = rawText.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(cleanText);
            providerUsed = 'gemini';
          }
        } else {
          var errBody = await geminiRes.text().catch(function () { return ''; });
          console.warn('Gemini API returned error:', geminiRes.status, errBody.slice(0, 200));
        }
      } catch (geminiErr) {
        console.warn('Gemini call failed, trying Anthropic fallback if available:', geminiErr.message);
      }
    }

    // 2. Anthropic 사용 (Gemini 미설정 또는 실패 시 폴백)
    if (!parsed && anthropicApiKey) {
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
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (anthropicRes.ok) {
        var anthropicData = await anthropicRes.json();
        var rawAnthropic = (anthropicData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
        var cleanAnthropic = rawAnthropic.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(cleanAnthropic);
        providerUsed = 'claude';
      } else {
        var anthropicErr = await anthropicRes.text().catch(function () { return ''; });
        throw new Error('Anthropic API error ' + anthropicRes.status + ' ' + anthropicErr.slice(0, 200));
      }
    }

    if (!parsed || !parsed.verdict) {
      throw new Error('Could not parse valid AI feedback JSON');
    }
    if (!Array.isArray(parsed.suggestions)) {
      parsed.suggestions = [];
    }
    parsed.provider = providerUsed;

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message || 'unknown error' });
  }
};
