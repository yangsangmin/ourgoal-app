/**
 * OurGoal Records Pro Templates (기록 탭 — 전문 템플릿 목록·조회·날짜 꼬리표·줄글 해석·AI 추천)
 *
 * 기본 전문 템플릿 목록(DEFAULT_PRO_TEMPLATES) · 내 템플릿 합친 목록(getAllProTemplates) · 키로 찾기(getProTemplateByKey) · 날짜 꼬리표 YYMMDD(fmtYYMMDD) · 줄글 → 표 열 해석(parseNaturalLanguageTemplateSpec) · 키워드 → 템플릿 추천(recommendTemplateFromAI).
 * 묶음 「전문적(내 전용 템플릿) 기록하기 & 일정 연동」(850줄)을 책임 단위로 나눈 데이터·해석 쪽이다. 만들기·열 편집 모달은 js/tabs/records/pro-template-modals.js.
 * #TASK-ES-467(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 19166~19246 · 19247~19251 · 19252~19256 · 19257~19271 · 19272~19408 · 19409~19638줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 19166~19246줄(#TASK-ES-467 생성기 표지) ---- */
  /* ============ 전문적(내 전용 템플릿) 기록하기 & 일정 연동 ============ */
  var DEFAULT_PRO_TEMPLATES = [
    {
      id: 'tpl_health',
      key: 'health',
      icon: '🏋️',
      title: '헬스',
      theme: 'workout',
      desc: '운동종목, 세트, 횟수, 시간, 거리, 강도별 정밀 웨이트 기록',
      columns: ['번호', '운동종목', '세트', '횟수', '시간', '거리', '강도(100점)'],
      defaultRows: [
        ['1', '벤치프레스', '5세트', '10회', '15분', '-', '85점'],
        ['2', '스쿼트', '5세트', '8회', '20분', '-', '90점'],
        ['3', '데드리프트', '4세트', '6회', '18분', '-', '95점'],
        ['4', '바벨로우', '4세트', '12회', '15분', '-', '80점']
      ]
    },
    {
      id: 'tpl_crossfit',
      key: 'crossfit',
      icon: '🔥',
      title: '크로스핏',
      theme: 'workout',
      desc: 'WOD 라운드, 종목, 무게(lb), Reps, 타임캡, Rx 여부 기록',
      columns: ['번호', '라운드/구분', 'WOD 운동종목', '무게(lb/kg)', '반복수(Reps)', '시간/타임캡', 'Rx/Scaled', '비고'],
      defaultRows: [
        ['1', '1R', '쓰러스터 (Thrusters)', '95 lb', '21회', '02:15', 'Rx\'d', '호흡 조절'],
        ['2', '1R', '풀업 (Pull-ups)', '-', '21회', '01:45', 'Rx\'d', '언브로큰'],
        ['3', '2R', '쓰러스터 (Thrusters)', '95 lb', '15회', '01:50', 'Rx\'d', '2분할'],
        ['4', '2R', '풀업 (Pull-ups)', '-', '15회', '01:30', 'Rx\'d', '-'],
        ['5', '3R', '쓰러스터 (Thrusters)', '95 lb', '9회', '01:10', 'Rx\'d', '스퍼트'],
        ['6', '3R', '풀업 (Pull-ups)', '-', '9회', '00:55', 'Rx\'d', '완료 (09:25)']
      ]
    },
    {
      id: 'tpl_hyrox',
      key: 'hyrox',
      icon: '🏃',
      title: '하이록스',
      theme: 'workout',
      desc: '1km 러닝 + 8개 공식 기능성 스테이션 완주 기록',
      columns: ['번호', '종목/스테이션', '세트/랩', '시간', '페이스', '심박수', '강도(100점)'],
      defaultRows: [
        ['1', '1km 러닝 (Run 1)', '1랩', '4분 25초', '4:25/km', '160bpm', '85점'],
        ['2', '스키에르그 (SkiErg)', '1,000m', '3분 55초', '1:57/500m', '170bpm', '90점'],
        ['3', '슬레드 푸시 (Sled Push)', '50m (152kg)', '2분 15초', '-', '178bpm', '95점'],
        ['4', '슬레드 풀 (Sled Pull)', '50m (103kg)', '3분 20초', '-', '175bpm', '92점'],
        ['5', '버피 브로드점프 (Burpee Broad Jumps)', '80m', '3분 30초', '-', '182bpm', '98점'],
        ['6', '로잉 (Rowing)', '1,000m', '3분 50초', '1:55/500m', '172bpm', '88점'],
        ['7', '파머스 캐리 (Farmers Carry)', '200m (2x24kg)', '1분 50초', '-', '168bpm', '85점'],
        ['8', '샌드백 런지 (Sandbag Lunges)', '100m (20kg)', '3분 45초', '-', '176bpm', '94점'],
        ['9', '월볼샷 (Wall Balls)', '100회 (6kg)', '4분 15초', '-', '185bpm', '100점']
      ]
    },
    {
      id: 'tpl_study',
      key: 'study',
      icon: '📚',
      title: '공부',
      theme: 'study',
      desc: '과목/주제, 학습내용, 공부시간, 집중도 기록',
      columns: ['번호', '과목/주제', '학습내용', '공부시간(분)', '페이지/범위', '집중도(100점)', '복습필요'],
      defaultRows: [
        ['1', '영어 토익', 'RC Part 5 문법 기출 풀이', '60분', 'p.120 ~ p.145', '90점', 'N'],
        ['2', '코딩 알고리즘', '백준 골드 DP 문제 풀이', '90분', '2문제 풀이 완료', '85점', 'Y']
      ]
    },
    {
      id: 'tpl_business',
      key: 'business',
      icon: '💼',
      title: '영업',
      theme: 'business',
      desc: '고객사, 미팅형태, 논의내용, 제안금액, 계약가능성 추적',
      columns: ['번호', '고객/사명', '미팅형태', '논의내용', '제안금액', '계약가능성(%)', '다음액션'],
      defaultRows: [
        ['1', '(주)에이비씨', '대면 미팅', '신규 솔루션 데모 시연 및 견적 협의', '1,500만원', '80%', '다음주 화요일 계약서 초안 발송'],
        ['2', '(주)디이에프', '온라인 화상', '도입 사양 검토 및 세부 견적 조율', '800만원', '60%', '보안 관련 체크리스트 회신']
      ]
    }
  ];
  /* ---- 이전 전 index.html 19247~19251줄(#TASK-ES-467 생성기 표지) ---- */

  function getAllProTemplates(){
    var custom = (L.state.profile && L.state.profile.settings && L.state.profile.settings.proTemplates) || [];
    return DEFAULT_PRO_TEMPLATES.concat(custom);
  }
  /* ---- 이전 전 index.html 19252~19256줄(#TASK-ES-467 생성기 표지) ---- */

  function getProTemplateByKey(key){
    var list = getAllProTemplates();
    return list.find(function(t){ return t.key === key || t.id === key; }) || list[0];
  }
  /* ---- 이전 전 index.html 19257~19271줄(#TASK-ES-467 생성기 표지) ---- */

  function fmtYYMMDD(dateVal){
    if(typeof dateVal === 'string'){
      var m = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if(m){
        return m[1].slice(-2) + m[2] + m[3];
      }
    }
    var d = dateVal ? new Date(dateVal) : new Date();
    if(isNaN(d.getTime())) d = new Date();
    var yy = String(d.getFullYear()).slice(-2);
    var mm = L.pad(d.getMonth()+1);
    var dd = L.pad(d.getDate());
    return yy + mm + dd;
  }
  /* ---- 이전 전 index.html 19272~19408줄(#TASK-ES-467 생성기 표지) ---- */

  /* 🧠 AI 줄글 속성 및 행/열 분석기 */
  function parseNaturalLanguageTemplateSpec(query, proseDesc, existingCols, existingRows){
    var q = (query || '').trim();
    var desc = (proseDesc || '').trim();
    var fullText = (q + ' ' + desc).toLowerCase();

    // 1. 기본 템플릿 추천 기반 가져오기 (정밀 테마 식별)
    var baseRec = recommendTemplateFromAI(q || desc);
    var title = q ? (q.length > 12 ? q.slice(0, 12) : q) : baseRec.title;
    var icon = baseRec.icon;
    var theme = baseRec.theme;
    var columns = baseRec.columns.slice();
    var defaultRows = baseRec.defaultRows ? baseRec.defaultRows.map(function(r){ return r.slice(); }) : [];
    var explanation = '';

    // 2. 줄글(desc)에서 열(columns) 명시적 추출
    var colMatch = desc.match(/(?:열|속성|컬럼|항목)(?:은|는|을|를|으로)?\s*[:=]?\s*['"‘“]([^'"\r\n]+)['"’”]/i) ||
                   desc.match(/(?:열|속성|컬럼|항목)(?:은|는|을|를|으로)?\s*[:=]?\s*([^\r\n]+?)(?:으로|로)?\s*(?:해줘|해주고|해주|하고|만들어|설정|지정|추가|구성)/i) ||
                   desc.match(/(?:열|속성|컬럼)\s*[:=]\s*([^\r\n]+)/i);

    if(colMatch && colMatch[1]){
      var rawCols = colMatch[1].split(/[,/·|、\t]/).map(function(s){
        return s.replace(/['"‘“’”]/g, '').trim();
      }).filter(function(s){ return s.length > 0 && !/^(?:해줘|해주고|해주|하고|으로|로|입니다)$/.test(s); });

      if(rawCols.length > 0){
        columns = rawCols;
        if(columns[0] !== '번호') columns.unshift('번호');
        explanation += '사용자 지정 열 속성(' + columns.slice(1).join(', ') + ')을 반영했습니다. ';
      }
    }

    // 3. 줄글에서 개별 열 추가/제거 명령 파싱
    var addColMatch = desc.match(/(?:열|속성|컬럼)(?:에)?\s*['"‘“]?([^'"`\r\n]+?)['"’”]?\s*(?:추가|넣어)/i);
    if(addColMatch && addColMatch[1]){
      var colToAdd = addColMatch[1].replace(/['"‘“’”]/g, '').trim();
      if(colToAdd && !columns.includes(colToAdd)){
        columns.push(colToAdd);
        explanation += '[' + colToAdd + '] 열을 추가했습니다. ';
      }
    }
    var delColMatch = desc.match(/(?:열|속성|컬럼)(?:에서)?\s*['"‘“]?([^'"`\r\n]+?)['"’”]?\s*(?:빼줘|삭제|제거)/i);
    if(delColMatch && delColMatch[1]){
      var colToDel = delColMatch[1].replace(/['"‘“’”]/g, '').trim();
      var dIdx = columns.indexOf(colToDel);
      if(dIdx > 0){
        columns.splice(dIdx, 1);
        explanation += '[' + colToDel + '] 열을 제거했습니다. ';
      }
    }

    // 4. 줄글에서 행(rows) 명시적 요청 파싱
    if(/(?:하이록스.*(?:8|모든|전체)|8.*(?:종목|스테이션))/i.test(fullText)){
      title = q || '하이록스';
      icon = '🏃';
      theme = 'workout';
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
      explanation += '하이록스 공식 8대 스테이션과 1km 러닝을 포함한 9개 행을 모두 구성했습니다. ';
    }
    else if(/(?:fran|프란|21-15-9|쓰러스터.*풀업|크로스핏.*와드)/i.test(fullText)){
      title = q || '크로스핏 Fran WOD';
      icon = '🔥';
      theme = 'workout';
      defaultRows = [
        ['1', '1R', '쓰러스터 (Thrusters)', '95 lb', '21 reps', '02:15', 'Rx\'d', '호흡 조절'],
        ['2', '1R', '풀업 (Pull-ups)', '-', '21 reps', '01:45', 'Rx\'d', '언브로큰'],
        ['3', '2R', '쓰러스터 (Thrusters)', '95 lb', '15 reps', '01:50', 'Rx\'d', '2분할'],
        ['4', '2R', '풀업 (Pull-ups)', '-', '15 reps', '01:30', 'Rx\'d', '-'],
        ['5', '3R', '쓰러스터 (Thrusters)', '95 lb', '9 reps', '01:10', 'Rx\'d', '스퍼트'],
        ['6', '3R', '풀업 (Pull-ups)', '-', '9 reps', '00:55', 'Rx\'d', '완료']
      ];
      explanation += '크로스핏 대표 벤치마크 와드(Fran: 21-15-9) 기준 6개 라운드 행을 구성했습니다. ';
    }
    else if(/(?:모의고사|오답|문제|공인중개사|민법)/i.test(fullText)){
      title = q || '모의고사 오답노트';
      icon = '📝';
      theme = 'study';
      defaultRows = [
        ['1', '민법총칙', '1번~10번', '8/10 (80%)', '통정허위표시 제3자 범위 혼동', '15분', '상', 'D+1 복습'],
        ['2', '물권법', '11번~20번', '7/10 (70%)', '점유취득시효 완성 후 등기 청구권', '18분', '특상', 'D+1 복습'],
        ['3', '부동산학개론', '1번~15번', '13/15 (87%)', '탄력성 계산 공식 실수', '14분', '중', '주말 복습']
      ];
      explanation += '모의고사 문항별 정답률 및 오답원인 분석용 3개 행을 구성했습니다. ';
    }
    else {
      var rowMatch = desc.match(/(?:행|종목|데이터)(?:은|는|으로)?\s*[:=]?\s*([^\r\n]+?)(?:으로|로)?\s*(?:해줘|만들어|채워|넣어)/i);
      if(rowMatch && rowMatch[1]){
        var items = rowMatch[1].split(/[,/·|、]/).map(function(s){ return s.trim(); }).filter(Boolean);
        if(items.length){
          defaultRows = items.map(function(item, idx){
            return columns.map(function(col, cIdx){
              if(cIdx === 0) return String(idx + 1);
              if(cIdx === 1) return item;
              return '';
            });
          });
          explanation += items.length + '개 요청 종목 행을 생성했습니다. ';
        }
      }
    }

    if(defaultRows.length > 0){
      defaultRows = defaultRows.map(function(r, rIdx){
        var newR = [];
        for(var i=0; i<columns.length; i++){
          newR[i] = (r[i] !== undefined) ? r[i] : (i===0 ? String(rIdx+1) : '');
        }
        return newR;
      });
    } else {
      defaultRows = [columns.map(function(c, i){ return i===0 ? '1' : ''; })];
    }

    if(!explanation){
      explanation = 'AI가 [' + title + '] 주제에 최적화된 ' + columns.length + '개 속성과 ' + defaultRows.length + '개 행을 구성했습니다.';
    }

    return {
      title: title,
      icon: icon,
      theme: theme,
      columns: columns,
      defaultRows: defaultRows,
      explanation: explanation
    };
  }
  /* ---- 이전 전 index.html 19409~19638줄(#TASK-ES-467 생성기 표지) ---- */

  function recommendTemplateFromAI(query, proseDesc){
    if(proseDesc && typeof proseDesc === 'string' && proseDesc.trim().length > 0){
      return parseNaturalLanguageTemplateSpec(query, proseDesc);
    }
    var q = (query || '').trim();
    var qLow = q.toLowerCase();

    // 1. 크로스핏 / 와드 (CrossFit / WOD) - 하이록스와 완전 분리
    if(/(?:크로스핏|와드|wod|crossfit|fran|cindy|murph|박스)/i.test(qLow)){
      var cfTitle = q || '크로스핏 와드';
      return {
        title: cfTitle,
        icon: '🔥',
        theme: 'workout',
        columns: ['번호', '라운드/구분', 'WOD 운동종목', '무게(lb/kg)', '반복수(Reps)', '시간/타임캡', 'Rx/Scaled', '비고'],
        defaultRows: [
          ['1', '1R', '쓰러스터 (Thrusters)', '95 lb', '21회', '02:15', 'Rx\'d', '호흡 조절'],
          ['2', '1R', '풀업 (Pull-ups)', '-', '21회', '01:45', 'Rx\'d', '언브로큰'],
          ['3', '2R', '쓰러스터 (Thrusters)', '95 lb', '15회', '01:50', 'Rx\'d', '2분할'],
          ['4', '2R', '풀업 (Pull-ups)', '-', '15회', '01:30', 'Rx\'d', '-'],
          ['5', '3R', '쓰러스터 (Thrusters)', '95 lb', '9회', '01:10', 'Rx\'d', '스퍼트'],
          ['6', '3R', '풀업 (Pull-ups)', '-', '9회', '00:55', 'Rx\'d', '완료 (09:25)']
        ]
      };
    }

    // 2. 하이록스 (Hyrox) - 8대 공식 스테이션 풀세트 (총 9행)
    if(/(?:하이록스|hyrox)/i.test(qLow)){
      return {
        title: '하이록스',
        icon: '🏃',
        theme: 'workout',
        columns: ['번호', '종목/스테이션', '세트/랩', '시간', '페이스', '심박수', '강도(100점)'],
        defaultRows: [
          ['1', '1km 러닝 (Run 1)', '1랩', '4분 25초', '4:25/km', '160bpm', '85점'],
          ['2', '스키에르그 (SkiErg)', '1,000m', '3분 55초', '1:57/500m', '170bpm', '90점'],
          ['3', '슬레드 푸시 (Sled Push)', '50m (152kg)', '2분 15초', '-', '178bpm', '95점'],
          ['4', '슬레드 풀 (Sled Pull)', '50m (103kg)', '3분 20초', '-', '175bpm', '92점'],
          ['5', '버피 브로드점프 (Burpee Broad Jumps)', '80m', '3분 30초', '-', '182bpm', '98점'],
          ['6', '로잉 (Rowing)', '1,000m', '3분 50초', '1:55/500m', '172bpm', '88점'],
          ['7', '파머스 캐리 (Farmers Carry)', '200m (2x24kg)', '1분 50초', '-', '168bpm', '85점'],
          ['8', '샌드백 런지 (Sandbag Lunges)', '100m (20kg)', '3분 45초', '-', '176bpm', '94점'],
          ['9', '월볼샷 (Wall Balls)', '100회 (6kg)', '4분 15초', '-', '185bpm', '100점']
        ]
      };
    }

    // 3. 공인중개사 / 자격증 / 모의고사 / 오답노트
    if(/(?:공인중개사|민법|학개론|세법|공법|모의고사|오답|기출)/i.test(qLow)){
      var examTitle = q || '모의고사 오답노트';
      return {
        title: examTitle,
        icon: '📝',
        theme: 'study',
        columns: ['번호', '과목/영역', '문제번호/범위', '정답여부(O/X)', '오답원인/핵심개념', '소요시간', '중요도', '복습예정'],
        defaultRows: [
          ['1', '민법총칙', '1번~10번', '8/10 (80%)', '통정허위표시 제3자 범위 혼동', '15분', '상', 'D+1 복습'],
          ['2', '물권법', '11번~20번', '7/10 (70%)', '점유취득시효 완성 후 등기 청구권', '18분', '특상', 'D+1 복습'],
          ['3', '부동산학개론', '1번~15번', '13/15 (87%)', '탄력성 계산 공식 부호 착오', '14분', '중', '주말 복습']
        ]
      };
    }

    // 4. 토익 / 어학 / 영어
    if(/(?:토익|toeic|영어|회화|오픽|토플|단어|보카)/i.test(qLow)){
      var engTitle = q || '영어/토익';
      return {
        title: engTitle,
        icon: '🗣️',
        theme: 'study',
        columns: ['번호', '파트/유형', '학습지문/교재', '핵심단어/표현', '쉐도잉횟수', '정답률(%)', '소요시간', '오답노트'],
        defaultRows: [
          ['1', 'Part 5', '실전문법 100제', 'consecutive, unprecedented', '3회', '85%', '25분', '접속부사 vs 접속사 자리 구분'],
          ['2', 'Part 7', '이중지문 독해', 'accommodate, reschedule', '2회', '90%', '35분', '패러프레이징 단어 정리']
        ]
      };
    }

    // 5. 코딩 / 알고리즘 / 개발
    if(/(?:코딩|알고리즘|개발|백준|프로그래머스|리트코드|깃허브)/i.test(qLow)){
      var codeTitle = q || '코딩 알고리즘';
      return {
        title: codeTitle,
        icon: '💻',
        theme: 'study',
        columns: ['번호', '문제명/기능', '플랫폼/난이도', '알고리즘/자료구조', '시간복잡도', '통과여부', '소요시간', '핵심로직'],
        defaultRows: [
          ['1', '두 수의 합', 'LeetCode (Easy)', 'Hash Table', 'O(N)', 'Pass', '12분', '원패스 해시맵으로 O(1) 탐색'],
          ['2', '네트워크 연결', '백준 (Gold 4)', 'MST / 크루스칼', 'O(E log E)', 'Pass', '35분', 'Union-Find 사이클 체크']
        ]
      };
    }

    // 6. 독서 / 서평
    if(/(?:독서|책|서평|독서노트|북리뷰)/i.test(qLow)){
      var bookTitle = q || '독서 서평';
      return {
        title: bookTitle,
        icon: '📖',
        theme: 'study',
        columns: ['번호', '도서명', '저자', '읽은페이지', '인상깊은 문장/핵심요약', '적용점/액션', '평점(5점)'],
        defaultRows: [
          ['1', '원씽 (The ONE Thing)', '게리 켈러', 'p.1~85', '단 하나의 도미노를 쓰러뜨려라', '오전 2시간 핵심 목표에만 집중', '5.0']
        ]
      };
    }

    // 7. 주식 / 트레이딩 매매일지
    if(/(?:주식|매매|코인|비트코인|가상화폐|트레이딩|차트)/i.test(qLow)){
      var stockTitle = q || '주식 매매일지';
      return {
        title: stockTitle,
        icon: '📈',
        theme: 'business',
        columns: ['번호', '종목명/티커', '매매구분', '매수가', '매도가', '수량', '수익률(%)', '매매근거/원칙'],
        defaultRows: [
          ['1', '삼성전자 (005930)', '분할매수', '72,000원', '-', '30주', '-', '20일선 지지 반등 확인'],
          ['2', 'SK하이닉스', '익절매도', '175,000원', '192,000원', '15주', '+9.7%', '저항선 도달 분할 익절']
        ]
      };
    }

    // 8. 헬스 / 웨이트 (단위 테스트 호환)
    if(/(?:헬스|웨이트|근력|보디빌딩|피트니스|pt|쇠질|가슴|등|하체)/i.test(qLow)){
      var wTitle = (q && q.length <= 8) ? q : '헬스';
      return {
        title: wTitle,
        icon: '🏋️',
        theme: 'workout',
        columns: ['번호', '운동종목', '세트', '횟수', '시간', '거리', '강도(100점)'],
        defaultRows: [
          ['1', '벤치프레스', '5세트', '10회', '15분', '-', '85점'],
          ['2', '스쿼트', '5세트', '8회', '20분', '-', '90점']
        ]
      };
    }

    // 9. 공부 일반 (단위 테스트 호환)
    if(/(?:공부|학습|시험|자격증|수능|강의)/i.test(qLow)){
      var sTitle = (q && q.length <= 8) ? q : '공부';
      return {
        title: sTitle,
        icon: '📚',
        theme: 'study',
        columns: ['번호', '과목/주제', '학습내용', '공부시간(분)', '페이지/범위', '집중도(100점)', '복습필요'],
        defaultRows: [
          ['1', '핵심 개념 학습', '1챕터 이론 요약 및 문제 풀이', '60분', 'p.10~35', '90점', 'N']
        ]
      };
    }

    // 10. 영업 / 세일즈 (단위 테스트 호환)
    if(/(?:영업|세일즈|고객|바이어|미팅|계약|상담|매출)/i.test(qLow)){
      var bTitle = (q && q.length <= 8) ? q : '영업';
      return {
        title: bTitle,
        icon: '💼',
        theme: 'business',
        columns: ['번호', '고객/사명', '미팅형태', '논의내용', '제안금액', '계약가능성(%)', '다음액션'],
        defaultRows: [
          ['1', '주요 고객사', '방문 미팅', '제안 프레젠테이션 및 Q&A', '2,000만원', '75%', '견적서 및 세부 기획안 송부']
        ]
      };
    }

    // 11. 러닝
    if(/(?:러닝|달리기|마라톤|조깅|트레일)/i.test(qLow)){
      return {
        title: q || '러닝',
        icon: '👟',
        theme: 'workout',
        columns: ['번호', '코스/구간', '거리(km)', '소요시간', '평균페이스', '심박수', '강도(100점)'],
        defaultRows: [
          ['1', '한강 러닝 코스', '7.5km', '38분 20초', '5:06/km', '158bpm', '85점']
        ]
      };
    }

    // 12. 식단
    if(/(?:식단|다이어트|칼로리|영양|탄단지|체중)/i.test(qLow)){
      return {
        title: q || '식단',
        icon: '🥗',
        theme: 'daily',
        columns: ['번호', '식사구분', '메뉴/음식명', '칼로리(kcal)', '단백질(g)', '수분(ml)', '만족도(100점)'],
        defaultRows: [
          ['1', '점심', '닭가슴살 샐러드 & 현미밥', '450kcal', '32g', '500ml', '90점']
        ]
      };
    }

    // 13. 골프
    if(/(?:골프|연습장|라운딩|스크린)/i.test(qLow)){
      return {
        title: q || '골프',
        icon: '⛳',
        theme: 'workout',
        columns: ['번호', '클럽종류', '연습타수', '비거리(m)', '구질/탄도', '타격감(100점)', '교정포인트'],
        defaultRows: [
          ['1', '7번 아이언', '50타', '145m', '스트레이트/보통', '85점', '백스윙 탑에서 템포 유지']
        ]
      };
    }

    // 14. 수영
    if(/(?:수영|영법|풀장)/i.test(qLow)){
      return {
        title: q || '수영',
        icon: '🏊',
        theme: 'workout',
        columns: ['번호', '영법구분', '거리(m)', '세트/랩', '소요시간', '인터벌', '강도(100점)'],
        defaultRows: [
          ['1', '자유형 웜업', '400m', '8랩', '8분 30초', '-', '75점']
        ]
      };
    }

    // 15. 사용자 정의 모든 세부 입력 (Custom exact topic)
    var customTitle = q ? (q.length > 10 ? q.slice(0, 10) : q) : '맞춤기록';
    return {
      title: customTitle,
      icon: '📝',
      theme: 'daily',
      columns: ['번호', '구분/항목', '세부내용', '수치/측정값', '소요시간', '강도/만족도(100점)'],
      defaultRows: [
        ['1', '1회차 실천', '핵심 활동 완료', '목표 달성', '30분', '90점']
      ]
    };
  }

  K.DEFAULT_PRO_TEMPLATES = DEFAULT_PRO_TEMPLATES;
  K.getAllProTemplates = getAllProTemplates;
  K.getProTemplateByKey = getProTemplateByKey;
  K.fmtYYMMDD = fmtYYMMDD;
  K.parseNaturalLanguageTemplateSpec = parseNaturalLanguageTemplateSpec;
  K.recommendTemplateFromAI = recommendTemplateFromAI;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
