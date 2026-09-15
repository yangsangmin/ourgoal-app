module.exports.config = { maxDuration: 30 };

// 1. 맞춤 기록 템플릿 로컬 스마트 폴백
function localCustomTemplateFallback(query, proseDesc) {
  var q = (query || '').trim();
  var desc = (proseDesc || '').trim();
  var fullText = (q + ' ' + desc).toLowerCase();

  var title = q ? (q.length > 12 ? q.slice(0, 12) : q) : '맞춤기록';
  var icon = '📝';
  var theme = 'daily';
  var columns = ['번호', '구분/항목', '세부내용', '수치/측정값', '소요시간', '강도/만족도(100점)'];
  var defaultRows = [
    ['1', '1회차 실천', '핵심 활동 완료', '목표 달성', '30분', '90점']
  ];
  var explanation = 'AI가 [' + title + '] 주제에 최적화된 ' + columns.length + '개 속성과 기본 예시 행을 구성했습니다.';

  if (/(?:크로스핏|와드|wod|crossfit|fran|cindy|murph|박스)/i.test(fullText)) {
    title = q || '크로스핏 와드';
    icon = '🔥';
    theme = 'workout';
    columns = ['번호', '라운드/구분', 'WOD 운동종목', '무게(lb/kg)', '반복수(Reps)', '시간/타임캡', 'Rx/Scaled', '비고'];
    defaultRows = [
      ['1', '1R', '쓰러스터 (Thrusters)', '95 lb', '21회', '02:15', "Rx'd", '호흡 조절'],
      ['2', '1R', '풀업 (Pull-ups)', '-', '21회', '01:45', "Rx'd", '언브로큰'],
      ['3', '2R', '쓰러스터 (Thrusters)', '95 lb', '15회', '01:50', "Rx'd", '2분할'],
      ['4', '2R', '풀업 (Pull-ups)', '-', '15회', '01:30', "Rx'd", '-'],
      ['5', '3R', '쓰러스터 (Thrusters)', '95 lb', '9회', '01:10', "Rx'd", '스퍼트'],
      ['6', '3R', '풀업 (Pull-ups)', '-', '9회', '00:55', "Rx'd", '완료']
    ];
    explanation = '크로스핏 대표 벤치마크 와드(Fran) 기준 8개 열 속성과 6개 라운드 행을 구성했습니다.';
  } else if (/(?:하이록스|hyrox)/i.test(fullText)) {
    title = q || '하이록스';
    icon = '🏃';
    theme = 'workout';
    columns = ['번호', '종목/스테이션', '세트/랩', '시간', '페이스', '심박수', '강도(100점)'];
    defaultRows = [
      ['1', '1km 러닝 (Run 1)', '1랩', '4분 25초', '4:25/km', '160bpm', '85점'],
      ['2', '스키에르그 (SkiErg)', '1,000m', '3분 55초', '1:57/500m', '170bpm', '90점'],
      ['3', '슬레드 푸시 (Sled Push)', '50m (152kg)', '2분 15초', '-', '178bpm', '95점'],
      ['4', '슬레드 풀 (Sled Pull)', '50m (103kg)', '3분 20초', '-', '175bpm', '92점'],
      ['5', '버피 브로드점프 (Burpee Broad Jumps)', '80m', '3분 30초', '-', '182bpm', '98점'],
      ['6', '로잉 (Rowing)', '1,000m', '3분 50초', '1:55/500m', '172bpm', '88점'],
      ['7', '파머스 캐리 (Farmers Carry)', '200m (2x24kg)', '1분 50초', '-', '168bpm', '85점'],
      ['8', '샌드백 런지 (Sandbag Lunges)', '100m (20kg)', '3분 45초', '-', '176bpm', '94점'],
      ['9', '월볼샷 (Wall Balls)', '100회 (6kg)', '4분 15초', '-', '185bpm', '100점']
    ];
    explanation = '하이록스 공식 8대 스테이션과 1km 러닝을 포함한 9개 행 풀세트를 구성했습니다.';
  } else if (/(?:공인중개사|민법|학개론|세법|공법|모의고사|오답|기출)/i.test(fullText)) {
    title = q || '모의고사 오답노트';
    icon = '📝';
    theme = 'study';
    columns = ['번호', '과목/영역', '문제번호/범위', '정답여부(O/X)', '오답원인/핵심개념', '소요시간', '중요도', '복습예정'];
    defaultRows = [
      ['1', '민법총칙', '1번~10번', '8/10 (80%)', '통정허위표시 제3자 범위 혼동', '15분', '상', 'D+1 복습'],
      ['2', '물권법', '11번~20번', '7/10 (70%)', '점유취득시효 완성 후 등기 청구권', '18분', '특상', 'D+1 복습'],
      ['3', '부동산학개론', '1번~15번', '13/15 (87%)', '탄력성 계산 공식 부호 착오', '14분', '중', '주말 복습']
    ];
    explanation = '모의고사 문항별 정답률 및 오답원인 분석용 속성과 3개 행을 구성했습니다.';
  } else if (/(?:주식|매매|코인|비트코인|가상화폐|트레이딩|차트)/i.test(fullText)) {
    title = q || '주식 매매일지';
    icon = '📈';
    theme = 'business';
    columns = ['번호', '종목명/티커', '매매구분', '매수가', '매도가', '수량', '수익률(%)', '매매근거/원칙'];
    defaultRows = [
      ['1', '삼성전자 (005930)', '분할매수', '72,000원', '-', '30주', '-', '20일선 지지 반등 확인'],
      ['2', 'SK하이닉스', '익절매도', '175,000원', '192,000원', '15주', '+9.7%', '저항선 도달 분할 익절']
    ];
    explanation = '투자 원칙 준수 및 매매 근거 중심의 실전 트레이딩 일지 양식입니다.';
  } else if (/(?:헬스|웨이트|근력|보디빌딩|피트니스|pt|쇠질|가슴|등|하체)/i.test(fullText)) {
    title = (q && q.length <= 8) ? q : '헬스';
    icon = '🏋️';
    theme = 'workout';
    columns = ['번호', '운동종목', '세트', '횟수', '시간', '거리', '강도(100점)'];
    defaultRows = [
      ['1', '벤치프레스', '5세트', '10회', '15분', '-', '85점'],
      ['2', '스쿼트', '5세트', '8회', '20분', '-', '90점']
    ];
    explanation = '부위별 세트/횟수 및 강도 중심의 웨이트 트레이닝 양식입니다.';
  } else if (/(?:공부|학습|시험|자격증|수능|강의)/i.test(fullText)) {
    title = (q && q.length <= 8) ? q : '공부';
    icon = '📚';
    theme = 'study';
    columns = ['번호', '과목/주제', '학습내용', '공부시간(분)', '페이지/범위', '집중도(100점)', '복습필요'];
    defaultRows = [
      ['1', '핵심 개념 학습', '1챕터 이론 요약 및 문제 풀이', '60분', 'p.10~35', '90점', 'N']
    ];
    explanation = '과목별 학습량과 집중도를 체계적으로 추적하는 학습 관리 양식입니다.';
  } else if (/(?:영업|세일즈|고객|바이어|미팅|계약|상담|매출)/i.test(fullText)) {
    title = (q && q.length <= 8) ? q : '영업';
    icon = '💼';
    theme = 'business';
    columns = ['번호', '고객/사명', '미팅형태', '논의내용', '제안금액', '계약가능성(%)', '다음액션'];
    defaultRows = [
      ['1', '주요 고객사', '방문 미팅', '제안 프레젠테이션 및 Q&A', '2,000만원', '75%', '견적서 및 세부 기획안 송부']
    ];
    explanation = '고객 파이프라인 및 계약 가능성 관리 양식입니다.';
  } else if (/(?:러닝|달리기|마라톤|조깅|트레일)/i.test(fullText)) {
    title = q || '러닝';
    icon = '👟';
    theme = 'workout';
    columns = ['번호', '코스/구간', '거리(km)', '소요시간', '평균페이스', '심박수', '강도(100점)'];
    defaultRows = [
      ['1', '한강 러닝 코스', '7.5km', '38분 20초', '5:06/km', '158bpm', '85점']
    ];
    explanation = '거리와 페이스, 심박수를 종합 측정하는 러닝 기록 양식입니다.';
  }

  // 사용자 줄글에서 열 명시적 추출 정규식 지원
  var colMatch = desc.match(/(?:열|속성|컬럼|항목)(?:은|는|을|를|으로)?\s*[:=]?\s*['"‘“]([^'"\r\n]+)['"’”]/i) ||
                 desc.match(/(?:열|속성|컬럼|항목)(?:은|는|을|를|으로)?\s*[:=]?\s*([^\r\n]+?)(?:으로|로)?\s*(?:해줘|해주고|해주|하고|만들어|설정|지정|추가|구성)/i) ||
                 desc.match(/(?:열|속성|컬럼)\s*[:=]\s*([^\r\n]+)/i);
  if (colMatch && colMatch[1]) {
    var rawCols = colMatch[1].split(/[,/·|、\t]/).map(function(s) {
      return s.replace(/['"‘“’”]/g, '').trim();
    }).filter(function(s) { return s.length > 0 && !/^(?:해줘|해주고|해주|하고|으로|로|입니다)$/.test(s); });
    if (rawCols.length > 0) {
      columns = rawCols;
      if (columns[0] !== '번호') columns.unshift('번호');
      explanation += ' (사용자 지정 열 속성 반영)';
    }
  }

  return {
    title: title,
    icon: icon,
    theme: theme,
    columns: columns,
    defaultRows: defaultRows,
    explanation: explanation,
    source: 'fallback',
    isOfflineFallback: true
  };
}

// 2. 목표 마일스톤 템플릿 로컬 스마트 폴백
function localGoalTemplateFallback(description) {
  var desc = (description || '').trim();

  // 60대 전문가 인기 목표 템플릿 정밀 매칭 우선 적용
  try {
    var expertRegistry = require('../js/goal-templates-registry');
    if (expertRegistry && typeof expertRegistry.findExpertTemplate === 'function') {
      var expertMatch = expertRegistry.findExpertTemplate(desc);
      if (expertMatch) {
        return {
          title: expertMatch.title,
          topicMajor: expertMatch.topicMajor,
          topicMinor: expertMatch.topicMinor,
          milestones: expertMatch.milestones,
          source: 'expert_knowledge_fallback',
          isOfflineFallback: true
        };
      }
    }
  } catch (e) {}

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
    milestones: milestones,
    source: 'fallback',
    isOfflineFallback: true
  };
}

// 3. AI 자율 메트릭 추론 & 시각화 에이전트 로컬 스마트 폴백
function localStatsAgentFallback(records, query) {
  var recs = Array.isArray(records) ? records : [];
  var discovered = [];
  var textSummary = recs.map(function (r) {
    return (r.text || '') + ' ' + (r.summaryText || '') + ' ' + (r.memo || '') + ' ' + (r.templateTitle || '');
  }).join(' ');

  // 1. 체중/다이어트 (최신값 추세, 꺾은선 차트)
  if (/(?:체중|몸무게|kg|인바디|골격근|체지방|다이어트|weight)/i.test(textSummary)) {
    discovered.push({
      category: 'weight',
      title: '체중 / 인바디',
      icon: '⚖️',
      label: '체중',
      unit: 'kg',
      agg: 'latest',
      chartType: 'line',
      color: '#ec4899',
      kpi1: '⚖️ 현재 체중',
      kpi2: '📉 최고 감량폭',
      kpi3: '🎯 목표 달성률',
      kpi4: '📊 주간 변동추이'
    });
  }

  // 2. 독서/도서 (누적합/일별 독서, 막대/면적 차트)
  if (/(?:독서|책|페이지|쪽|권|북|reading|book)/i.test(textSummary)) {
    discovered.push({
      category: 'reading',
      title: '독서 / 도서',
      icon: '📖',
      label: '독서량',
      unit: '쪽',
      agg: 'sum',
      chartType: 'bar',
      color: '#8b5cf6',
      kpi1: '🏆 총 읽은 페이지',
      kpi2: '📚 완독 도서수',
      kpi3: '📖 일일 평균 독서',
      kpi4: '📈 주간 성장률'
    });
  }

  // 3. 수면/웰니스 (일일 평균 수면, 꺾은선 차트)
  if (/(?:수면|취침|잠|수면시간|기상|수면점수|sleep)/i.test(textSummary)) {
    discovered.push({
      category: 'sleep',
      title: '수면 / 웰니스',
      icon: '💤',
      label: '수면시간',
      unit: '시간',
      agg: 'avg',
      chartType: 'line',
      color: '#6366f1',
      kpi1: '🌙 일일 평균 수면',
      kpi2: '⭐ 최고 회복 세션',
      kpi3: '💤 수면 규칙성',
      kpi4: '📉 수면 부채 지수'
    });
  }

  // 4. 재테크/금융 (누적 저축액, 면적 차트)
  if (/(?:저축|적금|투자|주식|지출|만원|원|달러|\$|finance|money)/i.test(textSummary)) {
    discovered.push({
      category: 'finance',
      title: '재테크 / 자산',
      icon: '💰',
      label: '저축/투자액',
      unit: '만원',
      agg: 'sum',
      chartType: 'area',
      color: '#10b981',
      kpi1: '🏆 총 누적 저축',
      kpi2: '💎 최고 단일 저축',
      kpi3: '📈 월평균 저축액',
      kpi4: '🎯 자산 목표 진척'
    });
  }

  // 5. 러닝/유산소
  if (/(?:러닝|달리기|마라톤|조깅|run|running)/i.test(textSummary)) {
    discovered.push({
      category: 'running',
      title: '러닝 / 조깅',
      icon: '🏃',
      label: '러닝 거리',
      unit: 'km',
      agg: 'sum',
      chartType: 'area',
      color: '#0ea5e9',
      kpi1: '🏆 총 누적 거리',
      kpi2: '⚡ 최고 페이스',
      kpi3: '🏃 최장 1회 거리',
      kpi4: '📈 전월 대비 성장률'
    });
  }

  // 6. 웨이트/3대
  if (/(?:벤치|스쿼트|데드|헬스|웨이트|bench|squat|deadlift)/i.test(textSummary)) {
    discovered.push({
      category: 'big3',
      title: '3대 웨이트',
      icon: '🏋️',
      label: '3대 총합 중량',
      unit: 'kg',
      agg: 'max',
      chartType: 'line',
      color: '#f59e0b',
      kpi1: '🏆 3대 총합 (Total)',
      kpi2: '🏋️ 벤치프레스 PR',
      kpi3: '🦵 스쿼트 PR',
      kpi4: '🦍 데드리프트 PR'
    });
  }

  // 7. 혈압 (Blood Pressure)
  if (/(?:혈압|수축기|이완기|bp)/i.test(textSummary)) {
    discovered.push({
      category: 'blood_pressure',
      title: '혈압 관리',
      icon: '❤️',
      label: '수축기 혈압',
      unit: 'mmHg',
      agg: 'avg',
      chartType: 'line',
      color: '#ef4444',
      kpi1: '❤️ 최근 수축기 혈압',
      kpi2: '💓 최근 이완기 혈압',
      kpi3: '📊 평균 혈압',
      kpi4: '📈 혈압 안정도'
    });
  }

  // 8. 체지방률 (Body Fat)
  if (/(?:체지방|골격근|근육량|fat)/i.test(textSummary)) {
    discovered.push({
      category: 'body_fat',
      title: '체지방률',
      icon: '📉',
      label: '체지방률',
      unit: '%',
      agg: 'latest',
      chartType: 'line',
      color: '#f97316',
      kpi1: '📉 현재 체지방률',
      kpi2: '🏆 최저 체지방률',
      kpi3: '📊 평균 체지방률',
      kpi4: '📈 체조성 변화'
    });
  }

  // 9. 골프 (Golf)
  if (/(?:골프|라운딩|스크린|라베)/i.test(textSummary)) {
    discovered.push({
      category: 'golf',
      title: '골프 스코어',
      icon: '⛳',
      label: '타수',
      unit: '타',
      agg: 'latest',
      chartType: 'line',
      color: '#059669',
      kpi1: '⛳ 최근 스코어',
      kpi2: '🏆 라베 (최저타)',
      kpi3: '📊 평균 스코어',
      kpi4: '📈 핸디캡 추세'
    });
  }

  // 10. 코딩 (Coding)
  if (/(?:코딩|커밋|깃허브|github|pr|commit)/i.test(textSummary)) {
    discovered.push({
      category: 'coding',
      title: '코딩 / 커밋',
      icon: '💻',
      label: '커밋 수',
      unit: '커밋',
      agg: 'sum',
      chartType: 'bar',
      color: '#2563eb',
      kpi1: '💻 총 누적 커밋',
      kpi2: '🔥 1일 최다 커밋',
      kpi3: '📊 일평균 활동량',
      kpi4: '📈 히트맵 연속성'
    });
  }

  // 기본 일반 실천시간 fallback
  if (!discovered.length) {
    discovered.push({
      category: 'general',
      title: '실천 시간',
      icon: '🔥',
      label: '실천 시간',
      unit: '분',
      agg: 'sum',
      chartType: 'area',
      color: '#3b82f6',
      kpi1: '🏆 총 실천 시간',
      kpi2: '✍️ 총 기록 건수',
      kpi3: '🔥 주간 평균 몰입',
      kpi4: '📈 꾸준함 지수'
    });
  }

  return {
    metrics: discovered,
    analysis: 'AI가 사용자의 기록 ' + (recs.length || 0) + '건을 분석하여 최적의 메트릭 모델과 시각화 차트를 자동 설계했습니다. 꾸준히 기록할수록 성장 추세의 정밀도가 높아집니다.',
    source: 'fallback',
    isOfflineFallback: true
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var clientGeminiKey = (typeof body.geminiKey === 'string' && body.geminiKey.trim()) ? body.geminiKey.trim() : null;
  var geminiApiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
  var geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  // [TASK-ES-058] 사회적 규범 위배(범죄, 음란, 자해 등) 키워드 차단 이중 방어선
  var moderation = require('../js/content-moderation.js');
  var textToCheck = [body.query, body.prose, body.description, body.title, body.message]
    .filter(function(v) { return typeof v === 'string' && v.trim(); })
    .join(' ');

  if (textToCheck) {
    var checkResult = moderation.check(textToCheck);
    if (checkResult.flagged) {
      res.status(400).json({
        error: 'CONTENT_FILTER_REJECTED',
        message: checkResult.message,
        detail: checkResult.detail,
        support: checkResult.support,
        notice: checkResult.notice,
        category: checkResult.category,
        tag: checkResult.tag
      });
      return;
    }
  }

  // -------------------------------------------------------------
  // 분기 A: AI 자율 메트릭 추론 & 시계열 통계 에이전트 요청 (TASK-ES-059 고도화)
  // -------------------------------------------------------------
  var isStatsAgent = (body.action === 'ai_stats_agent') ||
                     (body.action === 'ai_metric_discovery') ||
                     (req.query && req.query.action === 'ai_stats_agent');

  if (isStatsAgent) {
    var statRecs = Array.isArray(body.records) ? body.records.slice(0, 30) : [];
    var statQuery = (body.query || '').trim().slice(0, 100);

    var statPrompt = '당신은 습관·목표 관리 앱 "아워골"의 유니버설 데이터 시각화 AI 분석관입니다.\n' +
      '사용자가 입력한 다양한 기록 데이터(운동, 독서, 체중, 수면, 재테크, 식단, 취미 등 모든 영역)를 심층 분석하여,\n' +
      '도메인에 제한 없이 데이터에 내재된 핵심 지표(Metric)들을 자율 식별하고, 가장 어울리는 차트 형태와 통찰 리포트를 JSON으로 반환하세요.\n\n' +
      '[사용자 최근 기록 샘플 (' + statRecs.length + '건)]\n' +
      JSON.stringify(statRecs.map(function (r) {
        return { text: r.text || '', date: r.startAt || '', category: r.category || '' };
      }), null, 2) + '\n\n' +
      '[설계 지침]\n' +
      '1. metrics: 식별된 지표 배열 (최대 6개).\n' +
      '   - category: 영문 식별자 (예: weight, reading, sleep, finance, running, big3, coding 등)\n' +
      '   - title: 직관적 한글 명칭 (예: 체중 / 인바디, 독서량, 수면시간 등)\n' +
      '   - icon: 단일 대표 이모지 (예: ⚖️, 📖, 💤, 💰, 🏃, 🏋️)\n' +
      '   - label: 차트 축 라벨 (예: 체중, 읽은 쪽수, 수면시간 등)\n' +
      '   - unit: 단위 (예: kg, 쪽, 시간, 만원, 분 등)\n' +
      '   - agg: 집계특성 ("sum" [누적합], "avg" [평균치], "max" [최고PR], "latest" [최신값추이] 중 1개)\n' +
      '   - chartType: 최적 차트 형태 ("area" [면적], "line" [꺾은선], "bar" [막대] 중 1개)\n' +
      '   - color: 조화로운 헥스 색상\n' +
      '   - kpi1, kpi2, kpi3, kpi4: 4대 핵심 요약 라벨\n' +
      '2. analysis: 해당 데이터의 시계열 추세 및 성장을 진단하고 사용자에게 맞춤 제안을 건네는 따뜻하고 전문적인 AI 리포트 (한글 2~3문장).\n\n' +
      '오직 순수 JSON으로만 응답하세요:\n' +
      '{\n' +
      '  "metrics": [\n' +
      '    { "category": "weight", "title": "체중 / 인바디", "icon": "⚖️", "label": "체중", "unit": "kg", "agg": "latest", "chartType": "line", "color": "#ec4899", "kpi1": "현재 체중", "kpi2": "최고 감량", "kpi3": "목표 달성", "kpi4": "변동률" }\n' +
      '  ],\n' +
      '  "analysis": "AI 통찰 분석 리포트"\n' +
      '}';

    var statParsed = null;
    if (geminiApiKey) {
      for (var smi = 0; smi < geminiModels.length; smi++) {
        var sModel = geminiModels[smi];
        try {
          var sRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + sModel + ':generateContent?key=' + geminiApiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: statPrompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
              }
            })
          });
          if (sRes.ok) {
            var sData = await sRes.json();
            var sRaw = (sData.candidates && sData.candidates[0] && sData.candidates[0].content && sData.candidates[0].content.parts && sData.candidates[0].content.parts[0] && sData.candidates[0].content.parts[0].text) || '';
            var sClean = sRaw.replace(/```json|```/g, '').trim();
            statParsed = JSON.parse(sClean);
            if (statParsed && Array.isArray(statParsed.metrics) && statParsed.metrics.length) {
              statParsed.isOfflineFallback = false;
              statParsed.modelUsed = sModel;
              break;
            }
          }
        } catch (se) {}
      }
    }

    if (!statParsed || !Array.isArray(statParsed.metrics) || !statParsed.metrics.length) {
      var fbStat = localStatsAgentFallback(statRecs, statQuery);
      res.status(200).json(fbStat);
      return;
    }

    res.status(200).json(statParsed);
    return;
  }

  // -------------------------------------------------------------
  // 분기 B: 맞춤 기록 템플릿(Custom Record Template) 생성 요청
  // -------------------------------------------------------------
  var isCustomRecord = (body.action === 'custom_record_template') ||
                       (body.type === 'custom_template') ||
                       (body.prose !== undefined && body.description === undefined) ||
                       (req.query && req.query.action === 'custom_record_template');

  if (isCustomRecord) {
    var query = (body.query || '').trim().slice(0, 100);
    var prose = (body.prose || body.description || '').trim().slice(0, 1000);

    if (!query && !prose) {
      res.status(400).json({ error: 'query or prose is required' });
      return;
    }

    var customPrompt = '당신은 습관·목표 관리 앱 "아워골"의 전문가용 \'내 전용 맞춤 템플릿(표 양식)\' 설계 AI입니다.\n' +
      '사용자가 일상, 운동, 학습, 비즈니스, 프로젝트 등 다양한 영역에서 맞춤형 테이블을 기록하기 위해 주제와 줄글 요구사항을 전달했습니다.\n' +
      '이를 심층 분석하여 사용자의 도메인에 가장 최적화되고 전문적인 표 양식(Columns)과 실무 샘플 데이터(Rows)를 JSON으로 설계하세요.\n\n' +
      '[사용자 주제]\n"' + (query || '미지정') + '"\n\n' +
      '[사용자 줄글 설명 / 요구사항]\n"' + (prose || '주제에 맞는 최적의 양식으로 구성해주세요') + '"\n\n' +
      '[설계 원칙]\n' +
      '1. 제목(title): 사용자의 의도를 살린 간결하고 명확한 템플릿 이름 (한글 2~12자 내외).\n' +
      '2. 아이콘(icon): 해당 주제에 가장 어울리는 단일 이모지 1개 (예: 🏃, 📝, 💼, 💻, 🥗, 📈 등).\n' +
      '3. 테마(theme): workout, study, business, daily 중 가장 적합한 1개.\n' +
      '4. 속성(columns):\n' +
      '   - 반드시 첫 번째 열은 "번호" 여야 합니다.\n' +
      '   - 총 4개~8개 열로 구성하며, 사용자가 측정하거나 기록해야 할 핵심 지표(측정값, 단위, 항목, 상태, 피드백 등)를 전문적이고 직관적인 명칭으로 배치하세요.\n' +
      '   - 사용자가 줄글에서 특정 열이나 속성을 명시적으로 언급했다면 최우선으로 포함하세요.\n' +
      '5. 기본 예시 행(defaultRows):\n' +
      '   - columns의 열 개수와 완벽히 일치하는 2차원 배열이어야 합니다.\n' +
      '   - 각 행의 첫 번째 값(index 0)은 "1", "2", "3" 등 순번이어야 합니다.\n' +
      '   - 사용자가 바로 참고하거나 복사해 쓸 수 있는 실감나고 전문적인 실제 예시 데이터 2~4개 행을 채워주세요. (단순 "데이터1", "항목A" 같은 성의 없는 더미 텍스트 절대 금지).\n' +
      '6. 설명(explanation):\n' +
      '   - 이 양식이 어떤 원리로 설계되었고 사용자의 기록 및 추적에 왜 효과적인지 친절하고 전문적으로 1~2문장으로 요약 (한글 80자 내외).\n\n' +
      '오직 아래 순수 JSON 형식으로만 응답하세요 (마크다운 코드블록, ```json 금지):\n' +
      '{\n' +
      '  "title": "템플릿 제목",\n' +
      '  "icon": "이모지",\n' +
      '  "theme": "workout",\n' +
      '  "columns": ["번호", "열1", "열2", "열3"],\n' +
      '  "defaultRows": [\n' +
      '    ["1", "값1", "값2", "값3"],\n' +
      '    ["2", "값1", "값2", "값3"]\n' +
      '  ],\n' +
      '  "explanation": "AI 설계 의도 설명"\n' +
      '}';

    try {
      var customParsed = null;
      var customUsedModel = null;

      if (geminiApiKey) {
        for (var gi = 0; gi < geminiModels.length; gi++) {
          var gModel = geminiModels[gi];
          try {
            var gRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + gModel + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: customPrompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: 'application/json'
                }
              })
            });
            if (gRes.ok) {
              var gData = await gRes.json();
              var gRaw = (gData.candidates && gData.candidates[0] && gData.candidates[0].content && gData.candidates[0].content.parts && gData.candidates[0].content.parts[0] && gData.candidates[0].content.parts[0].text) || '';
              var gClean = gRaw.replace(/```json|```/g, '').trim();
              customParsed = JSON.parse(gClean);
              customUsedModel = gModel;
              break;
            }
          } catch (ge) {}
        }
      }

      if (!customParsed || !customParsed.title || !Array.isArray(customParsed.columns) || customParsed.columns.length < 2) {
        var fbRecord = localCustomTemplateFallback(query, prose);
        res.status(200).json(fbRecord);
        return;
      }

      var validCols = customParsed.columns.map(function(c) { return String(c || '').trim(); }).filter(Boolean);
      if (validCols[0] !== '번호') validCols.unshift('번호');
      validCols = validCols.slice(0, 10);

      var validRows = [];
      if (Array.isArray(customParsed.defaultRows) && customParsed.defaultRows.length > 0) {
        validRows = customParsed.defaultRows.slice(0, 10).map(function(row, rIdx) {
          var rArr = [];
          for (var ci = 0; ci < validCols.length; ci++) {
            if (ci === 0) {
              rArr.push(String(rIdx + 1));
            } else {
              var cellVal = (Array.isArray(row) && row[ci] !== undefined) ? String(row[ci]) : '';
              rArr.push(cellVal);
            }
          }
          return rArr;
        });
      }

      if (validRows.length === 0) {
        validRows = [validCols.map(function(c, i) { return i === 0 ? '1' : ''; })];
      }

      var validTheme = ['workout', 'study', 'business', 'daily'].includes(customParsed.theme) ? customParsed.theme : 'daily';

      res.status(200).json({
        ok: true,
        source: 'gemini',
        model: customUsedModel,
        title: String(customParsed.title || query || '맞춤 템플릿').slice(0, 20),
        icon: String(customParsed.icon || '📝').slice(0, 4),
        theme: validTheme,
        columns: validCols,
        defaultRows: validRows,
        explanation: String(customParsed.explanation || 'Gemini 3.1 Flash Lite가 요청하신 내용에 맞춘 고품질 양식을 설계했습니다.').slice(0, 300)
      });
      return;
    } catch (err) {
      var fbErrRecord = localCustomTemplateFallback(query, prose);
      res.status(200).json(fbErrRecord);
      return;
    }
  }

  // -------------------------------------------------------------
  // 분기 B: 기존 새 목표 마일스톤/할 일 생성 요청
  // -------------------------------------------------------------
  var description = (body.description || '').trim().slice(0, 500);
  if (!description) {
    res.status(400).json({ error: 'description is required' });
    return;
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

    if (geminiApiKey) {
      for (var gi2 = 0; gi2 < geminiModels.length; gi2++) {
        var gModel2 = geminiModels[gi2];
        try {
          var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + gModel2 + ':generateContent?key=' + encodeURIComponent(geminiApiKey), {
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
            var gData2 = await geminiRes.json();
            var gRaw2 = (gData2.candidates && gData2.candidates[0] && gData2.candidates[0].content && gData2.candidates[0].content.parts && gData2.candidates[0].content.parts[0] && gData2.candidates[0].content.parts[0].text) || '';
            var gClean2 = gRaw2.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(gClean2);
            break;
          }
        } catch (ge2) {}
      }
    }

    if (!parsed || !parsed.title || !Array.isArray(parsed.milestones) || !parsed.milestones.length) {
      var fbGoal = localGoalTemplateFallback(description);
      res.status(200).json(fbGoal);
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
    var fbErrGoal = localGoalTemplateFallback(description);
    res.status(200).json(fbErrGoal);
  }
};

module.exports.localCustomTemplateFallback = localCustomTemplateFallback;
module.exports.localGoalTemplateFallback = localGoalTemplateFallback;
module.exports.localStatsAgentFallback = localStatsAgentFallback;