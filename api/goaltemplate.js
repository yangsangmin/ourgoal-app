module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var description = (body.description || '').trim().slice(0, 500);
  if (!description) {
    res.status(400).json({ error: 'description is required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 환경변수 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var anthropicApiKey = process.env.ANTHROPIC_API_KEY;

// API 키 부재 또는 호출 실패 시 로컬 템플릿 스마트 폴백
function localGoalTemplateFallback(description) {
  var desc = (description || '').trim();
  var topic = 'study';
  if (/(운동|헬스|달리기|러닝|다이어트|건강|수영|자전거)/.test(desc)) topic = 'health';
  else if (/(공부|토익|영어|독서|책|자격증|시험|수학|학습)/.test(desc)) topic = 'study';
  else if (/(일|업무|사업|매출|취업|이직|코딩|개발|프로젝트|머니)/.test(desc)) topic = 'career';
  else if (/(취미|음악|그림|사진|게임|여행|영상|유튜브)/.test(desc)) topic = 'hobby';
  else if (/(마음|명상|수면|일기|감사|습관)/.test(desc)) topic = 'mind';
  else if (/(친구|가족|연인|약속|모임|대화)/.test(desc)) topic = 'relation';

  var cleanTitle = desc.replace(/(목표|할일|마일스톤|만들어줘|추가해줘|생성해줘|달성|하기)/g, '').trim().slice(0, 30);
  if (!cleanTitle || cleanTitle.length < 2) cleanTitle = desc.slice(0, 30) || '새로운 실행 목표';

  return {
    title: cleanTitle,
    topicMajor: topic,
    topicMinor: '',
    milestones: [
      { title: '1단계: 시작 준비 및 계획 수립', tasks: ['실행 세부 계획 정리', '필요 도구/자료 준비'] },
      { title: '2단계: 주 3회 이상 기본 실천', tasks: ['기본 실천 진행', '진행 과정 기록 남기기'] },
      { title: '3단계: 심화 실천 및 점검', tasks: ['중간 점검 및 보완', '실천 강도 높이기'] },
      { title: '4단계: 최종 목표 달성 및 습관화', tasks: ['최종 성과 확인', '회고 및 다음 단계 수립'] }
    ]
  };
}

  var prompt = '당신은 습관·목표 관리 앱 "아워골"에서 사용자의 새 목표를 마일스톤·할 일 템플릿으로 만들어주는 도우미입니다.\n' +
    '사용자가 원하는 목표를 아래처럼 자유롭게 설명했습니다. 이를 바탕으로 실행 가능한 목표 템플릿을 만드세요.\n\n' +
    '[사용자 설명]\n"' + description + '"\n\n' +
    '먼저 속으로 계획을 구상한 뒤, 아래 점검 기준으로 스스로 검토하고 다듬은 최종 결과만 출력하세요.\n' +
    '점검 기준: (1) 마일스톤이 목표 달성까지 논리적인 순서로 배열되었는가 (2) 설명에 언급된 사용자의 현재 진행 상태(예: "계정만 만들어둔 상태")가 첫 마일스톤에 반영되었는가 ' +
    '(3) 각 마일스톤에 실행 가능한 세부 할 일이 2~4개 있는가 (4) 마일스톤은 4~6개인가 (5) JSON 형식이 정확한가.\n\n' +
    '대분류(topicMajor)는 아래 6개 중 설명에 가장 어울리는 것을 고르세요. 설명에 카테고리가 언급되어 있으면 최대한 그 의도를 반영하세요.\n' +
    '- health: 운동·건강\n- study: 학습·자격\n- career: 커리어·머니\n- hobby: 취미·창작\n- mind: 마음·습관\n- relation: 관계·생활\n' +
    'topicMinor은 설명에 맞는 자연스러운 한 단어~짧은 구 (기존 목록에 없어도 새로 지어도 됨).\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트, 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '{"title":"간결한 최종 목표 제목","topicMajor":"health/study/career/hobby/mind/relation 중 하나","topicMinor":"짧은 세부 분야",' +
    '"milestones":[{"title":"마일스톤 제목","tasks":["세부 할 일1","세부 할 일2"]}]}';

  try {
    var parsed = null;

    // 1. Gemini 2.5 Flash 우선 호출
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
          var gData = await geminiRes.json();
          var gRaw = (gData.candidates && gData.candidates[0] && gData.candidates[0].content && gData.candidates[0].content.parts && gData.candidates[0].content.parts[0] && gData.candidates[0].content.parts[0].text) || '';
          var gClean = gRaw.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(gClean);
        }
      } catch (ge) {}
    }

    // 2. Anthropic Claude Sonnet 듀얼 폴백
    if (!parsed && anthropicApiKey) {
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
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (anthropicRes.ok) {
          var aData = await anthropicRes.json();
          var aRaw = (aData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
          var aClean = aRaw.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(aClean);
        }
      } catch (ae) {}
    }

    // 3. API 키가 없거나 외부 호출 실패 시 로컬 폴백
    if (!parsed || !parsed.title || !Array.isArray(parsed.milestones) || !parsed.milestones.length) {
      var fb = localGoalTemplateFallback(description);
      res.status(200).json(fb);
      return;
    }

    parsed.milestones = parsed.milestones.slice(0, 8).map(function (m) {
      return {
        title: String(m.title || '').slice(0, 60),
        tasks: Array.isArray(m.tasks) ? m.tasks.slice(0, 6).map(function (t) { return String(t).slice(0, 80); }) : []
      };
    }).filter(function (m) { return m.title; });

    res.status(200).json(parsed);
  } catch (e) {
    var fbErr = localGoalTemplateFallback(description);
    res.status(200).json(fbErr);
  }
};
