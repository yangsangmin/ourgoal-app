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
  var isBaby = /(아기|아이|영유아|신생아|자녀|육아|소아과|건강검진|예방접종)/i.test(desc);
  var topic = 'study';
  var topicMinor = '';
  if (isBaby) { topic = 'health'; topicMinor = '육아 건강'; }
  else if (/(운동|헬스|달리기|러닝|다이어트|웨이트|수영|자전거)/.test(desc)) { topic = 'health'; topicMinor = '운동/헬스'; }
  else if (/(건강검진|병원|진료|복약|의료|영양제)/.test(desc)) { topic = 'health'; topicMinor = '건강 관리'; }
  else if (/(공부|토익|영어|독서|책|자격증|시험|수학|학습)/.test(desc)) { topic = 'study'; topicMinor = '학습/자격'; }
  else if (/(일|업무|사업|매출|취업|이직|코딩|개발|프로젝트|머니|투자|재테크)/.test(desc)) { topic = 'career'; topicMinor = '커리어/자산'; }
  else if (/(취미|음악|그림|사진|게임|여행|영상|유튜브)/.test(desc)) { topic = 'hobby'; topicMinor = '취미/창작'; }
  else if (/(마음|명상|수면|일기|감사|습관|미라클모닝)/.test(desc)) { topic = 'mind'; topicMinor = '마음/습관'; }
  else if (/(친구|가족|연인|약속|모임|대화|부모님)/.test(desc)) { topic = 'relation'; topicMinor = '가족/관계'; }

  var cleanTitle = desc.replace(/(목표|할일|마일스톤|만들어줘|추가해줘|생성해줘|달성|하기)/g, '').trim().slice(0, 30);
  if (!cleanTitle || cleanTitle.length < 2) cleanTitle = desc.slice(0, 30) || '새로운 실행 목표';

  var milestones = [
    { title: '1단계: 시작 준비 및 계획 수립', tasks: ['실행 세부 계획 정리', '필요 도구/자료 준비'] },
    { title: '2단계: 규칙적인 핵심 실천', tasks: ['기본 실천 진행', '진행 과정 기록 남기기'] },
    { title: '3단계: 심화 실천 및 점검', tasks: ['중간 점검 및 보완', '실천 강도 높이기'] },
    { title: '4단계: 최종 목표 달성 및 습관화', tasks: ['최종 성과 확인', '회고 및 다음 단계 수립'] }
  ];

  if (isBaby) {
    cleanTitle = '우리아기 건강 성장 및 정기 검진 관리';
    milestones = [
      { title: '1단계: 월령별 영유아 건강검진 및 예방접종 일정 정리', tasks: ['검진 대상 기간 및 소아과 예약 확인', '필수 예방접종 수검 내역 체크'] },
      { title: '2단계: 연령별 신체·언어 발달 단계 모니터링', tasks: ['대소근육 및 표현 언어 발달 체크', '규칙적인 수면 및 영양 식단 관리'] },
      { title: '3단계: 영유아 구강검진 및 생활 루틴 정착', tasks: ['영유아 구강검진 및 치아 관리', '안전한 실내외 환경 구성'] },
      { title: '4단계: 성장 발달 종합 평가 및 다음 단계 준비', tasks: ['건강검진 결과 확인 및 전문의 상담', '성장 기록 정리 및 다음 가이드 확인'] }
    ];
  }

  return {
    title: cleanTitle,
    topicMajor: topic,
    topicMinor: topicMinor,
    milestones: milestones
  };
}

  var prompt = '당신은 습관·목표 관리 앱 "아워골"에서 사용자의 새 목표를 마일스톤·할 일 템플릿으로 만들어주는 도우미입니다.\n' +
    '사용자가 원하는 목표를 아래처럼 자유롭게 설명했습니다. 이를 바탕으로 실행 가능한 목표 템플릿을 만드세요.\n\n' +
    '[사용자 설명]\n"' + description + '"\n\n' +
    '먼저 속으로 계획을 구상한 뒤, 아래 점검 기준으로 스스로 검토하고 다듬은 최종 결과만 출력하세요.\n' +
    '점검 기준: (1) 마일스톤이 목표 달성까지 논리적인 순서로 배열되었는가 (2) 설명에 언급된 사용자의 현재 진행 상태가 첫 마일스톤에 반영되었는가 ' +
    '(3) 아기/육아/건강검진 요청인 경우 성인 운동 템플릿이 아닌 영유아 검진/발달 템플릿을 구성했는가 (4) 각 마일스톤에 실행 가능한 세부 할 일이 2~4개 있는가 (5) 마일스톤은 3~5개인가 (6) JSON 형식이 정확한가.\n\n' +
    '대분류(topicMajor)는 아래 6개 중 설명에 가장 어울리는 것을 고르세요. 설명에 카테고리가 언급되어 있으면 최대한 그 의도를 반영하세요.\n' +
    '- health: 운동·건강\n- study: 학습·자격\n- career: 커리어·머니\n- hobby: 취미·창작\n- mind: 마음·습관\n- relation: 관계·생활\n' +
    'topicMinor은 설명에 맞는 자연스러운 한 단어~짧은 구 (기존 목록에 없어도 새로 지어도 됨).\n\n' +
    '아래 JSON 형식으로만 답하세요. 다른 텍스트, 코드블록, 마크다운 없이 순수 JSON만 출력하세요.\n' +
    '{"title":"간결한 최종 목표 제목","topicMajor":"health/study/career/hobby/mind/relation 중 하나","topicMinor":"짧은 세부 분야",' +
    '"milestones":[{"title":"마일스톤 제목","tasks":["세부 할 일1","세부 할 일2"]}]}';

  try {
    var parsed = null;

    // 1. Gemini 다중 플래시 모델 캐스케이드
    if (geminiApiKey) {
      var geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (var gi = 0; gi < geminiModels.length; gi++) {
        var gModel = geminiModels[gi];
        try {
          var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + gModel + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
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
            break;
          }
        } catch (ge) {}
      }
    }

    // 2. Anthropic Claude 최신 모델 캐스케이드
    if (!parsed && anthropicApiKey) {
      var anthropicModels = ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-20241022'];
      for (var mi = 0; mi < anthropicModels.length; mi++) {
        var aModel = anthropicModels[mi];
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
              model: aModel,
              max_tokens: 1500,
              messages: [{ role: 'user', content: prompt }]
            })
          });
          if (anthropicRes.ok) {
            var aData = await anthropicRes.json();
            var aRaw = (aData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n');
            var aClean = aRaw.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(aClean);
            break;
          }
        } catch (ae) {}
      }
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
