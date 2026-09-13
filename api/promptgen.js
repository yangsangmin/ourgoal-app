module.exports.config = { maxDuration: 30 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};

  // [TASK-ES-048] Gemini 2.5 Flash 기반 아바타 얼굴 비전 디코더 서브 라우팅
  if (body.image || body.action === 'avatar-face') {
    return handleAvatarFaceVision(req, res, body);
  }

  var description = (body.description || '').trim();
  if (!description) {
    res.status(400).json({ error: 'description is required' });
    return;
  }

  // API 키 결정: 1) 클라이언트 전달 Gemini키 2) 서버 환경변수 GEMINI_API_KEY 3) 서버 ANTHROPIC_API_KEY
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '');
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

    // 1. Gemini 다중 플래시 모델 캐스케이드 (우선)
    if (geminiApiKey) {
      var geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (var gi = 0; gi < geminiModels.length; gi++) {
        var gModel = geminiModels[gi];
        try {
          var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + gModel + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
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
            if (text) break;
          }
        } catch (ge) {}
      }
    }

    // 2. Anthropic Claude 최신 모델 캐스케이드 폴백
    if (!text && anthropicApiKey) {
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
              messages: [{ role: 'user', content: draftPrompt }]
            })
          });
          if (anthropicRes.ok) {
            var aData = await anthropicRes.json();
            text = (aData.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('\n').trim();
            if (text) break;
          }
        } catch (ae) {}
      }
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

async function handleAvatarFaceVision(req, res, body) {
  try {
    var imageBase64 = body.image;
    var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
    var geminiApiKey = clientGeminiKey || (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '');

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    var mimeType = 'image/jpeg';
    var rawData = imageBase64;
    var match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      rawData = match[2];
    }

    if (!geminiApiKey) {
      return res.status(200).json({ ok: true, fallback: true, features: getSmartFallbackFeatures() });
    }

    var theme = body.theme || {};
    var themeName = theme.name || '열정 러너';
    var themeCat = theme.cat || '스포츠';
    var themeGear = theme.gear || '활동복';

    // [1순위] 구글 AI 스튜디오 최신 멀티모달 생성 모델 (Gemini 3.1 Flash-Lite Image)
    // 사용자의 실제 사진 속 이목구비, 헤어스타일, 안경, 표정을 반영한 3등신 한국 웹툰풍 캐릭터 이미지 직접 생성
    var imageGenPrompt =
      "Create a charming 3-deformed (chibi) cartoon avatar illustration in modern Korean webtoon style based on the facial features, hairstyle, glasses (if any), and facial impression of the person in this photo.\n" +
      "Theme / Concept: [" + themeName + "] (" + themeCat + " theme, featuring " + themeGear + ")\n" +
      "Art Direction:\n" +
      "- 3-deformed chibi cute proportions, full body or expressive bust\n" +
      "- Distinctive face resembling the person's real hair, eye shape, glasses, and warm friendly smile\n" +
      "- Clean circular badge avatar format with soft colorful background, crisp vibrant outlines\n" +
      "- High quality digital webtoon illustration";

    var imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'nano-banana-pro-preview'];
    var generatedAvatarUrl = null;

    for (var m = 0; m < imageModels.length; m++) {
      var imgModel = imageModels[m];
      try {
        var imgUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + imgModel + ':generateContent?key=' + encodeURIComponent(geminiApiKey);
        var imgPayload = {
          contents: [{
            parts: [
              { text: imageGenPrompt },
              { inlineData: { mimeType: mimeType, data: rawData } }
            ]
          }]
        };

        var imgResponse = await fetch(imgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imgPayload)
        });

        if (imgResponse.ok) {
          var imgResData = await imgResponse.json();
          var candidate = (imgResData.candidates || [])[0];
          var parts = (candidate && candidate.content && candidate.content.parts) || [];
          for (var p = 0; p < parts.length; p++) {
            if (parts[p].inlineData && parts[p].inlineData.data) {
              var outMime = parts[p].inlineData.mimeType || 'image/jpeg';
              generatedAvatarUrl = 'data:' + outMime + ';base64,' + parts[p].inlineData.data;
              break;
            }
          }
          if (generatedAvatarUrl) break;
        } else {
          var errTxt = await imgResponse.text();
          console.error('[AvatarFaceImage] Model ' + imgModel + ' HTTP ' + imgResponse.status + ':', errTxt.slice(0, 200));
        }
      } catch (err) {
        console.error('[AvatarFaceImage] Model ' + imgModel + ' exception:', err.message || err);
      }
    }

    if (generatedAvatarUrl) {
      return res.status(200).json({ ok: true, avatarUrl: generatedAvatarUrl, theme: theme });
    }

    // [2순위 폴백] 텍스트 비전 분석 모델 (Gemini 3.1 Flash-Lite)
    var systemInstruction = 
      "당신은 한국 웹툰 및 카툰 3등신(Chibi) 캐릭터 전문 아바타 디자이너입니다.\n" +
      "제공된 실사 사진 속 인물의 고유한 외모 특징을 분석하여, 77종 3등신 캐릭터 바디에 완벽히 호환되는 만화형 얼굴 파라미터 JSON을 생성하십시오.\n\n" +
      "[엄격한 분석 규칙]\n" +
      "1. 안경 유무(hasGlasses): 안경을 썼다면 반드시 true로 두고, 테의 형태(round_wire:동글이, square_horn:사각뿔테, half_rim:하금테, black_thick:두꺼운검정테)와 색상을 지정하십시오.\n" +
      "2. 헤어스타일(hair): 실제 인물의 가르마(center, left, right, none), 기장(short, medium, long), 형태(dandy, two_block, bob, wave, curly, ponytail, straight, spiky), 앞머리 유무(hasBangs), 흑갈색/갈색/검정 등 실제 머리색 Hex를 지정하십시오.\n" +
      "3. 눈매(eyes): 눈꼬리 기울기(gentle_smile, sharp_confident, round_bright, droopy_cute)를 인물 인상에 맞게 지정하십시오.\n" +
      "4. 피부톤(skinColor): 조명 왜곡을 보정하여 한국인에게 가장 자연스러운 화사한 만화 스킨톤(#FFF0E5, #FFE3D1, #FAD2B0, #E8B68E, #D2966E 중 택1)을 지정하십시오.\n" +
      "5. 오직 JSON 객체 하나만 출력하고 마크다운 백틱이나 사족은 일체 출력하지 마십시오.";

    var promptText = 
      "이 사진 속 인물의 실제 얼굴 특징(안경, 헤어스타일, 눈매, 얼굴형, 피부톤)을 분석하여 아래 JSON Schema에 맞춰 정확히 반환하라:\n" +
      "{\n" +
      '  "hasGlasses": boolean,\n' +
      '  "glassesShape": "round_wire" | "square_horn" | "half_rim" | "black_thick" | "none",\n' +
      '  "glassesColor": "#hex",\n' +
      '  "skinColor": "#hex",\n' +
      '  "blushColor": "rgba(251,113,133,0.45)",\n' +
      '  "hair": {\n' +
      '    "style": "dandy" | "two_block" | "curtain" | "bob" | "wave" | "curly" | "ponytail" | "straight" | "spiky",\n' +
      '    "parting": "none" | "center" | "left" | "right",\n' +
      '    "hasBangs": boolean,\n' +
      '    "length": "short" | "medium" | "long",\n' +
      '    "color": "#hex"\n' +
      '  },\n' +
      '  "eyes": {\n' +
      '    "type": "round_bright" | "gentle_smile" | "sharp_confident" | "droopy_cute",\n' +
      '    "hasDoubleEyelid": boolean\n' +
      '  },\n' +
      '  "eyebrows": {\n' +
      '    "shape": "straight" | "arched" | "thick",\n' +
      '    "color": "#hex"\n' +
      '  },\n' +
      '  "mouth": {\n' +
      '    "expression": "bright_smile" | "soft_smile" | "confident_grin"\n' +
      '  },\n' +
      '  "similarityNote": "인물의 닮은 핵심 포인트 요약"\n' +
      "}";

    var geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
    var parsedResult = null;

    for (var i = 0; i < geminiModels.length; i++) {
      var modelName = geminiModels[i];
      try {
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + encodeURIComponent(geminiApiKey);
        var reqPayload = {
          contents: [{
            parts: [
              { text: systemInstruction + '\n\n' + promptText },
              { inlineData: { mimeType: mimeType, data: rawData } }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        };

        var response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqPayload)
        });

        if (response.ok) {
          var resData = await response.json();
          var rawJson = (((resData.candidates || [])[0] || {}).content || {}).parts
            ? resData.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('\n')
            : '';

          var jsonMatch = rawJson.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
            break;
          }
        } else {
          var errText = await response.text();
          console.error('[AvatarFaceVision] Gemini ' + modelName + ' HTTP ' + response.status + ':', errText.slice(0, 200));
        }
      } catch (err) {
        console.error('[AvatarFaceVision] Gemini ' + modelName + ' exception:', err.message || err);
      }
    }

    if (parsedResult) {
      return res.status(200).json({ ok: true, features: normalizeFeatures(parsedResult) });
    }

    return res.status(200).json({ ok: true, fallback: true, features: getSmartFallbackFeatures() });
  } catch (err) {
    return res.status(200).json({ ok: true, fallback: true, features: getSmartFallbackFeatures() });
  }
}

