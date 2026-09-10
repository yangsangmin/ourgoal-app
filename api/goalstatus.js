module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 환경변수 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

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

  function localStatusFallback() {
    var doneCount = milestones.filter(function(m){ return m && m.status === 'done'; }).length;
    var total = milestones.length;
    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    return '현재 "' + goalTitle + '" 목표는 전체 마일스톤 중 ' + doneCount + '/' + total + '개(' + pct + '%)를 완료한 상태입니다. 세워둔 계획에 맞춰 다음 마일스톤을 차근차근 진행해 보세요.';
  }

  try {
    var summary = '';

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
          summary = (gData.candidates && gData.candidates[0] && gData.candidates[0].content && gData.candidates[0].content.parts && gData.candidates[0].content.parts[0] && gData.candidates[0].content.parts[0].text) || '';
        }
      } catch (ge) {}
    }

    // 2. Anthropic Claude Sonnet 듀얼 폴백
    if (!summary && anthropicApiKey) {
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
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (anthropicRes.ok) {
          var data = await anthropicRes.json();
          summary = (data.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
        }
      } catch (ae) {}
    }

    // 3. 로컬 스마트 폴백
    if (!summary) {
      summary = localStatusFallback();
    }

    res.status(200).json({ summary: summary.trim().replace(/^["']|["']$/g, '').slice(0, 300) });
  } catch (e) {
    res.status(200).json({ summary: localStatusFallback() });
  }
};
