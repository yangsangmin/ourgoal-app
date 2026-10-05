/**
 * OurGoal Theme Export CSV (기록 탭 — 테마별 기록 CSV 글자·외부 AI 분석 프롬프트)
 *
 * 「테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001)」 묶음 전체: 테마별 외부 AI 분석 프롬프트(getAIAnalysisPrompt)·기록 CSV 글자 만들기(buildCSV) — 둘 다 smoke-test FN_NAMES(인라인 합본에서 찾는다). 내보내기 창은 js/tabs/records/export-theme.js.
 * #TASK-ES-526(인라인 3단계 Z4 이동 3차(표 CSV·웨어러블·목표 연동 · 음성 표 입력 · 테마별 기록 CSV · 함께 목표 초대 글자)): index.html 인라인 IIFE 의 구간(이전 전 11679~11691 · 11692~11710줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 11679~11691줄(#TASK-ES-526 생성기 표지) ---- */
  /* ============ 테마별 기록 DB 다운로드 & 외부 AI 분석 프롬프트 번들 (TASK-OG-001) ============ */
  function getAIAnalysisPrompt(themeKey){
    var prompts = {
      mind: '당신은 최고 수준의 심리상담 전문가이자 마인드셋 코치입니다. 아래 제공된 사용자의 [심리상태] 기록 데이터를 바탕으로 다음 3가지를 분석하고 피드백을 작성해주세요:\r\n1. 주요 감정 상태의 긍정/부정 추이 및 감정 기복 패턴 분석\r\n2. 스트레스 및 번아웃 유발 요인과 힐링/휴식 빈도 진단\r\n3. 회복탄력성과 심리적 안정감을 증진하기 위한 맞춤형 주간 멘탈케어 실천 방안 3가지',
      study: '당신은 인지과학 기반의 학습 전략 및 자기주도학습 최고 전문가입니다. 아래 제공된 사용자의 [공부기록] 데이터를 바탕으로 다음 3가지를 분석하고 피드백을 작성해주세요:\r\n1. 총 학습 시간, 집중도 추이 및 주요 학습 주제별 시간 배분 분석\r\n2. 에빙하우스 망각 곡선에 기반한 최적의 복습 주기 및 지식 유지 전략 제안\r\n3. 목표 시험/성취를 달성하기 위한 구체적인 학습 루틴 최적화 가이드',
      business: '당신은 성공적인 린 스타트업 및 비즈니스 전략 수석 컨설턴트입니다. 아래 제공된 사용자의 [사업기록] 데이터를 바탕으로 다음 3가지를 분석하고 피드백을 작성해주세요:\r\n1. 시간 및 노력 투입 대비 실질 비즈니스 임팩트(매출, 고객, 제품) 평가\r\n2. 업무 프로세스 상의 병목 지점 및 우선순위 집중도 분석\r\n3. 다음 마일스톤 달성을 위해 즉시 실행해야 할 전략적 핵심 액션 아이템 3가지',
      schedule: '당신은 라이프스타일 및 인적 네트워크, 시간관리 수석 컨설턴트입니다. 아래 제공된 사용자의 [약속기록] 데이터를 바탕으로 다음 3가지를 분석하고 피드백을 작성해주세요:\r\n1. 대인관계 및 모임 일정의 성격 분포(비즈니스, 친목, 가족 등)와 에너지 소비 분석\r\n2. 일정 관리의 효율성과 개인 집중 시간 확보 밸런스 평가\r\n3. 건강한 인간관계와 생산적인 시간 관리를 양립하기 위한 개선 가이드',
      workout: '당신은 국가대표 스포츠 과학 전문 트레이너이자 임상 영양 코치입니다. 아래 제공된 사용자의 [운동기록] 데이터를 바탕으로 다음 3가지를 분석하고 피드백을 작성해주세요:\r\n1. 운동 종목(유산소, 웨이트, 스트레칭 등)의 밸런스 및 주간 운동 빈도 평가\r\n2. 점진적 과부하와 충분한 신체 회복 주기가 잘 지켜지고 있는지 진단\r\n3. 지속 가능한 건강과 신체적 목표 달성을 위한 차주 맞춤형 트레이닝 & 컨디셔닝 조언',
      daily: '당신은 전인적 라이프 코칭 전문가입니다. 사용자의 일상 기록을 분석하여 삶의 활력과 작은 성취들의 의미를 짚어주고, 더 나은 하루를 만들기 위한 따뜻한 조언을 작성해주세요.'
    };
    var base = prompts[themeKey] || '당신은 전인적 라이프 코칭 및 데이터 분석 전문가입니다. 아래 사용자의 5대 라이프 테마(심리, 공부, 사업, 약속, 운동) 기록 데이터를 바탕으로 삶의 균형 상태를 진단하고, 테마별 집중도 분석 및 더 조화롭고 몰입도 높은 삶을 위한 실행 가능한 가이드를 작성해주세요.';
    return '[외부 AI 분석 프롬프트 (Google Gemini 붙여넣기용)]\r\n' + base;
  }
  /* ---- 이전 전 index.html 11692~11710줄(#TASK-ES-526 생성기 표지) ---- */

  function buildCSV(recordsToExport){
    var list = (recordsToExport || L.state.profile.records).slice().sort(function(a,b){ return new Date(a.startAt)-new Date(b.startAt); });
    var rows = [['날짜','시작','종료','소요시간(분)','테마','소주제','분야','내용']];
    list.forEach(function(r){
      var mins = r.endAt ? Math.round((new Date(r.endAt)-new Date(r.startAt))/60000) : '';
      var catLabel = (r.category && typeof L.TOPICS !== 'undefined' && L.TOPICS[r.category]) ? L.TOPICS[r.category].label : '';
      var thObj = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[r.theme]) ? L.RECORD_THEMES[r.theme] : null;
      var thLabel = thObj ? thObj.label : (r.theme || '일상');
      var subTh = r.subTheme || '';
      rows.push([L.dateKey(r.startAt), L.fmtTime(r.startAt), r.endAt?L.fmtTime(r.endAt):'진행중', mins, thLabel, subTh, catLabel, r.text]);
    });
    return rows.map(function(row){
      return row.map(function(cell){
        var s = String(cell==null?'':cell).replace(/"/g,'""');
        return /[",\r\n]/.test(s) ? '"'+s+'"' : s;
      }).join(',');
    }).join('\r\n');
  }

  K.getAIAnalysisPrompt = getAIAnalysisPrompt;
  K.buildCSV = buildCSV;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