function normalizeFeatures(d) {
  var data = d || {};
  var h = data.hair || {};
  var e = data.eyes || {};
  var eb = data.eyebrows || {};
  var m = data.mouth || {};
  return {
    hasGlasses: !!data.hasGlasses,
    glassesShape: data.glassesShape || (data.hasGlasses ? 'round_wire' : 'none'),
    glassesColor: data.glassesColor || '#1E293B',
    skinColor: data.skinColor || '#FFDFBF',
    blushColor: data.blushColor || 'rgba(251,113,133,0.45)',
    hair: {
      style: h.style || 'dandy',
      parting: h.parting || 'none',
      hasBangs: h.hasBangs !== undefined ? !!h.hasBangs : true,
      length: h.length || 'short',
      color: h.color || '#1E293B'
    },
    eyes: { type: e.type || 'round_bright', hasDoubleEyelid: !!e.hasDoubleEyelid },
    eyebrows: { shape: eb.shape || 'arched', color: eb.color || '#1E293B' },
    mouth: { expression: m.expression || 'bright_smile' },
    similarityNote: data.similarityNote || '단정한 만화형 캐릭터 아바타'
  };
}

function getSmartFallbackFeatures() {
  return {
    hasGlasses: false,
    glassesShape: 'none',
    glassesColor: '#1E293B',
    skinColor: '#FFDFBF',
    blushColor: 'rgba(251,113,133,0.45)',
    hair: { style: 'dandy', parting: 'none', hasBangs: true, length: 'short', color: '#1E293B' },
    eyes: { type: 'round_bright', hasDoubleEyelid: true },
    eyebrows: { shape: 'arched', color: '#1E293B' },
    mouth: { expression: 'bright_smile' },
    similarityNote: '화사하고 밝은 3등신 만화 캐릭터'
  };
}
